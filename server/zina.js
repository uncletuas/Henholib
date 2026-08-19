"use strict";

/**
 * Zina — the Loopital control plane API.
 *
 * Everything that used to be split across senate (Swift), ministry (Modus),
 * assembly (Pal) and academia (Beacon) is answered here, for one signed-in
 * superadmin, across every app at once: who the users are, what they paid, what
 * was emailed to them, which keys each app runs on, whether its database is up,
 * and what support is waiting.
 *
 * Two rules shape the whole module.
 *
 * 1. **Zina federates, it does not absorb.** Ecosystem-wide facts — identity,
 *    money, notification, support, credentials — live in loopital's own schema
 *    because that is where they already converged. An app's domain data is read
 *    live over its ops connector (server/connectors.js). Zina never holds a
 *    second copy of Beacon's students or Modus's work orders.
 *
 * 2. **A role is checked on the server, every time.** The superadmin sees
 *    everything, but the per-app operational roles the user wanted to keep are
 *    real: a Modus-scoped support agent signing in here gets Modus's tickets and
 *    nothing else, enforced in `requireStaff`, not by hiding a nav item.
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { sql, pool } = require("./db");
const connectors = require("./connectors");
const { SERVICES } = require("./service-catalog");
const vault = require("./vault");
const { sendNotification } = require("./notify");

const TOKEN_TTL = "12h";
const SWITCH_TOKEN_TTL = 120; // seconds — long enough to redirect, short enough to be useless if leaked

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

// ── Roles ──────────────────────────────────────────────────────────────────
// Same shape as the tenant RBAC each app already uses: ask "may this person do
// X", never "is this person an Engineer", so a role is re-scoped in one place.

const ROLES = ["superadmin", "operations", "finance", "engineering", "support", "analyst"];

const ROLE_LABELS = {
  superadmin: "Superadmin",
  operations: "Operations",
  finance: "Finance",
  engineering: "Engineering",
  support: "Support",
  analyst: "Analyst",
};

const ROLE_DESCRIPTIONS = {
  superadmin: "Everything, everywhere, including staff, keys and stepping into any app.",
  operations: "Users, subscriptions, support and the day-to-day running of the apps.",
  finance: "Payments, plans and revenue. Reads users; changes no accounts.",
  engineering: "Health, databases, connectors and credentials. No customer money.",
  support: "The support queue, and enough of a customer's account to help them.",
  analyst: "Reads usage and growth across the group. Changes nothing.",
};

const PERMISSIONS = [
  "app:read", "app:manage", "app:switch",
  "user:read", "user:manage",
  "billing:read", "billing:manage",
  "notify:read", "notify:send",
  "support:read", "support:respond",
  "secret:read", "secret:reveal", "secret:manage",
  "system:read", "system:manage",
  "analytics:read",
  "staff:manage",
  "audit:read",
];

const ROLE_PERMISSIONS = {
  superadmin: [...PERMISSIONS],

  operations: [
    "app:read", "app:switch",
    "user:read", "user:manage",
    "billing:read",
    "notify:read", "notify:send",
    "support:read", "support:respond",
    "system:read",
    "analytics:read",
    "audit:read",
  ],

  finance: ["app:read", "user:read", "billing:read", "billing:manage", "analytics:read", "audit:read"],

  engineering: [
    "app:read", "app:manage", "app:switch",
    "user:read",
    "notify:read",
    "secret:read", "secret:reveal", "secret:manage",
    "system:read", "system:manage",
    "analytics:read",
    "audit:read",
  ],

  support: ["app:read", "user:read", "support:read", "support:respond", "notify:read", "billing:read"],

  // Read-only by design: an analyst who can also change what they measure is
  // measuring something else.
  analyst: ["app:read", "user:read", "billing:read", "analytics:read", "notify:read"],
};

function permissionsFor(role) {
  return new Set(ROLE_PERMISSIONS[role] || []);
}

// ── Authentication ─────────────────────────────────────────────────────────

/**
 * Emails that become a superadmin on first sign-in.
 *
 * The bootstrap problem: staff rows are created from inside Zina, and there is
 * nobody to create the first one. An allowlist in the environment solves it
 * without a seeded password in the repo, and keeps working as a recovery path
 * if the last superadmin row is ever deleted.
 */
