"use strict";

/**
 * How Zina talks to the rest of the ecosystem.
 *
 * Zina does not hold credentials for four different databases. Each app instead
 * exposes a small, fixed set of `/ops/*` endpoints — its "operations connector"
 * — and Zina calls them with a signed request. The app answers about its own
 * data, in its own store, and stays the only thing that can write to it.
 *
 * That boundary is the point. It means a product can be rewritten, moved or
 * re-hosted and Zina keeps working as long as the connector still answers; and
 * it means a compromise of Zina does not hand over every database in the group.
 *
 * ── The contract every app implements ──────────────────────────────────────
 *
 *   GET  {ops}/health            -> { status, version?, db?: {status, latencyMs}, detail? }
 *   GET  {ops}/summary           -> { users, activeUsers, revenueMinor?, currency?, tickets?, ... }
 *   GET  {ops}/users?q&limit     -> { users: [{ id, name, email, status, createdAt, plan? }] }
 *   POST {ops}/users/:id/action  -> { ok }            (suspend | restore | reset-password)
 *   GET  {ops}/keys              -> { keys: [{ id, label, envVar, hint, rotatedAt }] }
 *   GET  {ops}/metrics?days      -> { metrics: [{ metric, day, value }] }
 *   GET  {ops}/tickets?since     -> { tickets: [{ id, subject, email, status, createdAt }] }
 *   POST {ops}/admin-session     -> { url }           (see "switching in", below)
 *
 * Everything is optional except `/health`. A connector that returns 404 for a
 * capability simply shows as "not available for this app" in the portal rather
 * than breaking the page — the ecosystem is not uniform and pretending it is
 * would mean shipping nothing until every app caught up.
 *
 * ── Switching in ───────────────────────────────────────────────────────────
 *
 * "Manage directly" does not ask the superadmin to log in again. Zina POSTs to
 * {ops}/admin-session with the staff member's identity and role; the app mints
 * its own short-lived admin session and returns a URL to land on. The app stays
 * the authority on what an admin session means inside it — Zina only vouches
 * for who is asking.
 *
 * ── Signing ────────────────────────────────────────────────────────────────
 *
 * Every call carries an HMAC-SHA256 signature over
 * `timestamp.method.path.body` using the shared secret for that app, plus the
 * timestamp itself. The receiver recomputes it and rejects anything older than
 * five minutes. No bearer token to leak in a log; a captured request is useless
 * once the window closes.
 */

const crypto = require("crypto");
const { sql } = require("./db");

/** How long a signed ops request stays valid. */
const SIGNATURE_WINDOW_MS = 5 * 60 * 1000;

/** Per-request budget. A sleeping free-tier app must not hang the dashboard. */
const OPS_TIMEOUT_MS = Number(process.env.ZINA_OPS_TIMEOUT_MS) || 8000;

/**
 * The ecosystem as it stands. Seeded into `zina_apps` on first boot, then owned
 * by the database — editing an app in the portal is what changes it from here
 * on, so this list is a starting point and not a source of truth.
 *
 * Ops URLs come from the environment because they differ per deploy, and the
 * secret is per-app so one app's connector key cannot read another's.
 */
const SEED_APPS = [
  {
    id: "loopital",
    name: "Loopital",
    tagline: "Accounts, billing and the marketing site",
    app_url: "https://www.loopital.com",
    admin_url: "",
    ops_base_url: "self",
    accent: "#0f766e",
    sort_order: 0,
  },
  {
    id: "stack62",
    name: "Pal",
    tagline: "AI workspace",
    app_url: "https://pal.loopital.com",
    admin_url: "https://assembly.loopital.com",
    ops_base_url: process.env.OPS_URL_PAL || "",
    accent: "#4f46e5",
    sort_order: 1,
  },
  {
    id: "fms13",
    name: "Modus",
    tagline: "Facility and fleet operations",
    app_url: "https://modus.loopital.com",
    admin_url: "https://ministry.loopital.com",
    ops_base_url: process.env.OPS_URL_MODUS || "",
    accent: "#c2410c",
    sort_order: 3,
  },
  {
    id: "edm73",
    name: "Beacon",
    tagline: "Institutions, students and certification",
    app_url: "https://beacon.loopital.com",
    admin_url: "https://beacon.loopital.com/academia",
    ops_base_url: process.env.OPS_URL_BEACON || "",
    accent: "#a3122b",
    sort_order: 4,
  },
  {
    id: "hms7",
    name: "Henholib",
    tagline: "Health records and care",
    app_url: "https://henholib.loopital.com",
    admin_url: "https://council.loopital.com",
    ops_base_url: process.env.OPS_URL_HENHOLIB || "",
    accent: "#0369a1",
    sort_order: 5,
  },
];

