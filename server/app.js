"use strict";

/**
 * The Loopital hub.
 *
 * A small API that sits beside the Loopital platform on the same host, served
 * same-origin at /hub on loopital.com and zina.loopital.com. It owns what the
 * platform does not:
 *
 *   Team accounts        POST /auth/signup, POST /auth/signin, GET /auth/me
 *   Team onboarding      /onboarding/*  (NDA e-signature, the nine-step form, handbook)
 *   Public submissions   POST /contribute, POST /contact
 *   Admin (Zina)         /admin/*  — onboarding records and submissions
 *
 * Admin routes do not have their own login. They accept the access token of a
 * signed-in Zina (Council) member, verified with the platform's JWT secret, so
 * one account, one 2FA and one session policy govern everything an operator can
 * see. Onboarding records hold payroll and identity details, so the role check
 * happens here, on every request.
 */

const { sql } = require("./db");
const onboarding = require("./onboarding");
const { sendNotification } = require("./notify");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const TOKEN_TTL = "7d";
const NOTIFY_EMAILS = ["info@loopital.com", "tuamenebestgod@gmail.com"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Council roles that may open onboarding records and submissions, and the
// smaller set that may see payroll and identification fields.
const ADMIN_READ_ROLES = ["SUPER_ADMIN", "PLATFORM_ADMIN", "ACCOUNT_MANAGER", "FINANCE_OFFICER"];
const ADMIN_SENSITIVE_ROLES = ["SUPER_ADMIN", "FINANCE_OFFICER"];

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    body: JSON.stringify(body),
  };
}

function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email };
}

// ── Team accounts ─────────────────────────────────────────────────────────

function teamSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return s;
}

async function signup(body) {
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!name) return json(400, { error: "Please enter your name." });
  if (!EMAIL_RE.test(email)) return json(400, { error: "Please enter a valid email address." });
  if (password.length < 8) return json(400, { error: "Password must be at least 8 characters." });

  const existing = await sql("SELECT id FROM users WHERE email = :email", { email });
  if (existing.length > 0) return json(409, { error: "An account with this email already exists." });

  const rows = await sql(
    `INSERT INTO users (name, email, password_hash)
     VALUES (:name, :email, :password_hash)
     RETURNING id, name, email`,
    { name, email, password_hash: await bcrypt.hash(password, 10) }
  );
  const user = rows[0];
  const token = jwt.sign({ sub: user.id, email: user.email }, teamSecret(), { expiresIn: TOKEN_TTL });
  return json(201, { token, user: publicUser(user) });
}

async function signin(body) {
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !password) return json(400, { error: "Please enter your email and password." });

  const rows = await sql("SELECT id, name, email, password_hash FROM users WHERE email = :email", { email });
  if (rows.length === 0 || !(await bcrypt.compare(password, rows[0].password_hash))) {
    return json(401, { error: "Invalid email or password." });
  }
  const token = jwt.sign({ sub: rows[0].id, email: rows[0].email }, teamSecret(), { expiresIn: TOKEN_TTL });
  return json(200, { token, user: publicUser(rows[0]) });
}

function bearer(headers) {
  const auth = headers.authorization || headers.Authorization || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

/** A team member's session, or null. */
function authenticate(headers) {
  const token = bearer(headers);
  if (!token) return null;
  try {
    const payload = jwt.verify(token, teamSecret());
    // A Council token is signed with a different secret, so it cannot pass here;
    // this guards against the reverse mix-up if the secrets were ever set equal.
    return payload && payload.kind === "council" ? null : payload;
  } catch (_) {
    return null;
  }
}

async function me(headers) {
  const payload = authenticate(headers);
  if (!payload) return json(401, { error: "Session expired. Please sign in again." });
  const rows = await sql("SELECT id, name, email FROM users WHERE id = :id::uuid", { id: payload.sub });
  if (rows.length === 0) return json(401, { error: "Account not found." });
  return json(200, { user: publicUser(rows[0]) });
}

// ── Admin: a signed-in Zina member ────────────────────────────────────────

function requireCouncil(headers, roles) {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) return { error: json(503, { error: "Admin access is not configured." }) };
  const token = bearer(headers);
  if (!token) return { error: json(401, { error: "Please sign in to Zina." }) };
  let payload;
  try {
    payload = jwt.verify(token, secret);
  } catch (_) {
    return { error: json(401, { error: "Your Zina session has expired. Sign in again." }) };
  }
  if (!payload || payload.kind !== "council" || !Array.isArray(payload.roles)) {
    return { error: json(401, { error: "Please sign in to Zina." }) };
  }
  if (!payload.roles.some((r) => roles.includes(r))) {
    return { error: json(403, { error: "Your role does not include team records." }) };
  }
  return { member: payload };
}