function superadminAllowlist() {
  return String(process.env.ZINA_SUPERADMINS || "")
    .split(/[,\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function zinaSecret() {
  // A separate secret from the customer session JWT: a stolen customer token
  // must never be presentable as a staff token, whatever else goes wrong.
  return process.env.ZINA_JWT_SECRET || process.env.JWT_SECRET || "";
}

function bearer(headers) {
  const auth = (headers && (headers.authorization || headers.Authorization)) || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

/**
 * Resolve the caller to a staff member, or return the response to send instead.
 *
 * `appScope` narrows what the caller may touch. An empty scope means the whole
 * ecosystem; a non-empty one is a hard filter applied to every query below,
 * which is why it is returned rather than merely checked.
 */
async function requireStaff(headers, permission = null) {
  const token = bearer(headers);
  if (!token) return { error: json(401, { error: "Please sign in." }) };

  let payload;
  try {
    payload = jwt.verify(token, zinaSecret(), { audience: "zina" });
  } catch (_) {
    return { error: json(401, { error: "Your session has expired. Please sign in again." }) };
  }

  const rows = await sql(
    `SELECT s.id, s.user_id, s.role, s.title, s.app_scope, s.is_active, u.name, u.email, u.avatar_url
       FROM zina_staff s JOIN users u ON u.id = s.user_id
      WHERE s.id = :id::uuid`,
    { id: payload.sub }
  );
  if (!rows.length || rows[0].is_active !== true) {
    return { error: json(403, { error: "This account no longer has access to Zina." }) };
  }

  const staff = {
    id: rows[0].id,
    userId: rows[0].user_id,
    role: rows[0].role,
    title: rows[0].title,
    name: rows[0].name,
    email: rows[0].email,
    avatarUrl: rows[0].avatar_url,
    appScope: Array.isArray(rows[0].app_scope) ? rows[0].app_scope : [],
    permissions: permissionsFor(rows[0].role),
  };

  if (permission && !staff.permissions.has(permission)) {
    // 403 with a plain reason rather than a 404: unlike a tenant portal, the set
    // of screens here is not itself a secret, and an operator who can't do
    // something is better told than left wondering why a page is blank.
    return { error: json(403, { error: "Your role doesn't include that." }) };
  }

  // Touch last_seen without blocking the request.
  sql("UPDATE zina_staff SET last_seen = now() WHERE id = :id::uuid", { id: staff.id }).catch(() => {});

  return { staff };
}

/** Whether this staff member may act on this app at all. */
function inScope(staff, appId) {
  if (!staff.appScope.length) return true;
  return staff.appScope.includes(appId);
}

/** Filter a list of apps down to what this staff member may see. */
function scopedApps(staff, apps) {
  if (!staff.appScope.length) return apps;
  return apps.filter((a) => staff.appScope.includes(a.id));
}

async function audit(staff, action, { appId = null, target = null, detail = null, headers = null } = {}) {
  const ip =
    (headers && (headers["x-forwarded-for"] || headers["X-Forwarded-For"] || "").split(",")[0].trim()) ||
    null;
  await sql(
    `INSERT INTO zina_audit (staff_id, actor_email, app_id, action, target, detail, ip)
     VALUES (:staff::uuid, :email, :app, :action, :target, :detail::jsonb, :ip)`,
    {
      staff: staff ? staff.id : null,
      email: staff ? staff.email : null,
      app: appId,
      action,
      target,
      detail: detail ? JSON.stringify(detail) : null,
      ip,
    }
  ).catch((e) => console.error("audit write failed:", e.message));
}

/**
 * Sign in to Zina.
 *
 * The same account system as the rest of the ecosystem — one identity, one
 * password — but standing here comes only from a `zina_staff` row, or from the
 * bootstrap allowlist which creates one.
 */
async function login(body, headers) {
  const email = String((body && body.email) || "").trim().toLowerCase();
  const password = (body && body.password) || "";
  if (!email || !password) return json(400, { error: "Enter your email and password." });
  if (!zinaSecret()) return json(503, { error: "Zina isn't configured yet (no signing secret)." });

  const users = await sql(
    "SELECT id, name, email, password_hash, avatar_url FROM users WHERE email = :email",
    { email }
  );
  // The same message whether the account is missing, the password is wrong, or
  // the account exists but isn't staff — none of those should be discoverable
  // by trying emails against this endpoint.
  const denied = json(401, { error: "Invalid email or password." });
  if (!users.length) return denied;

  const ok = await bcrypt.compare(password, users[0].password_hash || "");
  if (!ok) return denied;

  const user = users[0];
  let staff = (await sql("SELECT * FROM zina_staff WHERE user_id = :id::uuid", { id: user.id }))[0];

  if (!staff && superadminAllowlist().includes(email)) {
    staff = (
      await sql(
        `INSERT INTO zina_staff (user_id, role, title, app_scope, is_active)
         VALUES (:id::uuid, 'superadmin', 'Founder', '{}', true) RETURNING *`,
        { id: user.id }
      )
    )[0];
    await audit({ id: staff.id, email }, "staff.bootstrap", { target: email, headers });
  }

  if (!staff) return denied;
  if (staff.is_active !== true) return json(403, { error: "This account has been deactivated." });

  const token = jwt.sign({ sub: staff.id, email: user.email, role: staff.role }, zinaSecret(), {
    expiresIn: TOKEN_TTL,
    audience: "zina",
  });

  await audit({ id: staff.id, email: user.email }, "auth.login", { headers });

  return json(200, {
    token,
    staff: {
      id: staff.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatar_url,
      role: staff.role,
      roleLabel: ROLE_LABELS[staff.role],
      title: staff.title,
      appScope: Array.isArray(staff.app_scope) ? staff.app_scope : [],
      permissions: [...permissionsFor(staff.role)],
    },
  });
}

async function whoami(headers) {
  const { staff, error } = await requireStaff(headers);
  if (error) return error;
  return json(200, {
    staff: {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      avatarUrl: staff.avatarUrl,
      role: staff.role,
      roleLabel: ROLE_LABELS[staff.role],
      title: staff.title,
      appScope: staff.appScope,
      permissions: [...staff.permissions],
    },
  });
}

// ── Overview: the whole group on one screen ────────────────────────────────

/**
 * The "everything at a glance" figures.
 *
 * Local numbers (accounts, money, email, tickets) come straight from loopital's
 * own tables and are exact. Per-app numbers come from connectors and may be
 * missing — an app that is asleep, unconfigured or hasn't implemented `/summary`
 * reports as such rather than as a zero, because a zero here would read as "no
 * customers" and that is a very different thing from "we couldn't ask".
 */
async function overview(headers) {
  const { staff, error } = await requireStaff(headers, "app:read");
  if (error) return error;

  const apps = scopedApps(staff, await connectors.listApps());
  const wide = !staff.appScope.length;

  const [totals, revenue, recentPayments, notifications, tickets, summaries] = await Promise.all([
    wide
      ? sql(`SELECT
               (SELECT count(*) FROM users) AS users,
               (SELECT count(*) FROM users WHERE created_at > now() - interval '30 days') AS new_users,
               (SELECT count(*) FROM subscriptions WHERE status IN ('active','trialing')) AS active_subs,
               (SELECT count(*) FROM waitlist) AS waitlist`)
      : Promise.resolve([{}]),
    wide
      ? sql(`SELECT product,
                    sum(amount_cents) FILTER (WHERE status = 'success') AS gross,
                    count(*) FILTER (WHERE status = 'success') AS paid,
                    count(*) FILTER (WHERE status = 'pending') AS pending
               FROM payments GROUP BY product`)
      : Promise.resolve([]),
    wide
      ? sql(`SELECT p.reference, p.product, p.purpose, p.amount_cents, p.currency, p.status,
                    p.created_at,
                    COALESCE(u.name, p.customer_name)   AS name,
                    COALESCE(u.email, p.customer_email) AS email
               FROM payments p LEFT JOIN users u ON u.id = p.user_id
              ORDER BY p.created_at DESC LIMIT 8`)
      : Promise.resolve([]),
    sql(`SELECT status, count(*) AS n FROM zina_notifications
          WHERE created_at > now() - interval '7 days' GROUP BY status`),
    sql(`SELECT status, count(*) AS n FROM zina_tickets GROUP BY status`),
    connectors.fanOut(apps, "/summary"),
  ]);

  const revenueByProduct = Object.fromEntries(
    revenue.map((r) => [r.product, { grossMinor: Number(r.gross) || 0, paid: Number(r.paid) || 0, pending: Number(r.pending) || 0 }])
  );

  return json(200, {
    scope: staff.appScope,
    totals: {
      users: Number(totals[0]?.users) || 0,
      newUsers30d: Number(totals[0]?.new_users) || 0,
      activeSubscriptions: Number(totals[0]?.active_subs) || 0,
      waitlist: Number(totals[0]?.waitlist) || 0,
      grossMinor: Object.values(revenueByProduct).reduce((sum, r) => sum + r.grossMinor, 0),
    },
    revenueByProduct,
    recentPayments: recentPayments.map(paymentOut),
    notifications7d: Object.fromEntries(notifications.map((r) => [r.status, Number(r.n)])),
    tickets: Object.fromEntries(tickets.map((r) => [r.status, Number(r.n)])),
    apps: apps.map((app) => {
      const result = summaries[app.id];
      return {
        id: app.id,
        name: app.name,
        tagline: app.tagline,
        accent: app.accent,
        appUrl: app.app_url,
        adminUrl: app.admin_url,
        connected: Boolean(app.ops_base_url),
        health: app.health_status || "unknown",
        latencyMs: app.latency_ms,
        checkedAt: app.checked_at,
        summary: result && result.ok ? result.data : null,
        summaryError: result && !result.ok ? result.reason : null,
      };
    }),
  });
}

// ── Apps: the registry, health, and stepping into one ──────────────────────

async function listAppsRoute(headers) {
  const { staff, error } = await requireStaff(headers, "app:read");
  if (error) return error;
  const apps = scopedApps(staff, await connectors.listApps({ includeDisabled: true }));
  return json(200, { apps: apps.map(appOut) });
}

function appOut(app) {
  return {
    id: app.id,
    name: app.name,
    tagline: app.tagline,
    appUrl: app.app_url,
    adminUrl: app.admin_url,
    opsBaseUrl: app.ops_base_url,
    hasSecret: Boolean(app.ops_secret),
    accent: app.accent,
    sortOrder: app.sort_order,
    enabled: app.enabled,
    health: app.health_status || "unknown",
    latencyMs: app.latency_ms,
    dbStatus: app.db_status,
    healthDetail: app.health_detail,
    checkedAt: app.checked_at,
  };
}

async function updateApp(headers, appId, body) {
  const { staff, error } = await requireStaff(headers, "app:manage");
  if (error) return error;
  if (!inScope(staff, appId)) return json(403, { error: "That app is outside your scope." });

  const app = await connectors.getApp(appId);
  if (!app) return json(404, { error: "No such app." });

  const next = {
    name: body.name != null ? String(body.name).trim() : app.name,
    tagline: body.tagline != null ? String(body.tagline).trim() : app.tagline,
    app_url: body.appUrl != null ? String(body.appUrl).trim() : app.app_url,
    admin_url: body.adminUrl != null ? String(body.adminUrl).trim() : app.admin_url,
    ops_base_url: body.opsBaseUrl != null ? String(body.opsBaseUrl).trim() : app.ops_base_url,
    accent: body.accent != null ? String(body.accent).trim() : app.accent,
    enabled: body.enabled != null ? Boolean(body.enabled) : app.enabled,
    // An empty string clears the secret; omitting the field leaves it alone, so
    // saving the form without retyping the secret doesn't wipe it.
    ops_secret: body.opsSecret === undefined ? app.ops_secret : String(body.opsSecret || "") || null,
  };

  const rows = await sql(
    `UPDATE zina_apps SET name = :name, tagline = :tagline, app_url = :app_url,
            admin_url = :admin_url, ops_base_url = :ops, accent = :accent,
            enabled = :enabled, ops_secret = :secret, updated_at = now()
      WHERE id = :id RETURNING *`,
    {
      id: appId,
      name: next.name,
      tagline: next.tagline,
      app_url: next.app_url,
      admin_url: next.admin_url,
      ops: next.ops_base_url,
      accent: next.accent,
      enabled: next.enabled,
      secret: next.ops_secret,
    }
  );

  await audit(staff, "app.update", { appId, target: appId, headers, detail: { fields: Object.keys(body || {}) } });
  return json(200, { app: appOut(rows[0]) });
}

async function checkHealth(headers, appId) {
  const { staff, error } = await requireStaff(headers, "system:read");
  if (error) return error;
  const all = scopedApps(staff, await connectors.listApps({ includeDisabled: true }));
  const apps = appId ? all.filter((a) => a.id === appId) : all;
  if (!apps.length) return json(404, { error: "No such app." });
  const health = await connectors.refreshHealth(apps);
  return json(200, { health });
}

/**
 * One app's dashboard, assembled here.
 *
 * The user's complaint was that they couldn't get into any app's admin. The
 * honest fix is not a better redirect: it is that the thing you wanted to see
 * should be *in* Zina. So this pulls the app's own figures, health, users and
 * metrics over its connector and joins them with what the hub already knows —
 * that app's revenue, subscribers, email and support.
 *
 * A connector that is missing or asleep degrades per-section rather than
 * failing the page: an app with no connector still shows its money and its
 * tickets, because those live here and were never the app's to report.
 */
async function appDashboard(headers, appId) {
  const { staff, error } = await requireStaff(headers, "app:read");
  if (error) return error;
  if (!inScope(staff, appId)) return json(403, { error: "That app is outside your scope." });

  const app = await connectors.getApp(appId);
  if (!app) return json(404, { error: "No such app." });

  const [health, summary, metrics, appUsers, payments, subs, emails, tickets, configVars] =
    await Promise.all([
      connectors.callOps(app, "/health"),
      connectors.callOps(app, "/summary"),
      connectors.callOps(app, "/metrics"),
      connectors.callOps(app, "/users?limit=10"),
      sql(
        `SELECT p.reference, p.product, p.purpose, p.amount_cents, p.currency, p.plan,
                p.credits, p.seats, p.status, p.created_at,
                COALESCE(u.name, p.customer_name) AS name,
                COALESCE(u.email, p.customer_email) AS email
           FROM payments p LEFT JOIN users u ON u.id = p.user_id
          WHERE p.product = :app OR p.source_app = :app
          ORDER BY p.created_at DESC LIMIT 10`,
        { app: appId }
      ),
      sql(
        `SELECT plan, status, count(*) AS n, sum(seats) AS seats
           FROM subscriptions WHERE product = :app GROUP BY plan, status`,
        { app: appId }
      ),
      sql(
        `SELECT status, count(*) AS n FROM zina_notifications
          WHERE app_id = :app AND created_at > now() - interval '30 days' GROUP BY status`,
        { app: appId }
      ),
      sql(
        `SELECT id, subject, requester_email, status, priority, updated_at
           FROM zina_tickets WHERE app_id = :app
          ORDER BY updated_at DESC LIMIT 10`,
        { app: appId }
      ),
      sql(
        `SELECT env_var, label, rotated_at FROM zina_secrets
          WHERE app_id = :app AND env_var IS NOT NULL AND env_var <> ''
          ORDER BY env_var`,
        { app: appId }
      ),
    ]);

  const revenue = payments
    .filter((p) => p.status === "success")
    .reduce((sum, p) => sum + (Number(p.amount_cents) || 0), 0);

  // Record the health we just measured, so the overview stays current without
  // a second round of calls.
  const measured = connectors.healthFromResult(health);
  await sql(
    `INSERT INTO zina_app_health (app_id, status, latency_ms, version, db_status, detail, checked_at)
     VALUES (:id, :status, :latency::int, :version, :db, :detail, now())
     ON CONFLICT (app_id) DO UPDATE
       SET status = :status, latency_ms = :latency::int, version = :version,
           db_status = :db, detail = :detail, checked_at = now()`,
    {
      id: appId,
      status: measured.status,
      latency: measured.latency_ms,
      version: measured.version,
      db: measured.db_status,
      detail: measured.detail,
    }
  ).catch(() => {});

  const section = (result) => ({
    available: Boolean(result.ok),
    reason: result.ok ? null : result.reason,
    detail: result.ok ? null : result.detail || null,
    data: result.ok ? result.data : null,
  });

  return json(200, {
    app: {
      id: app.id,
      name: app.name,
      tagline: app.tagline,
      accent: app.accent,
      appUrl: app.app_url,
      adminUrl: app.admin_url,
      connected: Boolean(app.ops_base_url),
      hasSecret: Boolean(app.ops_secret || process.env.ZINA_OPS_SECRET),
    },
    health: { ...measured, latencyMs: measured.latency_ms },
    summary: section(summary),
    metrics: section(metrics),
    users: section(appUsers),
    money: {
      recentPayments: payments.map(paymentOut),
      collectedMinor: revenue,
      subscriptions: subs.map((s) => ({
        plan: s.plan,
        status: s.status,
        count: Number(s.n),
        seats: Number(s.seats) || 0,
      })),
    },
    email30d: Object.fromEntries(emails.map((e) => [e.status, Number(e.n)])),
    tickets: tickets.map((t) => ({
      id: t.id,
      subject: t.subject,
      email: t.requester_email,
      status: t.status,
      priority: t.priority,
      updatedAt: t.updated_at,
    })),
    config: configVars.map((c) => ({
      envVar: c.env_var,
      label: c.label,
      rotatedAt: c.rotated_at,
    })),
  });
}

/**
 * Step into an app as this staff member.
 *
 * The app mints its own admin session — Zina only vouches for who is asking and
 * with what standing. Two things are handed over: a signed assertion the app can
 * verify offline, and the call itself, which is already signed with the shared
 * connector secret. An app that hasn't implemented `/admin-session` falls back
 * to its plain admin URL, so "manage directly" still goes somewhere useful.
 */
async function switchInto(headers, appId) {
  const { staff, error } = await requireStaff(headers, "app:switch");
  if (error) return error;
  if (!inScope(staff, appId)) return json(403, { error: "That app is outside your scope." });

  const app = await connectors.getApp(appId);
  if (!app) return json(404, { error: "No such app." });

  const assertion = jwt.sign(
    {
      sub: staff.userId,
      staffId: staff.id,
      email: staff.email,
      name: staff.name,
      role: staff.role,
      permissions: [...staff.permissions],
    },
    zinaSecret(),
    { expiresIn: SWITCH_TOKEN_TTL, audience: `zina:${appId}`, issuer: "zina" }
  );

  const result = await connectors.callOps(app, "/admin-session", {
    method: "POST",
    body: { assertion, email: staff.email, name: staff.name, role: staff.role },
  });

  await audit(staff, "app.switch", { appId, target: appId, headers });

  if (result.ok && result.data && result.data.url) {
    return json(200, { url: result.data.url, mode: "session" });
  }
  if (app.admin_url) {
    // No connector handshake available yet: send them to the app's own admin
    // sign-in rather than a dead end, and say why they'll be asked to log in.
    return json(200, {
      url: app.admin_url,
      mode: "link",
      note:
        result.reason === "unconfigured"
          ? "This app has no Zina connector yet, so it will ask you to sign in."
          : "This app's connector didn't hand back a session, so it will ask you to sign in.",
    });
  }
  return json(502, { error: `${app.name} isn't reachable for management yet.` });
}

// ── Users: one directory across the group ──────────────────────────────────

function userOut(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    username: row.username || null,
    avatarUrl: row.avatar_url || null,
    createdAt: row.created_at,
    products: row.products || [],
    palPlan: row.pal_plan || null,
  };
}

async function listUsers(headers, qs) {
  const { staff, error } = await requireStaff(headers, "user:read");
  if (error) return error;

  const q = String(qs("q") || "").trim();
  const limit = Math.min(200, Math.max(1, Number(qs("limit")) || 50));
  const offset = Math.max(0, Number(qs("offset")) || 0);

  const rows = await sql(
    `SELECT u.id, u.name, u.email, u.username, u.avatar_url, u.created_at,
            COALESCE(
              array_agg(s.product) FILTER (WHERE s.product IS NOT NULL AND s.status IN ('active','trialing')),
              '{}'::text[]
            ) AS products
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id
      WHERE (:q = '' OR u.email ILIKE '%' || :q || '%' OR u.name ILIKE '%' || :q || '%')
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT :limit::int OFFSET :offset::int`,
    { q, limit, offset }
  );

  const counted = await sql(
    `SELECT count(*) AS n FROM users
      WHERE (:q = '' OR email ILIKE '%' || :q || '%' OR name ILIKE '%' || :q || '%')`,
    { q }
  );

  return json(200, {
    users: rows.map(userOut),
    total: Number(counted[0]?.n) || 0,
    limit,
    offset,
  });
}

/**
 * One person, everywhere.
 *
 * The loopital account, its subscriptions and payments, every email that was
 * sent to it, its support history — and then whatever each connected app knows
 * about the same email address, fetched live.
 */
async function userDetail(headers, userId) {
  const { staff, error } = await requireStaff(headers, "user:read");
  if (error) return error;

  const rows = await sql(
    `SELECT id, name, email, username, avatar_url, headline, created_at,
            pal_onboarded, pal_use_type, pal_org_name, pal_team_size
       FROM users WHERE id = :id::uuid`,
    { id: userId }
  );
  if (!rows.length) return json(404, { error: "No such user." });
  const user = rows[0];

  const apps = scopedApps(staff, await connectors.listApps());

  const [subs, payments, emails, tickets, perApp] = await Promise.all([
    sql("SELECT product, plan, status, seats, current_period_end, created_at FROM subscriptions WHERE user_id = :id::uuid", { id: userId }),
    sql(`SELECT reference, product, purpose, amount_cents, currency, plan, credits, seats, status, created_at
           FROM payments WHERE user_id = :id::uuid ORDER BY created_at DESC LIMIT 50`, { id: userId }),
    sql(`SELECT app_id, subject, status, error, created_at FROM zina_notifications
          WHERE to_email = :email ORDER BY created_at DESC LIMIT 25`, { email: user.email }),
    sql(`SELECT id, app_id, subject, status, priority, created_at FROM zina_tickets
          WHERE requester_email = :email ORDER BY created_at DESC LIMIT 25`, { email: user.email }),
    connectors.fanOut(apps, `/users?q=${encodeURIComponent(user.email)}&limit=1`),
  ]);

  return json(200, {
    user: {
      ...userOut(user),
      headline: user.headline || null,
      pal: {
        onboarded: user.pal_onboarded === true,
        useType: user.pal_use_type,
        orgName: user.pal_org_name,
        teamSize: user.pal_team_size,
      },
    },
    subscriptions: subs.map((s) => ({
      product: s.product,
      plan: s.plan,
      status: s.status,
      seats: Number(s.seats) || 1,
      currentPeriodEnd: s.current_period_end,
      createdAt: s.created_at,
    })),
    payments: payments.map(paymentOut),
    emails: emails.map((e) => ({
      appId: e.app_id,
      subject: e.subject,
      status: e.status,
      error: e.error,
      createdAt: e.created_at,
    })),
    tickets: tickets.map((t) => ({
      id: t.id,
      appId: t.app_id,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      createdAt: t.created_at,
    })),
    inApps: apps.map((app) => {
      const r = perApp[app.id];
      const found = r && r.ok && r.data && Array.isArray(r.data.users) ? r.data.users[0] : null;
      return {
        appId: app.id,
        name: app.name,
        accent: app.accent,
        known: Boolean(found),
        record: found || null,
        unavailable: r && !r.ok ? r.reason : null,
      };
    }),
  });
}

/** Suspend, restore or force a password reset — fanned out to the owning app. */
async function userAction(headers, userId, body) {
  const { staff, error } = await requireStaff(headers, "user:manage");
  if (error) return error;

  const action = String((body && body.action) || "");
  const appId = String((body && body.appId) || "");
  if (!["suspend", "restore", "reset-password"].includes(action)) {
    return json(400, { error: "Unknown action." });
  }
  if (!inScope(staff, appId)) return json(403, { error: "That app is outside your scope." });

  const app = await connectors.getApp(appId);
  if (!app) return json(404, { error: "No such app." });

  const users = await sql("SELECT id, email, name FROM users WHERE id = :id::uuid", { id: userId });
  if (!users.length) return json(404, { error: "No such user." });

  const result = await connectors.callOps(app, `/users/${encodeURIComponent(users[0].email)}/action`, {
    method: "POST",
    body: { action, email: users[0].email },
  });

  await audit(staff, `user.${action}`, { appId, target: users[0].email, headers });

  if (!result.ok) {
    return json(502, { error: `${app.name} couldn't apply that: ${result.detail || result.reason}.` });
  }
  return json(200, { ok: true });
}

// ── Payments: one Paystack, one ledger ─────────────────────────────────────

function paymentOut(row) {
  return {
    reference: row.reference,
    product: row.product,
    purpose: row.purpose,
    amountMinor: Number(row.amount_cents) || 0,
    currency: row.currency,
    plan: row.plan || null,
    credits: row.credits != null ? Number(row.credits) : null,
    seats: Number(row.seats) || 1,
    status: row.status,
    createdAt: row.created_at,
    customer: row.email ? { name: row.name, email: row.email } : undefined,
  };
}

async function listPayments(headers, qs) {
  const { staff, error } = await requireStaff(headers, "billing:read");
  if (error) return error;

  const product = String(qs("product") || "").trim();
  const status = String(qs("status") || "").trim();
  const limit = Math.min(200, Math.max(1, Number(qs("limit")) || 50));
  const offset = Math.max(0, Number(qs("offset")) || 0);
  const scope = staff.appScope.length ? staff.appScope : null;

  const rows = await sql(
    `SELECT p.reference, p.product, p.purpose, p.amount_cents, p.currency, p.plan,
            p.credits, p.seats, p.status, p.created_at,
            COALESCE(u.name, p.customer_name)   AS name,
            COALESCE(u.email, p.customer_email) AS email
       FROM payments p LEFT JOIN users u ON u.id = p.user_id
      WHERE (:product = '' OR p.product = :product)
        AND (:status = '' OR p.status = :status)
        AND (:scope::text[] IS NULL OR p.product = ANY(:scope::text[]))
      ORDER BY p.created_at DESC
      LIMIT :limit::int OFFSET :offset::int`,
    { product, status, scope, limit, offset }
  );

  const summary = await sql(
    `SELECT p.product, p.status, count(*) AS n, sum(p.amount_cents) AS total
       FROM payments p
      WHERE (:scope::text[] IS NULL OR p.product = ANY(:scope::text[]))
      GROUP BY p.product, p.status`,
    { scope }
  );

  return json(200, {
    payments: rows.map(paymentOut),
    summary: summary.map((s) => ({
      product: s.product,
      status: s.status,
      count: Number(s.n),
      totalMinor: Number(s.total) || 0,
    })),
    limit,
    offset,
  });
}

/**
 * The live price list, straight from the API that charges it.
 *
 * Passed in from app.js rather than duplicated here — a catalog that disagrees
 * with the one the checkout uses is worse than no catalog screen at all.
 */
async function billingCatalog(headers, catalog) {
  const { error } = await requireStaff(headers, "billing:read");
  if (error) return error;

  const products = Object.entries(catalog).map(([product, purposes]) => ({
    product,
    purposes: Object.entries(purposes).map(([purpose, items]) => ({
      purpose,
      items: Object.entries(items).map(([key, item]) => ({
        key,
        amountMinor: typeof item.amountNgn === "function" ? item.amountNgn() : item.amountNgn,
        credits: item.credits ?? null,
        seatBased: Boolean(item.seatBased),
        minSeats: item.minSeats ?? null,
      })),
    })),
  }));

  return json(200, {
    currency: process.env.PAYSTACK_CURRENCY || "NGN",
    configured: Boolean(process.env.PAYSTACK_SECRET_KEY),
    callbackUrl: process.env.PAYSTACK_CALLBACK_URL || null,
    products,
  });
}

// ── Notifications ──────────────────────────────────────────────────────────

async function listNotifications(headers, qs) {
  const { staff, error } = await requireStaff(headers, "notify:read");
  if (error) return error;

  const status = String(qs("status") || "").trim();
  const appId = String(qs("appId") || "").trim();
  const q = String(qs("q") || "").trim();
  const limit = Math.min(200, Math.max(1, Number(qs("limit")) || 50));
  const scope = staff.appScope.length ? staff.appScope : null;

  const rows = await sql(
    `SELECT id, app_id, template, to_email, subject, status, provider_id, error, created_at
       FROM zina_notifications
      WHERE (:status = '' OR status = :status)
        AND (:appId = '' OR app_id = :appId)
        AND (:q = '' OR to_email ILIKE '%' || :q || '%' OR subject ILIKE '%' || :q || '%')
        AND (:scope::text[] IS NULL OR app_id = ANY(:scope::text[]))
      ORDER BY created_at DESC LIMIT :limit::int`,
    { status, appId, q, scope, limit }
  );

  const stats = await sql(
    `SELECT status, count(*) AS n FROM zina_notifications
      WHERE created_at > now() - interval '30 days'
        AND (:scope::text[] IS NULL OR app_id = ANY(:scope::text[]))
      GROUP BY status`,
    { scope }
  );

  return json(200, {
    notifications: rows.map((r) => ({
      id: r.id,
      appId: r.app_id,
      template: r.template,
      to: r.to_email,
      subject: r.subject,
      status: r.status,
      providerId: r.provider_id,
      error: r.error,
      createdAt: r.created_at,
    })),
    stats30d: Object.fromEntries(stats.map((s) => [s.status, Number(s.n)])),
    configured: Boolean(process.env.RESEND_API_KEY),
    from: process.env.RESEND_FROM_EMAIL || null,
  });
}

/** Send a one-off from the portal — a test, or a reply that isn't a ticket. */
async function sendFromPortal(headers, body) {
  const { staff, error } = await requireStaff(headers, "notify:send");
  if (error) return error;

  const to = String((body && body.to) || "").trim();
  const subject = String((body && body.subject) || "").trim();
  const text = String((body && body.body) || "").trim();
  const appId = String((body && body.appId) || "loopital");
  if (!to || !subject || !text) return json(400, { error: "A recipient, subject and message are all needed." });
  if (!inScope(staff, appId)) return json(403, { error: "That app is outside your scope." });

  const result = await sendNotification({ appId, to, subject, body: text, template: "zina.manual" });
  await audit(staff, "notify.send", { appId, target: to, headers, detail: { subject } });

  if (!result.ok) return json(502, { error: result.error || "The email didn't go out." });
  return json(200, { ok: true, id: result.id });
}

/**
 * The endpoint every other app calls instead of holding a Resend key.
 *
 * Authenticated by the connector signature, so a product's server can send but
 * a browser cannot. This is the single choke point that makes the notification
 * log complete.
 */
async function notifyIngest(event, body) {
  const { app, error } = await authenticateApp(event, "/notify/send");
  if (error) return error;

  const result = await sendNotification({
    appId: app.id,
    to: body.to,
    subject: body.subject,
    body: body.body || body.text,
    html: body.html,
    linkUrl: body.linkUrl,
    linkLabel: body.linkLabel,
    recipientName: body.recipientName,
    template: body.template || null,
    replyTo: body.replyTo || null,
  });

  if (!result.ok) return json(502, { ok: false, error: result.error });
  return json(200, { ok: true, id: result.id });
}

// ── Support: one queue ─────────────────────────────────────────────────────

async function listTickets(headers, qs) {
  const { staff, error } = await requireStaff(headers, "support:read");
  if (error) return error;

  const status = String(qs("status") || "").trim();
  const appId = String(qs("appId") || "").trim();
  const scope = staff.appScope.length ? staff.appScope : null;

  const rows = await sql(
    `SELECT t.*, COALESCE(m.n, 0) AS messages
       FROM zina_tickets t
       LEFT JOIN (
         SELECT ticket_id, count(*) AS n FROM zina_ticket_messages GROUP BY ticket_id
       ) m ON m.ticket_id = t.id
      WHERE (:status = '' OR t.status = :status)
        AND (:appId = '' OR t.app_id = :appId)
        AND (:scope::text[] IS NULL OR t.app_id = ANY(:scope::text[]))
      ORDER BY
        CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
        t.updated_at DESC
      LIMIT 200`,
    { status, appId, scope }
  );

  const counts = await sql(
    `SELECT status, count(*) AS n FROM zina_tickets
      WHERE (:scope::text[] IS NULL OR app_id = ANY(:scope::text[])) GROUP BY status`,
    { scope }
  );

  return json(200, {
    tickets: rows.map(ticketOut),
    counts: Object.fromEntries(counts.map((c) => [c.status, Number(c.n)])),
  });
}

function ticketOut(row) {
  return {
    id: row.id,
    appId: row.app_id,
    subject: row.subject,
    requester: { name: row.requester_name, email: row.requester_email },
    status: row.status,
    priority: row.priority,
    assigneeId: row.assignee_id,
    messages: Number(row.messages) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function ticketDetail(headers, ticketId) {
  const { staff, error } = await requireStaff(headers, "support:read");
  if (error) return error;

  const rows = await sql("SELECT * FROM zina_tickets WHERE id = :id::uuid", { id: ticketId });
  if (!rows.length) return json(404, { error: "No such ticket." });
  if (!inScope(staff, rows[0].app_id)) return json(403, { error: "That ticket is outside your scope." });

  const messages = await sql(
    `SELECT m.id, m.author, m.body, m.emailed, m.created_at, u.name AS staff_name
       FROM zina_ticket_messages m
       LEFT JOIN zina_staff s ON s.id = m.staff_id
       LEFT JOIN users u ON u.id = s.user_id
      WHERE m.ticket_id = :id::uuid ORDER BY m.created_at`,
    { id: ticketId }
  );

  return json(200, {
    ticket: ticketOut(rows[0]),
    messages: messages.map((m) => ({
      id: m.id,
      author: m.author,
      staffName: m.staff_name,
      body: m.body,
      emailed: m.emailed,
      createdAt: m.created_at,
    })),
  });
}

/** Reply to a ticket. The reply is the email — there is no separate "notify" step. */
async function replyToTicket(headers, ticketId, body) {
  const { staff, error } = await requireStaff(headers, "support:respond");
  if (error) return error;

  const text = String((body && body.body) || "").trim();
  if (!text) return json(400, { error: "Write something first." });

  const rows = await sql("SELECT * FROM zina_tickets WHERE id = :id::uuid", { id: ticketId });
  if (!rows.length) return json(404, { error: "No such ticket." });
  const ticket = rows[0];
  if (!inScope(staff, ticket.app_id)) return json(403, { error: "That ticket is outside your scope." });

  const sent = await sendNotification({
    appId: ticket.app_id || "loopital",
    to: ticket.requester_email,
    recipientName: ticket.requester_name,
    subject: `Re: ${ticket.subject}`,
    body: text,
    template: "support.reply",
    replyTo: process.env.SUPPORT_REPLY_TO || undefined,
  });

  await sql(
    `INSERT INTO zina_ticket_messages (ticket_id, author, staff_id, body, emailed)
     VALUES (:tid::uuid, 'staff', :sid::uuid, :body, :emailed)`,
    { tid: ticketId, sid: staff.id, body: text, emailed: sent.ok }
  );
  await sql(
    `UPDATE zina_tickets SET status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END,
            assignee_id = COALESCE(assignee_id, :sid::uuid), updated_at = now()
      WHERE id = :id::uuid`,
    { id: ticketId, sid: staff.id }
  );

  await audit(staff, "support.reply", { appId: ticket.app_id, target: ticket.requester_email, headers });

  // The reply is saved either way — losing an operator's typed answer because
  // the mail server hiccuped would be the worse failure — but say so plainly.
  return json(200, { ok: true, emailed: sent.ok, emailError: sent.ok ? null : sent.error });
}

async function updateTicket(headers, ticketId, body) {
  const { staff, error } = await requireStaff(headers, "support:respond");
  if (error) return error;

  const rows = await sql("SELECT * FROM zina_tickets WHERE id = :id::uuid", { id: ticketId });
  if (!rows.length) return json(404, { error: "No such ticket." });
  if (!inScope(staff, rows[0].app_id)) return json(403, { error: "That ticket is outside your scope." });

  const status = ["open", "in_progress", "waiting", "resolved", "closed"].includes(body.status)
    ? body.status
    : rows[0].status;
  const priority = ["low", "normal", "high", "urgent"].includes(body.priority)
    ? body.priority
    : rows[0].priority;
  const assignee = body.assignToMe ? staff.id : rows[0].assignee_id;

  const updated = await sql(
    `UPDATE zina_tickets SET status = :status, priority = :priority, assignee_id = :assignee::uuid,
            updated_at = now() WHERE id = :id::uuid RETURNING *`,
    { id: ticketId, status, priority, assignee }
  );

  await audit(staff, "support.update", { appId: rows[0].app_id, target: ticketId, headers, detail: { status, priority } });
  return json(200, { ticket: ticketOut(updated[0]) });
}

/**
 * Where a ticket comes from.
 *
 * Two callers: an app's server (signed, so it can name itself and pass its own
 * id for reconciliation) and the public contact form on loopital.com. Both land
 * in the same queue, which is the entire point.
 */
async function ingestTicket(body, { appId = null, trusted = false } = {}) {
  const email = String((body && (body.email || body.requesterEmail)) || "").trim().toLowerCase();
  const subject = String((body && body.subject) || "").trim();
  const message = String((body && (body.message || body.body)) || "").trim();
  if (!email || !subject || !message) {
    return json(400, { error: "An email, subject and message are all needed." });
  }

  const linked = await sql("SELECT id FROM users WHERE email = :email", { email });
  const externalId = trusted && body.externalId ? String(body.externalId) : null;
  const priority = ["low", "normal", "high", "urgent"].includes(body.priority) ? body.priority : "normal";

  // An app that re-reports the same case — a webhook retry, or a customer
  // replying to a thread it already opened — must land on the existing ticket
  // rather than starting a second one. Looked up explicitly instead of relying
  // on ON CONFLICT against a partial unique index: the arbiter can only match
  // when external_id is present, so the two cases are genuinely different and
  // saying so is clearer than a clause that silently does nothing half the time.
  let ticket = null;
  if (externalId) {
    const existing = await sql(
      "SELECT id FROM zina_tickets WHERE app_id = :app AND external_id = :ext",
      { app: appId, ext: externalId }
    );
    if (existing.length) {
      ticket = existing[0];
      // Reopen it: a follow-up on something marked resolved is not resolved.
      await sql(
        `UPDATE zina_tickets SET status = CASE WHEN status IN ('resolved','closed') THEN 'open' ELSE status END,
                updated_at = now() WHERE id = :id::uuid`,
        { id: ticket.id }
      );
    }
  }

  if (!ticket) {
    const rows = await sql(
      `INSERT INTO zina_tickets (app_id, external_id, subject, requester_name, requester_email, user_id, priority)
       VALUES (:app, :ext, :subject, :name, :email, :uid::uuid, :priority)
       RETURNING id`,
      {
        app: appId,
        ext: externalId,
        subject,
        name: String((body && (body.name || body.requesterName)) || "").trim() || null,
        email,
        uid: linked[0] ? linked[0].id : null,
        priority,
      }
    );
    ticket = rows[0];
  }

  await sql(
    `INSERT INTO zina_ticket_messages (ticket_id, author, body) VALUES (:tid::uuid, 'requester', :body)`,
    { tid: ticket.id, body: message }
  );

  return json(201, { ok: true, ticketId: ticket.id });
}

// ── Credentials and databases ──────────────────────────────────────────────

async function listSecrets(headers, qs) {
  const { staff, error } = await requireStaff(headers, "secret:read");
  if (error) return error;

  const appId = String(qs("appId") || "").trim();
  const scope = staff.appScope.length ? staff.appScope : null;

  const rows = await sql(
    `SELECT s.id, s.app_id, s.kind, s.label, s.env_var, s.hint, s.rotated_at, s.created_at, s.value_enc,
            a.name AS app_name, a.accent
       FROM zina_secrets s LEFT JOIN zina_apps a ON a.id = s.app_id
      WHERE (:appId = '' OR s.app_id = :appId)
        AND (:scope::text[] IS NULL OR s.app_id = ANY(:scope::text[]))
      ORDER BY a.sort_order NULLS LAST, s.kind, s.label`,
    { appId, scope }
  );

  return json(200, {
    configured: vault.vaultConfigured(),
    secrets: rows.map((r) => ({
      id: r.id,
      appId: r.app_id,
      appName: r.app_name,
      accent: r.accent,
      kind: r.kind,
      label: r.label,
      envVar: r.env_var,
      // A preview, never the value. Decrypting here would put every key in the
      // response body of a list request, which is exactly what the vault is for.
      preview: previewOf(r.value_enc),
      hint: r.hint,
      rotatedAt: r.rotated_at,
      createdAt: r.created_at,
    })),
  });
}

function previewOf(sealed) {
  try {
    return vault.mask(vault.open(sealed));
  } catch (_) {
    return "••••••••";
  }
}

/**
 * Every service the ecosystem depends on, joined against what's actually stored.
 *
 * The point is that a service appears here whether or not anyone has configured
 * it. An empty vault used to mean an empty screen, which answered none of the
 * questions an operator actually has: what are we paying for, which app stops
 * working if this expires, and where do I go to change it.
 *
 * Values are never included — only whether one is set, for which app, and a
 * masked preview. Revealing stays the separate, audited call it was.
 */
async function listServices(headers) {
  const { staff, error } = await requireStaff(headers, "secret:read");
  if (error) return error;

  const scope = staff.appScope.length ? staff.appScope : null;

  const stored = await sql(
    `SELECT id, app_id, env_var, label, value_enc, rotated_at
       FROM zina_secrets
      WHERE env_var IS NOT NULL AND env_var <> ''
        AND (:scope::text[] IS NULL OR app_id = ANY(:scope::text[]))`,
    { scope }
  );

  // (envVar, appId) → the stored row. A variable is set per app, not globally:
  // DATABASE_URL means something different for every one of them.
  const byVarApp = new Map();
  for (const row of stored) byVarApp.set(`${row.env_var}::${row.app_id}`, row);

  const inScopeApp = (appId) => !staff.appScope.length || staff.appScope.includes(appId);

  const services = SERVICES.map((service) => {
    const vars = service.vars
      .map((v) => {
        const apps = v.apps.filter(inScopeApp);
        if (!apps.length) return null;
        return {
          key: v.key,
          secret: Boolean(v.secret),
          note: v.note || null,
          apps: apps.map((appId) => {
            const row = byVarApp.get(`${v.key}::${appId}`);
            return {
              appId,
              set: Boolean(row),
              secretId: row ? row.id : null,
              preview: row ? previewOf(row.value_enc) : null,
              rotatedAt: row ? row.rotated_at : null,
            };
          }),
        };
      })
      .filter(Boolean);

    if (!vars.length) return null;

    const total = vars.reduce((n, v) => n + v.apps.length, 0);
    const set = vars.reduce((n, v) => n + v.apps.filter((a) => a.set).length, 0);

    return {
      id: service.id,
      name: service.name,
      category: service.category,
      purpose: service.purpose,
      console: service.console || null,
      critical: Boolean(service.critical),
      selfHosted: Boolean(service.selfHosted),
      total,
      set,
      vars,
    };
  }).filter(Boolean);

  return json(200, {
    configured: vault.vaultConfigured(),
    services,
    // Anything stored that the catalog doesn't describe — a key added by hand.
    // Surfaced rather than hidden, so the catalog can be corrected.
    uncatalogued: stored
      .filter((row) => !SERVICES.some((s) => s.vars.some((v) => v.key === row.env_var)))
      .map((row) => ({ id: row.id, appId: row.app_id, envVar: row.env_var, label: row.label })),
  });
}

async function saveSecret(headers, body) {
  const { staff, error } = await requireStaff(headers, "secret:manage");
  if (error) return error;
  if (!vault.vaultConfigured()) {
    return json(503, {
      error: "Set ZINA_ENCRYPTION_KEY before storing credentials.",
      hint: `Generate one with: ${vault.generateMasterKey()}`,
    });
  }

  const appId = String((body && body.appId) || "").trim() || null;
  const label = String((body && body.label) || "").trim();
  const value = String((body && body.value) || "");
  const kind = ["api_key", "database", "webhook", "oauth", "other"].includes(body.kind) ? body.kind : "api_key";
  if (!label || !value) return json(400, { error: "A label and a value are both needed." });
  if (appId && !inScope(staff, appId)) return json(403, { error: "That app is outside your scope." });

  const rows = await sql(
    `INSERT INTO zina_secrets (app_id, kind, label, env_var, value_enc, hint, created_by, rotated_at)
     VALUES (:app, :kind, :label, :env, :value, :hint, :by::uuid, now())
     ON CONFLICT (app_id, label) DO UPDATE
       SET value_enc = :value, kind = :kind, env_var = :env, hint = :hint, rotated_at = now()
     RETURNING id`,
    {
      app: appId,
      kind,
      label,
      env: String((body && body.envVar) || "").trim() || null,
      value: vault.seal(value),
      hint: String((body && body.hint) || "").trim() || null,
      by: staff.userId,
    }
  );

  // Anything with a variable name is live configuration, so bump the version
  // and the app picks it up on its next poll — no redeploy, which is the whole
  // point of keeping it here.
  if (appId && String((body && body.envVar) || "").trim()) await bumpConfigVersion(appId);

  // The label is audited; the value never is.
  await audit(staff, "secret.save", { appId, target: label, headers, detail: { kind } });
  return json(200, { ok: true, id: rows[0].id });
}

/** Reveal one secret. Deliberately a separate, audited call. */
async function revealSecret(headers, secretId) {
  const { staff, error } = await requireStaff(headers, "secret:reveal");
  if (error) return error;

  const rows = await sql("SELECT * FROM zina_secrets WHERE id = :id::uuid", { id: secretId });
  if (!rows.length) return json(404, { error: "No such credential." });
  if (rows[0].app_id && !inScope(staff, rows[0].app_id)) {
    return json(403, { error: "That app is outside your scope." });
  }

  let value;
  try {
    value = vault.open(rows[0].value_enc);
  } catch (e) {
    return json(500, { error: e.message });
  }

  await audit(staff, "secret.reveal", { appId: rows[0].app_id, target: rows[0].label, headers });
  return json(200, { value });
}

async function deleteSecret(headers, secretId) {
  const { staff, error } = await requireStaff(headers, "secret:manage");
  if (error) return error;
  const rows = await sql("SELECT app_id, label, env_var FROM zina_secrets WHERE id = :id::uuid", { id: secretId });
  if (!rows.length) return json(404, { error: "No such credential." });
  if (rows[0].app_id && !inScope(staff, rows[0].app_id)) {
    return json(403, { error: "That app is outside your scope." });
  }
  await sql("DELETE FROM zina_secrets WHERE id = :id::uuid", { id: secretId });
  if (rows[0].app_id) await bumpConfigVersion(rows[0].app_id);
  await audit(staff, "secret.delete", { appId: rows[0].app_id, target: rows[0].label, headers });
  return json(200, { ok: true });
}

// ── The vault as live configuration ────────────────────────────────────────

/** Bump an app's config version so its next poll pulls the new values. */
async function bumpConfigVersion(appId) {
  if (!appId) return;
  await sql(
    `INSERT INTO zina_config_version (app_id, version, updated_at)
     VALUES (:app, 1, now())
     ON CONFLICT (app_id) DO UPDATE
       SET version = zina_config_version.version + 1, updated_at = now()`,
    { app: appId }
  ).catch((e) => console.error("config version bump failed:", e.message));
}

/**
 * What an app is actually running on — served to the app itself, signed.
 *
 * This is the endpoint that makes the portal the source of truth rather than a
 * notebook. An app fetches this at boot and overlays it onto its environment,
 * so changing a Paystack key, repointing a database, or switching object
 * storage from one provider to another is an edit here — not a code change, a
 * commit and a redeploy.
 *
 * Only rows carrying an `env_var` are returned: a credential recorded purely
 * for the record ("the AWS root key we no longer use") has no variable name and
 * so is never injected into anything.
 */
async function appConfig(event) {
  const { app, error } = await authenticateApp(event, "/ops-config", "GET");
  if (error) return error;

  const rows = await sql(
    `SELECT env_var, value_enc FROM zina_secrets
      WHERE app_id = :app AND env_var IS NOT NULL AND env_var <> ''`,
    { app: app.id }
  );

  const config = {};
  const unreadable = [];
  for (const row of rows) {
    try {
      config[row.env_var] = vault.open(row.value_enc);
    } catch (_) {
      // A value sealed under a previous encryption key. Named, not silently
      // dropped — an app starting with a missing variable should be able to say
      // which one and why, rather than failing somewhere further downstream.
      unreadable.push(row.env_var);
    }
  }

  const versions = await sql("SELECT version FROM zina_config_version WHERE app_id = :app", {
    app: app.id,
  });

  return json(200, {
    version: Number(versions[0]?.version) || 0,
    config,
    ...(unreadable.length ? { unreadable } : {}),
  });
}

/** Just the version, for the poll. Deliberately tiny. */
async function appConfigVersion(event) {
  const { app, error } = await authenticateApp(event, "/ops-config/version", "GET");
  if (error) return error;
  const rows = await sql("SELECT version FROM zina_config_version WHERE app_id = :app", {
    app: app.id,
  });
  return json(200, { version: Number(rows[0]?.version) || 0 });
}

/**
 * The same view, for the operator: which variables an app will receive, without
 * their values. Answers "did I actually set that on the right app?" — which is
 * otherwise a question you can only settle by breaking something.
 */
async function configPreview(headers, appId) {
  const { staff, error } = await requireStaff(headers, "secret:read");
  if (error) return error;
  if (!inScope(staff, appId)) return json(403, { error: "That app is outside your scope." });

  const rows = await sql(
    `SELECT env_var, kind, label, rotated_at FROM zina_secrets
      WHERE app_id = :app AND env_var IS NOT NULL AND env_var <> ''
      ORDER BY env_var`,
    { app: appId }
  );
  const versions = await sql("SELECT version, updated_at FROM zina_config_version WHERE app_id = :app", {
    app: appId,
  });

  return json(200, {
    appId,
    version: Number(versions[0]?.version) || 0,
    updatedAt: versions[0]?.updated_at || null,
    variables: rows.map((r) => ({
      envVar: r.env_var,
      kind: r.kind,
      label: r.label,
      rotatedAt: r.rotated_at,
    })),
  });
}

/**
 * Database health across the group.
 *
 * loopital's own pool is measured directly; every other app reports its own,
 * because Zina has no credentials for their stores and should not.
 */
async function databases(headers) {
  const { staff, error } = await requireStaff(headers, "system:read");
  if (error) return error;

  const apps = scopedApps(staff, await connectors.listApps());
  const health = await connectors.refreshHealth(apps);
  const byApp = Object.fromEntries(health.map((h) => [h.appId, h]));

  let own = null;
  if (!staff.appScope.length || staff.appScope.includes("loopital")) {
    const startedAt = Date.now();
    try {
      const size = await sql(
        `SELECT current_database() AS name,
                pg_size_pretty(pg_database_size(current_database())) AS size,
                (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) AS connections`
      );
      own = {
        appId: "loopital",
        name: "loopital schema on pal-db",
        status: "ok",
        latencyMs: Date.now() - startedAt,
        database: size[0]?.name,
        size: size[0]?.size,
        connections: Number(size[0]?.connections) || 0,
        pool: { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount },
      };
    } catch (e) {
      own = { appId: "loopital", status: "down", detail: e.message };
    }
  }

  return json(200, {
    own,
    apps: apps.map((app) => ({
      appId: app.id,
      name: app.name,
      accent: app.accent,
      connected: Boolean(app.ops_base_url),
      status: byApp[app.id]?.status || "unknown",
      dbStatus: byApp[app.id]?.db_status || null,
      latencyMs: byApp[app.id]?.latency_ms ?? null,
      detail: byApp[app.id]?.detail || null,
    })),
  });
}

// ── Analytics ──────────────────────────────────────────────────────────────

/**
 * Growth across the group.
 *
 * Signups and revenue are computed from loopital's own tables, which is exact.
 * Per-app metrics come from the `zina_metrics` rollups apps push, so an app that
 * never pushes simply has no series rather than a flat line at zero.
 */
async function analytics(headers, qs) {
  const { staff, error } = await requireStaff(headers, "analytics:read");
  if (error) return error;

  const days = Math.min(365, Math.max(7, Number(qs("days")) || 30));
  const scope = staff.appScope.length ? staff.appScope : null;

  // The window boundary is computed once, here, and passed as a parameter.
  // Deriving it in SQL means three queries each re-expressing the same interval
  // arithmetic, and they can drift; this way they cannot disagree.
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const sinceDay = since.slice(0, 10);

  const [signups, revenue, subs, metrics, emails] = await Promise.all([
    sql(
      `SELECT date_trunc('day', created_at)::date AS day, count(*) AS n
         FROM users WHERE created_at > :since::timestamptz
        GROUP BY date_trunc('day', created_at)::date
        ORDER BY date_trunc('day', created_at)::date`,
      { since }
    ),
    sql(
      `SELECT date_trunc('day', created_at)::date AS day, product, sum(amount_cents) AS total
         FROM payments
        WHERE status = 'success' AND created_at > :since::timestamptz
          AND (:scope::text[] IS NULL OR product = ANY(:scope::text[]))
        GROUP BY date_trunc('day', created_at)::date, product
        ORDER BY date_trunc('day', created_at)::date`,
      { since, scope }
    ),
    sql(
      `SELECT product, plan, status, count(*) AS n FROM subscriptions
        WHERE (:scope::text[] IS NULL OR product = ANY(:scope::text[]))
        GROUP BY product, plan, status`,
      { scope }
    ),
    sql(
      `SELECT app_id, metric, day, value FROM zina_metrics
        WHERE day >= :sinceDay::date
          AND (:scope::text[] IS NULL OR app_id = ANY(:scope::text[]))
        ORDER BY day`,
      { sinceDay, scope }
    ),
    sql(
      `SELECT date_trunc('day', created_at)::date AS day, status, count(*) AS n
         FROM zina_notifications
        WHERE created_at > :since::timestamptz
          AND (:scope::text[] IS NULL OR app_id = ANY(:scope::text[]))
        GROUP BY date_trunc('day', created_at)::date, status
        ORDER BY date_trunc('day', created_at)::date`,
      { since, scope }
    ),
  ]);

  return json(200, {
    days,
    signups: signups.map((r) => ({ day: r.day, count: Number(r.n) })),
    revenue: revenue.map((r) => ({ day: r.day, product: r.product, totalMinor: Number(r.total) || 0 })),
    subscriptions: subs.map((r) => ({
      product: r.product,
      plan: r.plan,
      status: r.status,
      count: Number(r.n),
    })),
    appMetrics: metrics.map((r) => ({
      appId: r.app_id,
      metric: r.metric,
      day: r.day,
      value: Number(r.value),
    })),
    email: emails.map((r) => ({ day: r.day, status: r.status, count: Number(r.n) })),
  });
}

/**
 * Authenticate a machine-to-machine call from one of the apps.
 *
 * Returns the calling app, or the response to send instead. The signature is
 * the whole authentication — there is no session and none is accepted — so it
 * is computed over the exact bytes received rather than the re-serialised body,
 * which would differ by key order and fail for no visible reason.
 */
async function authenticateApp(event, path, method = "POST") {
  const headers = event.headers || {};
  const appId = String(headers["x-zina-app"] || "").trim();
  const app = appId ? await connectors.getApp(appId) : null;
  if (!app) return { error: json(401, { error: "Unknown app." }) };

  const raw = event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64").toString("utf8")
    : event.body || "";

  const valid = connectors.verifySignature({
    secret: app.ops_secret || process.env.ZINA_OPS_SECRET || "",
    timestamp: headers["x-zina-timestamp"],
    method,
    path,
    body: raw,
    signature: headers["x-zina-signature"],
  });
  if (!valid) return { error: json(401, { error: "Invalid signature." }) };

  return { app };
}

/** Apps push their daily rollups here, signed. */
async function ingestMetrics(event, body) {
  const { app, error } = await authenticateApp(event, "/zina/ingest/metrics");
  if (error) return error;
  const appId = app.id;

  const metrics = Array.isArray(body && body.metrics) ? body.metrics : [];
  for (const m of metrics.slice(0, 500)) {
    if (!m || !m.metric || !m.day) continue;
    await sql(
      `INSERT INTO zina_metrics (app_id, metric, day, value)
       VALUES (:app, :metric, :day::date, :value::numeric)
       ON CONFLICT (app_id, metric, day) DO UPDATE SET value = :value::numeric, updated_at = now()`,
      { app: appId, metric: String(m.metric), day: String(m.day), value: Number(m.value) || 0 }
    ).catch(() => {});
  }
  return json(200, { ok: true, accepted: metrics.length });
}

/**
 * A payment an app took on the group's single Paystack account.
 *
 * Beacon bills institutions and Modus bills companies — customers who are not
 * rows in `users`. Those payments still run through the one merchant account,
 * so they belong in the one ledger; they just arrive by report rather than by
 * being originated here. The row carries the customer's own name and email
 * instead of a user id, and is keyed by the payment reference so a webhook and
 * a browser callback reporting the same settlement can't double it.
 *
 * Deliberately NOT trusted for fulfilment: this records what an app says it
 * collected, for the ledger and the dashboard. Nothing is granted off the back
 * of it — the reporting app already did that against its own verification.
 */
async function ingestPayment(event, body) {
  const { app, error } = await authenticateApp(event, "/zina/ingest/payment");
  if (error) return error;

  const reference = String((body && body.reference) || "").trim();
  const amountMinor = Math.round(Number(body && body.amountMinor) || 0);
  if (!reference) return json(400, { error: "A payment reference is required." });
  if (!Number.isFinite(amountMinor) || amountMinor < 0) {
    return json(400, { error: "Amount must be a whole number of minor units." });
  }

  const status = ["pending", "success", "failed"].includes(body && body.status) ? body.status : "pending";

  await sql(
    `INSERT INTO payments (user_id, product, purpose, reference, amount_cents, currency, plan,
                           seats, status, fulfilled, customer_email, customer_name, source_app, metadata)
     VALUES (NULL, :product, :purpose, :ref, :amount::int, :currency, :plan,
             1, :status, :fulfilled, :email, :name, :app, :meta::jsonb)
     ON CONFLICT (reference) DO UPDATE
       SET status = :status, fulfilled = :fulfilled, amount_cents = :amount::int`,
    {
      product: String((body && body.product) || app.id),
      purpose: body && body.purpose === "credits" ? "credits" : "subscription",
      ref: reference,
      amount: amountMinor,
      currency: String((body && body.currency) || "NGN"),
      plan: String((body && body.plan) || "") || null,
      status,
      fulfilled: status === "success",
      email: String((body && body.customerEmail) || "").trim().toLowerCase() || null,
      name: String((body && body.customerName) || "").trim() || null,
      app: app.id,
      meta: JSON.stringify((body && body.metadata) || {}),
    }
  );

  return json(200, { ok: true });
}

// ── Staff ──────────────────────────────────────────────────────────────────

async function listStaff(headers) {
  const { error } = await requireStaff(headers, "staff:manage");
  if (error) return error;

  const rows = await sql(
    `SELECT s.id, s.role, s.title, s.app_scope, s.is_active, s.last_seen, s.created_at,
            u.id AS user_id, u.name, u.email, u.avatar_url
       FROM zina_staff s JOIN users u ON u.id = s.user_id
      ORDER BY s.created_at`
  );

  return json(200, {
    staff: rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      name: r.name,
      email: r.email,
      avatarUrl: r.avatar_url,
      role: r.role,
      roleLabel: ROLE_LABELS[r.role],
      title: r.title,
      appScope: Array.isArray(r.app_scope) ? r.app_scope : [],
      isActive: r.is_active,
      lastSeen: r.last_seen,
      createdAt: r.created_at,
    })),
    roles: ROLES.map((role) => ({
      id: role,
      label: ROLE_LABELS[role],
      description: ROLE_DESCRIPTIONS[role],
      permissions: ROLE_PERMISSIONS[role],
    })),
  });
}

/**
 * Grant someone standing in Zina.
 *
 * The person must already have a Loopital account — this grants access, it does
 * not create an identity, and inventing one here would mean a second place
 * passwords come from.
 */
async function saveStaff(headers, body) {
  const { staff, error } = await requireStaff(headers, "staff:manage");
  if (error) return error;

  const email = String((body && body.email) || "").trim().toLowerCase();
  const role = ROLES.includes(body && body.role) ? body.role : "support";
  const appScope = Array.isArray(body && body.appScope) ? body.appScope.filter(Boolean) : [];
  if (!email) return json(400, { error: "Enter the person's email." });

  const users = await sql("SELECT id, name FROM users WHERE email = :email", { email });
  if (!users.length) {
    return json(404, {
      error: `${email} doesn't have a Loopital account yet. Ask them to sign up first, then add them here.`,
    });
  }

  const rows = await sql(
    `INSERT INTO zina_staff (user_id, role, title, app_scope, is_active)
     VALUES (:uid::uuid, :role, :title, :scope::text[], true)
     ON CONFLICT (user_id) DO UPDATE
       SET role = :role, title = :title, app_scope = :scope::text[], is_active = true
     RETURNING id`,
    {
      uid: users[0].id,
      role,
      title: String((body && body.title) || "").trim() || null,
      scope: appScope,
    }
  );

  await audit(staff, "staff.save", { target: email, headers, detail: { role, appScope } });
  return json(200, { ok: true, id: rows[0].id });
}

async function setStaffActive(headers, staffId, body) {
  const { staff, error } = await requireStaff(headers, "staff:manage");
  if (error) return error;
  if (staffId === staff.id) {
    return json(400, { error: "You can't deactivate your own access." });
  }

  const active = Boolean(body && body.isActive);

  // Never leave the ecosystem without a way in.
  if (!active) {
    const remaining = await sql(
      `SELECT count(*) AS n FROM zina_staff
        WHERE role = 'superadmin' AND is_active = true AND id <> :id::uuid`,
      { id: staffId }
    );
    const target = await sql("SELECT role FROM zina_staff WHERE id = :id::uuid", { id: staffId });
    if (target[0]?.role === "superadmin" && Number(remaining[0]?.n) === 0) {
      return json(400, { error: "That's the last active superadmin. Promote someone else first." });
    }
  }

  await sql("UPDATE zina_staff SET is_active = :active WHERE id = :id::uuid", { id: staffId, active });
  await audit(staff, active ? "staff.activate" : "staff.deactivate", { target: staffId, headers });
  return json(200, { ok: true });
}

// ── Audit ──────────────────────────────────────────────────────────────────

async function listAudit(headers, qs) {
  const { error } = await requireStaff(headers, "audit:read");
  if (error) return error;

  const limit = Math.min(500, Math.max(1, Number(qs("limit")) || 100));
  const appId = String(qs("appId") || "").trim();

  const rows = await sql(
    `SELECT a.id, a.actor_email, a.app_id, a.action, a.target, a.detail, a.ip, a.created_at,
            u.name AS actor_name
       FROM zina_audit a
       LEFT JOIN zina_staff s ON s.id = a.staff_id
       LEFT JOIN users u ON u.id = s.user_id
      WHERE (:appId = '' OR a.app_id = :appId)
      ORDER BY a.created_at DESC LIMIT :limit::int`,
    { appId, limit }
  );

  return json(200, {
    entries: rows.map((r) => ({
      id: r.id,
      actor: { name: r.actor_name, email: r.actor_email },
      appId: r.app_id,
      action: r.action,
      target: r.target,
      detail: r.detail,
      ip: r.ip,
      createdAt: r.created_at,
    })),
  });
}

// ── Router ─────────────────────────────────────────────────────────────────

/**
 * Dispatch a Zina request.
 *
 * Returns null when the path isn't ours, so app.js can fall through to the rest
 * of the API rather than this module having to know about every other route.
 */
async function route(ctx) {
  const { method, path, headers, body, qs, event, billingCatalogSource } = ctx;

  // Signed machine-to-machine endpoints. No staff session — the signature is
  // the authentication, and these are what let the other apps participate.
  if (method === "GET" && path === "/ops-config") return appConfig(event);
  if (method === "GET" && path === "/ops-config/version") return appConfigVersion(event);
  if (method === "POST" && path === "/notify/send") return notifyIngest(event, body);
  if (method === "POST" && path === "/zina/ingest/metrics") return ingestMetrics(event, body);
  if (method === "POST" && path === "/zina/ingest/payment") return ingestPayment(event, body);
  if (method === "POST" && path === "/zina/ingest/ticket") {
    const { app, error } = await authenticateApp(event, "/zina/ingest/ticket");
    if (error) return error;
    return ingestTicket(body, { appId: app.id, trusted: true });
  }

  if (!path.startsWith("/zina")) return null;

  // Session
  if (method === "POST" && path === "/zina/auth/login") return login(body, headers);
  if (method === "GET" && path === "/zina/me") return whoami(headers);

  // Overview
  if (method === "GET" && path === "/zina/overview") return overview(headers);

  // Apps
  if (method === "GET" && path === "/zina/apps") return listAppsRoute(headers);
  if (method === "GET" && path === "/zina/health") return checkHealth(headers, qs("appId"));
  if ((method === "PUT" || method === "PATCH") && /^\/zina\/apps\/[^/]+$/.test(path)) {
    return updateApp(headers, decodeURIComponent(path.split("/")[3]), body);
  }
  if (method === "POST" && /^\/zina\/apps\/[^/]+\/switch$/.test(path)) {
    return switchInto(headers, decodeURIComponent(path.split("/")[3]));
  }
  if (method === "GET" && /^\/zina\/apps\/[^/]+\/dashboard$/.test(path)) {
    return appDashboard(headers, decodeURIComponent(path.split("/")[3]));
  }

  // Users
  if (method === "GET" && path === "/zina/users") return listUsers(headers, qs);
  if (method === "GET" && /^\/zina\/users\/[^/]+$/.test(path)) {
    return userDetail(headers, decodeURIComponent(path.split("/")[3]));
  }
  if (method === "POST" && /^\/zina\/users\/[^/]+\/action$/.test(path)) {
    return userAction(headers, decodeURIComponent(path.split("/")[3]), body);
  }

  // Money
  if (method === "GET" && path === "/zina/payments") return listPayments(headers, qs);
  if (method === "GET" && path === "/zina/billing/catalog") {
    return billingCatalog(headers, billingCatalogSource || {});
  }

  // Notifications
  if (method === "GET" && path === "/zina/notifications") return listNotifications(headers, qs);
  if (method === "POST" && path === "/zina/notifications/send") return sendFromPortal(headers, body);

  // Support
  if (method === "GET" && path === "/zina/tickets") return listTickets(headers, qs);
  if (method === "GET" && /^\/zina\/tickets\/[^/]+$/.test(path)) {
    return ticketDetail(headers, decodeURIComponent(path.split("/")[3]));
  }
  if (method === "POST" && /^\/zina\/tickets\/[^/]+\/reply$/.test(path)) {
    return replyToTicket(headers, decodeURIComponent(path.split("/")[3]), body);
  }
  if ((method === "POST" || method === "PATCH") && /^\/zina\/tickets\/[^/]+$/.test(path)) {
    return updateTicket(headers, decodeURIComponent(path.split("/")[3]), body);
  }

  // Credentials and infrastructure
  if (method === "GET" && path === "/zina/services") return listServices(headers);
  if (method === "GET" && path === "/zina/secrets") return listSecrets(headers, qs);
  if (method === "POST" && path === "/zina/secrets") return saveSecret(headers, body);
  if (method === "POST" && /^\/zina\/secrets\/[^/]+\/reveal$/.test(path)) {
    return revealSecret(headers, decodeURIComponent(path.split("/")[3]));
  }
  if (method === "DELETE" && /^\/zina\/secrets\/[^/]+$/.test(path)) {
    return deleteSecret(headers, decodeURIComponent(path.split("/")[3]));
  }
  if (method === "GET" && /^\/zina\/config\/[^/]+$/.test(path)) {
    return configPreview(headers, decodeURIComponent(path.split("/")[3]));
  }
  if (method === "GET" && path === "/zina/databases") return databases(headers);

  // Insight
  if (method === "GET" && path === "/zina/analytics") return analytics(headers, qs);

  // People and history
  if (method === "GET" && path === "/zina/staff") return listStaff(headers);
  if (method === "POST" && path === "/zina/staff") return saveStaff(headers, body);
  if (method === "POST" && /^\/zina\/staff\/[^/]+\/active$/.test(path)) {
    return setStaffActive(headers, decodeURIComponent(path.split("/")[3]), body);
  }
  if (method === "GET" && path === "/zina/audit") return listAudit(headers, qs);

  return json(404, { error: "Not found." });
}

module.exports = {
  route,
  ingestTicket,
  ROLES,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_PERMISSIONS,
  PERMISSIONS,
};