/**
 * Insert any app the registry doesn't have yet, and refresh the ops URL from the
 * environment when one is configured.
 *
 * Deliberately not a full overwrite: a superadmin who renames Modus or points it
 * at a staging connector from the portal should not have that undone by the next
 * restart. Only the ops URL follows the environment, because that is the one
 * field the hosting platform legitimately owns.
 */
async function seedApps() {
  for (const app of SEED_APPS) {
    await sql(
      `INSERT INTO zina_apps (id, name, tagline, app_url, admin_url, ops_base_url, accent, sort_order)
       VALUES (:id, :name, :tagline, :app_url, :admin_url, :ops, :accent, :sort::int)
       ON CONFLICT (id) DO UPDATE
         SET ops_base_url = COALESCE(NULLIF(:ops, ''), zina_apps.ops_base_url),
             -- Fill a blank admin URL, but never overwrite one someone set.
             admin_url    = COALESCE(NULLIF(zina_apps.admin_url, ''), :admin_url),
             updated_at   = now()`,
      {
        id: app.id,
        name: app.name,
        tagline: app.tagline,
        app_url: app.app_url,
        admin_url: app.admin_url,
        ops: app.ops_base_url,
        accent: app.accent,
        sort: app.sort_order,
      }
    );
  }
}

/** The shared secret for one app: its own row, else a single ecosystem-wide key. */
function secretFor(app) {
  return app.ops_secret || process.env.ZINA_OPS_SECRET || "";
}

/**
 * Compute the signature for a request. Exported because the receiving side of
 * the contract — the `/ops/*` handler inside each app — has to reproduce it
 * exactly, and a second implementation is a second chance to get it wrong.
 */
function signRequest({ secret, timestamp, method, path, body }) {
  return crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${method.toUpperCase()}.${path}.${body || ""}`)
    .digest("hex");
}

/**
 * Verify an inbound signed request. The loopital API uses this for its own
 * `/ops/*` routes; the same function is what every other app should port.
 */
function verifySignature({ secret, timestamp, method, path, body, signature }) {
  if (!secret || !signature || !timestamp) return false;
  const age = Math.abs(Date.now() - Number(timestamp));
  if (!Number.isFinite(age) || age > SIGNATURE_WINDOW_MS) return false;
  const expected = signRequest({ secret, timestamp, method, path, body });
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Call one app's connector.
 *
 * Never throws. A connector that is unconfigured, asleep, slow or broken is an
 * ordinary state of the world for a dashboard that fans out to six apps, so the
 * failure comes back as data (`{ ok: false, reason }`) and the caller decides
 * how loudly to say so.
 */
async function callOps(app, path, { method = "GET", body = null } = {}) {
  const base = String(app.ops_base_url || "").replace(/\/+$/, "");
  if (!base) return { ok: false, reason: "unconfigured", status: 0 };
  if (base === "self") return { ok: false, reason: "self", status: 0 };

  const secret = secretFor(app);
  if (!secret) return { ok: false, reason: "no-secret", status: 0 };

  const payload = body == null ? "" : JSON.stringify(body);
  const timestamp = String(Date.now());
  const signature = signRequest({ secret, timestamp, method, path, body: payload });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OPS_TIMEOUT_MS);
  const startedAt = Date.now();
  try {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-zina-app": app.id,
        "x-zina-timestamp": timestamp,
        "x-zina-signature": signature,
      },
      ...(payload ? { body: payload } : {}),
      signal: controller.signal,
    });
    const latencyMs = Date.now() - startedAt;
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (_) {
      data = { raw: text.slice(0, 500) };
    }
    if (!res.ok) {
      return {
        ok: false,
        reason: res.status === 404 ? "unsupported" : "error",
        status: res.status,
        latencyMs,
        detail: (data && data.error) || `HTTP ${res.status}`,
      };
    }
    return { ok: true, status: res.status, latencyMs, data };
  } catch (e) {
    const aborted = e && e.name === "AbortError";
    return {
      ok: false,
      reason: aborted ? "timeout" : "unreachable",
      status: 0,
      latencyMs: Date.now() - startedAt,
      detail: aborted ? `No answer in ${OPS_TIMEOUT_MS}ms` : (e && e.message) || "Network error",
    };
  }
}