const csvCell = (v) => {
  const s = Array.isArray(v) ? v.join("; ") : v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
  return '"' + s.replace(/"/g, '""') + '"';
};

async function adminSubmissions(qs) {
  const kind = qs("kind");
  const rows = await sql(
    `SELECT id, kind, product, name, email, phone, organisation, details, created_at
       FROM submissions ${kind ? "WHERE kind = :kind" : ""}
      ORDER BY created_at DESC LIMIT 1000`,
    kind ? { kind } : {}
  );
  const counts = await sql(`SELECT kind, count(*)::int AS n FROM submissions GROUP BY kind`);
  return json(200, {
    counts: Object.fromEntries(counts.map((c) => [c.kind, c.n])),
    submissions: rows.map((r) => ({
      id: r.id, kind: r.kind, name: r.name, email: r.email, phone: r.phone,
      organisation: r.organisation, details: r.details || {}, createdAt: r.created_at,
    })),
  });
}

async function adminSubmissionsCsv(qs) {
  const kind = qs("kind");
  const rows = await sql(
    `SELECT kind, name, email, phone, organisation, details, created_at
       FROM submissions ${kind ? "WHERE kind = :kind" : ""}
      ORDER BY created_at DESC LIMIT 5000`,
    kind ? { kind } : {}
  );
  const detailKeys = [...new Set(rows.flatMap((r) => Object.keys(r.details || {})))].sort();
  const head = ["kind", "name", "email", "phone", "organisation", "created_at", ...detailKeys];
  const lines = [head.map(csvCell).join(",")];
  for (const r of rows) {
    const d = r.details || {};
    lines.push([r.kind, r.name, r.email, r.phone, r.organisation, r.created_at, ...detailKeys.map((k) => d[k])].map(csvCell).join(","));
  }
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="loopital-submissions${kind ? "-" + kind.replace(/[^a-z0-9_-]/gi, "") : ""}.csv"`,
      "Cache-Control": "no-store",
    },
    body: lines.join("\n"),
  };
}

async function adminRoute(method, route, headers, qs) {
  if (route.startsWith("/admin/onboarding")) {
    const { member, error } = requireCouncil(headers, ADMIN_READ_ROLES);
    if (error) return error;
    const canSeeSensitive = member.roles.some((r) => ADMIN_SENSITIVE_ROLES.includes(r));
    if (method === "GET" && route === "/admin/onboarding") return onboarding.adminList();
    if (method === "GET" && route === "/admin/onboarding/export") return onboarding.adminCsv(canSeeSensitive);
    const m = route.match(/^\/admin\/onboarding\/([0-9a-f-]{36})(\/nda\.pdf)?$/i);
    if (method === "GET" && m) return m[2] ? onboarding.adminNdaPdf(m[1]) : onboarding.adminDetail(m[1], canSeeSensitive);
  }
  if (route.startsWith("/admin/submissions")) {
    const { error } = requireCouncil(headers, ADMIN_READ_ROLES);
    if (error) return error;
    if (method === "GET" && route === "/admin/submissions") return adminSubmissions(qs);
    if (method === "GET" && route === "/admin/submissions.csv") return adminSubmissionsCsv(qs);
  }
  return null;
}

// ── Public submissions ────────────────────────────────────────────────────

async function recordSubmission(kind, input) {
  try {
    await sql(
      `INSERT INTO submissions (kind, product, name, email, phone, organisation, details)
       VALUES (:kind, :product, :name, :email, :phone, :organisation, CAST(:details AS jsonb))`,
      {
        kind,
        product: input.product || null,
        name: input.name || null,
        email: input.email || null,
        phone: input.phone || null,
        organisation: input.organisation || null,
        details: JSON.stringify(input.details || {}),
      }
    );
  } catch (e) {
    console.error("submission log failed:", (e && e.message) || e);
  }
}

async function sendEmail(to, subject, text, replyTo) {
  try {
    const result = await sendNotification({ to, subject, body: text, replyTo, template: "hub" });
    if (!result.ok) console.error(`email "${subject}" not sent:`, result.error);
  } catch (e) {
    console.error(`email "${subject}" failed:`, (e && e.message) || e);
  }
}

const MAIL_SIGNOFF = "\n\n— The Loopital team\nloopital.com";
const firstName = (name) => String(name || "there").trim().split(/\s+/)[0] || "there";

/**
 * The research questionnaire at loopital.com/contribute. Only name, email, phone
 * and consent are enforced, so an impatient visitor can still submit something.
 */
async function handleContribute(body) {
  const path = String(body.path || "").trim().toLowerCase();
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.phone || "").trim();
  const organisation = String(body.organisation || "").trim();
  const answers = body.answers || {};
  const attribution = body.attribution || {};

  if (path !== "individual" && path !== "organization") {
    return json(400, { error: "Tell us whether you are an individual or an organisation." });
  }
  if (!name) return json(400, { error: "Please add your name." });
  if (!EMAIL_RE.test(email)) return json(400, { error: "Please add a valid email address." });
  if (!phone) return json(400, { error: "Please add a phone number." });
  if (body.consent !== true) return json(400, { error: "Please tick the consent box so we can reply." });

  await recordSubmission("contribute", {
    product: "loopital",
    name,
    email,
    phone,
    organisation: organisation || null,
    details: { path, ...answers, attribution },
  });

  // Organisations get an immediate alert; individuals are reviewed in Zina.
  if (path === "organization") {
    const lines = Object.entries(answers)
      .filter(([, v]) => v !== "" && v != null && !(Array.isArray(v) && v.length === 0))
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`);
    await sendEmail(
      NOTIFY_EMAILS,
      `[Loopital] Facility contribution — ${organisation || name}`,
      `${name} <${email}> ${phone}\nFacility: ${organisation || "-"}\n\n${lines.join("\n")}`
    );
  }

  await sendEmail(
    email,
    "Thanks for helping us build Loopital",
    `Hi ${firstName(name)},

Thank you, this genuinely helps. We are reading every response as we build Loopital.

${path === "organization"
  ? "Our team personally reviews every facility response. If there is a fit for an early pilot, we will reach out directly."
  : "If you asked for early access, we will reach out when we are ready for you."}${MAIL_SIGNOFF}`
  );

  return json(201, { ok: true });
}