/** Read the registry, newest config first. */
async function listApps({ includeDisabled = false } = {}) {
  return sql(
    `SELECT a.*, h.status AS health_status, h.latency_ms, h.db_status, h.detail AS health_detail, h.checked_at
       FROM zina_apps a
       LEFT JOIN zina_app_health h ON h.app_id = a.id
      ${includeDisabled ? "" : "WHERE a.enabled = true"}
      ORDER BY a.sort_order, a.name`
  );
}

async function getApp(id) {
  const rows = await sql("SELECT * FROM zina_apps WHERE id = :id", { id });
  return rows[0] || null;
}

/**
 * Run the same connector call across every app at once and return a map keyed by
 * app id. Fan-out is parallel because six sequential eight-second timeouts is a
 * dashboard nobody waits for.
 */
async function fanOut(apps, path, options) {
  const results = await Promise.all(
    apps.map(async (app) => [app.id, await callOps(app, path, options)])
  );
  return Object.fromEntries(results);
}

/** Translate a connector result into the health vocabulary the portal shows. */
function healthFromResult(result) {
  if (result.ok) {
    const reported = result.data && result.data.status;
    const status = reported === "degraded" || reported === "down" ? reported : "ok";
    return {
      status,
      latency_ms: result.latencyMs ?? null,
      version: (result.data && result.data.version) || null,
      db_status: (result.data && result.data.db && result.data.db.status) || null,
      detail: (result.data && result.data.detail) || null,
    };
  }
  if (result.reason === "unconfigured" || result.reason === "no-secret" || result.reason === "self") {
    return {
      status: result.reason === "self" ? "ok" : "unconfigured",
      latency_ms: null,
      version: null,
      db_status: null,
      detail: result.reason === "no-secret" ? "No connector secret set." : null,
    };
  }
  return {
    status: result.reason === "timeout" || result.reason === "unreachable" ? "down" : "degraded",
    latency_ms: result.latencyMs ?? null,
    version: null,
    db_status: null,
    detail: result.detail || result.reason,
  };
}

/** Check every app and record the result. Returns the same shape the portal reads. */
async function refreshHealth(apps) {
  const results = await fanOut(apps, "/health");
  const out = [];
  for (const app of apps) {
    const health = healthFromResult(results[app.id]);
    await sql(
      `INSERT INTO zina_app_health (app_id, status, latency_ms, version, db_status, detail, checked_at)
       VALUES (:id, :status, :latency::int, :version, :db, :detail, now())
       ON CONFLICT (app_id) DO UPDATE
         SET status = :status, latency_ms = :latency::int, version = :version,
             db_status = :db, detail = :detail, checked_at = now()`,
      {
        id: app.id,
        status: health.status,
        latency: health.latency_ms,
        version: health.version,
        db: health.db_status,
        detail: health.detail,
      }
    );
    out.push({ appId: app.id, ...health });
  }
  return out;
}

module.exports = {
  SEED_APPS,
  SIGNATURE_WINDOW_MS,
  seedApps,
  signRequest,
  verifySignature,
  callOps,
  fanOut,
  listApps,
  getApp,
  healthFromResult,
  refreshHealth,
};