async function handleContact(body) {
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const subject = String(body.subject || "").trim() || "General";
  const message = String(body.message || "").trim();
  if (!name || !EMAIL_RE.test(email) || !message) {
    return json(400, { error: "Please add your name, a valid email, and a message." });
  }
  await recordSubmission("contact", { name, email, details: { subject, message } });
  await sendEmail(
    NOTIFY_EMAILS,
    `[Loopital] ${subject} — ${name}`,
    `New contact form submission\n\nName: ${name}\nEmail: ${email}\nTopic: ${subject}\n\nMessage:\n${message}`,
    email
  );
  return json(201, { ok: true });
}

// ── Router ────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  const method = event.httpMethod || "GET";
  // Served under /hub; /api is accepted too so older builds keep working.
  const route = (event.rawPath || "").replace(/^\/(hub|api)(?=\/|$)/, "") || "/";
  const query = event.queryStringParameters || {};
  const qs = (k) => (typeof query[k] === "string" ? query[k] : undefined);
  const headers = event.headers || {};

  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body) || {};
    } catch (_) {
      return json(400, { error: "Invalid request body." });
    }
  }

  try {
    if (method === "GET" && route === "/health") return json(200, { status: "ok" });

    const admin = await adminRoute(method, route, headers, qs);
    if (admin) return admin;

    if (method === "POST" && route === "/auth/signup") return await signup(body);
    if (method === "POST" && route === "/auth/signin") return await signin(body);
    if (method === "GET" && route === "/auth/me") return await me(headers);
    if (method === "POST" && route === "/contribute") return await handleContribute(body);
    if (method === "POST" && route === "/contact") return await handleContact(body);

    // Every onboarding route is authenticated as the team member themselves. The
    // stage gates are re-checked in server/onboarding.js on each call.
    if (route.startsWith("/onboarding/")) {
      const user = authenticate(headers);
      if (!user) return json(401, { error: "Please sign in to continue." });
      if (method === "GET" && route === "/onboarding/state") return await onboarding.getState(user);
      if (method === "GET" && route === "/onboarding/document") return onboarding.getDocument();
      if (method === "POST" && route === "/onboarding/nda") return await onboarding.signNda(user, body, headers);
      if (method === "GET" && route === "/onboarding/nda.pdf") return await onboarding.ownNda(user);
      if (method === "GET" && route === "/onboarding/handbook.pdf") return await onboarding.handbook(user);
      if (method === "POST" && route === "/onboarding/form/save") return await onboarding.saveForm(user, body);
      if (method === "POST" && route === "/onboarding/form/submit") return await onboarding.submitForm(user, body);
    }

    return json(404, { error: "Not found." });
  } catch (err) {
    console.error("Handler error:", err);
    return json(500, { error: "Something went wrong. Please try again." });
  }
};
