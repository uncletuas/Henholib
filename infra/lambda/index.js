"use strict";

/**
 * Loopital authentication API.
 *
 * Runs on AWS Lambda behind an API Gateway HTTP API. Talks to an Aurora
 * Serverless v2 PostgreSQL cluster over the RDS Data API (no VPC plumbing
 * required). Issues JWTs for authenticated sessions.
 *
 * Routes (all under the /api prefix, which CloudFront forwards to this API):
 *   POST /api/auth/signup            { name, email, password }     -> { token, user }
 *   POST /api/auth/signin            { email, password }           -> { token, user }
 *   GET  /api/auth/me                (Authorization: Bearer <jwt>) -> { user }
 *   GET  /api/account/subscriptions  (Bearer)  -> { subscriptions } (SART34/STACK62)
 *   GET  /api/account/invoices       (Bearer)  -> { invoices }      (SART34/STACK62)
 *   POST /api/sso/token              (Bearer)  { product } -> { ssoToken, expiresIn }
 *   POST /api/sso/exchange           { token, product }   -> { user }
 *   GET  /api/health                                       -> { status: "ok" }
 *
 * The unified loopital account is the single identity provider (IdP). SART34
 * and STACK62 federate against it: loopital mints a short-lived, audience-bound
 * SSO token (POST /sso/token) that the user carries to the product app, whose
 * backend exchanges it for the canonical loopital user (POST /sso/exchange) and
 * establishes its own session — so one loopital account signs into both apps.
 * HMS7 and FMS13 are demo-led and are never part of this federation.
 */

const {
  RDSDataClient,
  ExecuteStatementCommand,
} = require("@aws-sdk/client-rds-data");
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { SESv2Client, SendEmailCommand } = require("@aws-sdk/client-sesv2");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const rds = new RDSDataClient({});
const sm = new SecretsManagerClient({});
const s3 = new S3Client({});
const ses = new SESv2Client({});

const {
  CLUSTER_ARN, SECRET_ARN, DB_NAME, JWT_SECRET_ARN, MATERIALS_BUCKET, SES_FROM,
  RESEND_API_KEY, RESEND_FROM_EMAIL, PAYSTACK_SECRET_KEY, PAYSTACK_CALLBACK_URL,
} = process.env;
const TOKEN_TTL = "7d";

let cachedJwtSecret;
async function getJwtSecret() {
  if (cachedJwtSecret) return cachedJwtSecret;
  const res = await sm.send(new GetSecretValueCommand({ SecretId: JWT_SECRET_ARN }));
  let value = res.SecretString;
  try {
    const parsed = JSON.parse(value);
    value = parsed.secret || parsed.value || value;
  } catch (_) {
    /* plain string secret */
  }
  cachedJwtSecret = value;
  return value;
}

/** Execute a parameterised SQL statement and return parsed JSON rows. */
async function sql(statement, params = {}) {
  const parameters = Object.entries(params).map(([name, raw]) => {
    let value;
    if (raw === null || raw === undefined) value = { isNull: true };
    else value = { stringValue: String(raw) };
    return { name, value };
  });

  const res = await rds.send(
    new ExecuteStatementCommand({
      resourceArn: CLUSTER_ARN,
      secretArn: SECRET_ARN,
      database: DB_NAME,
      sql: statement,
      parameters,
      formatRecordsAs: "JSON",
    })
  );
  return res.formattedRecords ? JSON.parse(res.formattedRecords) : [];
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email };
}

async function signup(body) {
  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  if (!name) return json(400, { error: "Please enter your name." });
  if (!EMAIL_RE.test(email)) return json(400, { error: "Please enter a valid email address." });
  if (password.length < 8)
    return json(400, { error: "Password must be at least 8 characters." });

  const existing = await sql("SELECT id FROM users WHERE email = :email", { email });
  if (existing.length > 0)
    return json(409, { error: "An account with this email already exists." });

  const passwordHash = await bcrypt.hash(password, 10);
  const rows = await sql(
    `INSERT INTO users (name, email, password_hash)
     VALUES (:name, :email, :password_hash)
     RETURNING id, name, email`,
    { name, email, password_hash: passwordHash }
  );
  const user = rows[0];
  const secret = await getJwtSecret();
  const token = jwt.sign({ sub: user.id, email: user.email }, secret, {
    expiresIn: TOKEN_TTL,
  });
  await notifyAdmins(
    "New Loopital signup",
    `A new account was created.\n\nName: ${user.name}\nEmail: ${user.email}`
  );
  return json(201, { token, user: publicUser(user) });
}

// Public waitlist capture for products not yet open to the public (STACK62, SART34).
// No account or auth required; idempotent per (email, product).
async function joinWaitlist(body) {
  const email = (body.email || "").trim().toLowerCase();
  const product = String(body.product || "").trim().toLowerCase();
  const name = (body.name || "").trim() || null;

  if (!EMAIL_RE.test(email)) return json(400, { error: "Please enter a valid email address." });
  if (!product) return json(400, { error: "Missing product." });

  await sql(
    `INSERT INTO waitlist (email, product, name)
     VALUES (:email, :product, :name)
     ON CONFLICT (email, product) DO NOTHING`,
    { email, product, name }
  );
  await notifyAdmins(
    `New waitlist signup — ${product}`,
    `Someone joined a product waitlist.\n\nProduct: ${product}\nEmail: ${email}\nName: ${name || "—"}`
  );
  return json(201, { ok: true });
}

async function signin(body) {
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  if (!email || !password)
    return json(400, { error: "Please enter your email and password." });

  const rows = await sql(
    "SELECT id, name, email, password_hash FROM users WHERE email = :email",
    { email }
  );
  if (rows.length === 0)
    return json(401, { error: "Invalid email or password." });

  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) return json(401, { error: "Invalid email or password." });

  const secret = await getJwtSecret();
  const token = jwt.sign({ sub: rows[0].id, email: rows[0].email }, secret, {
    expiresIn: TOKEN_TTL,
  });
  return json(200, { token, user: publicUser(rows[0]) });
}

/**
 * Verify the Bearer token and return its JWT payload, or null when missing or
 * invalid. Shared by every authenticated route.
 */
async function authenticate(headers) {
  const auth = headers.authorization || headers.Authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  try {
    const secret = await getJwtSecret();
    return jwt.verify(token, secret);
  } catch (_) {
    return null;
  }
}

async function me(headers) {
  const payload = await authenticate(headers);
  if (!payload) return json(401, { error: "Session expired. Please sign in again." });

  // id is a uuid column; the Data API passes :id as text, so cast explicitly.
  const rows = await sql(
    "SELECT id, name, email FROM users WHERE id = :id::uuid",
    { id: payload.sub }
  );
  if (rows.length === 0) return json(401, { error: "Account not found." });
  return json(200, { user: publicUser(rows[0]) });
}

// Subscriptions/invoices for anything other than the account-linked products
// are never returned by the portal — HMS7/FMS13 are handled via sales, not
// self-serve. The IN ('sart34','stack62') filter enforces this in SQL.
const money = (cents, currency) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" })
    .format((Number(cents) || 0) / 100);

async function getSubscriptions(headers) {
  const payload = await authenticate(headers);
  if (!payload) return json(401, { error: "Not authenticated." });

  const rows = await sql(
    `SELECT product, plan, status, current_period_end
       FROM subscriptions
      WHERE user_id = :id::uuid
        AND product IN ('sart34','stack62')
      ORDER BY product`,
    { id: payload.sub }
  );
  const subscriptions = rows.map((r) => ({
    product: r.product,
    plan: r.plan,
    status: r.status,
    currentPeriodEnd: r.current_period_end,
  }));
  return json(200, { subscriptions });
}

async function getInvoices(headers) {
  const payload = await authenticate(headers);
  if (!payload) return json(401, { error: "Not authenticated." });

  const rows = await sql(
    `SELECT id, product, amount_cents, currency, status, issued_at
       FROM invoices
      WHERE user_id = :id::uuid
        AND product IN ('sart34','stack62')
      ORDER BY issued_at DESC
      LIMIT 50`,
    { id: payload.sub }
  );
  const invoices = rows.map((r) => ({
    id: r.id,
    product: r.product,
    amount: money(r.amount_cents, r.currency),
    status: r.status,
    issuedAt: r.issued_at,
  }));
  return json(200, { invoices });
}

// Products that federate against the loopital identity. STACK62 and SART34
// only — HMS7/FMS13 are demo-led and excluded.
const SSO_PRODUCTS = ["sart34", "stack62"];
const SSO_TOKEN_TTL = "120s"; // short-lived; carried via redirect to the app

/**
 * Mint a short-lived, audience-bound SSO token for a logged-in loopital user.
 * The user carries it to the product app (e.g. on "Launch STACK62"); the app's
 * backend then calls /sso/exchange to resolve the canonical loopital user.
 */
async function issueSsoToken(headers, body) {
  const payload = await authenticate(headers);
  if (!payload) return json(401, { error: "Not authenticated." });

  const product = String(body.product || "").toLowerCase();
  if (!SSO_PRODUCTS.includes(product))
    return json(400, { error: "Unknown product for SSO." });

  const secret = await getJwtSecret();
  const ssoToken = jwt.sign(
    { sub: payload.sub, email: payload.email, typ: "sso", aud: product },
    secret,
    { expiresIn: SSO_TOKEN_TTL }
  );
  return json(200, { ssoToken, expiresIn: 120 });
}

/**
 * Exchange a short-lived SSO token for the canonical loopital user. Called
 * server-to-server by the product app after the user lands with the token.
 * Validates signature, type, audience, and expiry, then returns the user so the
 * app can provision/link its own account keyed by the loopital user id.
 */
async function exchangeSsoToken(body) {
  const token = body.token;
  const product = String(body.product || "").toLowerCase();
  if (!token) return json(400, { error: "Missing SSO token." });
  if (!SSO_PRODUCTS.includes(product))
    return json(400, { error: "Unknown product for SSO." });

  let payload;
  try {
    const secret = await getJwtSecret();
    payload = jwt.verify(token, secret, { audience: product });
  } catch (_) {
    return json(401, { error: "Invalid or expired SSO token." });
  }
  if (payload.typ !== "sso")
    return json(401, { error: "Not an SSO token." });

  const rows = await sql(
    "SELECT id, name, email, pal_onboarded, pal_use_type, pal_org_name FROM users WHERE id = :id::uuid",
    { id: payload.sub }
  );
  if (rows.length === 0) return json(401, { error: "Account not found." });
  const u = rows[0];
  // Entitlements the product app (e.g. Pal) uses to gate paid features.
  const paid = await sql(
    "SELECT 1 AS ok FROM subscriptions WHERE user_id = :id::uuid AND product = :product AND status IN ('active','trialing')",
    { id: payload.sub, product }
  );
  return json(200, {
    user: publicUser(u),
    entitlements: { coworker: paid.length > 0 },
    profile: {
      onboarded: u.pal_onboarded === true || u.pal_onboarded === "true",
      useType: u.pal_use_type || null,
      orgName: u.pal_org_name || null,
    },
  });
}

// ── Pal workspace: profile/onboarding, entitlements & billing (Loopital-billed) ──
// NOTE: the Paystack account currently only supports NGN (USD → "unsupported_currency").
// Amount is in the currency's subunit (kobo for NGN). PLACEHOLDER price — confirm.
const PAYSTACK_CURRENCY = process.env.PAYSTACK_CURRENCY || "NGN";
const PAL_COWORKER_AMOUNT = Number(process.env.PAL_COWORKER_AMOUNT) || 1500000; // ₦15,000/mo
const PAYSTACK_API = "https://api.paystack.co";

async function palProfile(headers) {
  const p = await authenticate(headers);
  if (!p) return json(401, { error: "Not authenticated." });
  const rows = await sql("SELECT pal_onboarded, pal_use_type, pal_org_name, pal_team_size FROM users WHERE id = :id::uuid", { id: p.sub });
  if (!rows.length) return json(401, { error: "Account not found." });
  const u = rows[0];
  const coworker = (await sql("SELECT 1 AS ok FROM subscriptions WHERE user_id = :id::uuid AND product = 'stack62' AND status IN ('active','trialing')", { id: p.sub })).length > 0;
  return json(200, {
    onboarded: u.pal_onboarded === true || u.pal_onboarded === "true",
    useType: u.pal_use_type || null,
    orgName: u.pal_org_name || null,
    teamSize: u.pal_team_size || null,
    coworker,
  });
}

async function palOnboarding(headers, body) {
  const p = await authenticate(headers);
  if (!p) return json(401, { error: "Not authenticated." });
  const useType = body.useType === "team" ? "team" : "personal";
  const orgName = (body.orgName || "").trim() || null;
  const teamSize = (body.teamSize || "").trim() || null;
  const rows = await sql(
    `UPDATE users SET pal_onboarded = true, pal_use_type = :useType, pal_org_name = :orgName, pal_team_size = :teamSize
     WHERE id = :id::uuid RETURNING name, email`,
    { useType, orgName, teamSize, id: p.sub }
  );
  if (rows.length) {
    await notifyAdmins(
      "New Pal workspace onboarding",
      `A user set up their Pal workspace.\n\nName: ${rows[0].name}\nEmail: ${rows[0].email}\nUse: ${useType}${orgName ? `\nOrg: ${orgName}` : ""}${teamSize ? `\nTeam size: ${teamSize}` : ""}`
    );
  }
  return json(200, { ok: true });
}

// ---- Paystack (Loopital-billed) ----
async function paystackInit({ email, amountCents, reference, metadata, callbackUrl }) {
  const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, amount: amountCents, currency: PAYSTACK_CURRENCY, reference, metadata, callback_url: callbackUrl }),
  });
  const data = await res.json();
  if (!res.ok || !data.status) throw new Error(data.message || `Paystack init ${res.status}`);
  return data.data; // { authorization_url, access_code, reference }
}
async function paystackVerify(reference) {
  const res = await fetch(`${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
  });
  const data = await res.json();
  if (!res.ok || !data.status) throw new Error(data.message || `Paystack verify ${res.status}`);
  return data.data; // { status: 'success' | ... }
}

async function palSubscribe(headers) {
  const p = await authenticate(headers);
  if (!p) return json(401, { error: "Not authenticated." });
  if (!PAYSTACK_SECRET_KEY) return json(503, { error: "Payments aren't configured yet." });
  const reference = "PAL-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(1000 + Math.random() * 9000);
  await sql("INSERT INTO pal_payments (user_id, reference, amount_cents, currency, status) VALUES (:uid::uuid, :ref, :amt::int, :cur, 'pending')", { uid: p.sub, ref: reference, amt: PAL_COWORKER_AMOUNT, cur: PAYSTACK_CURRENCY });
  try {
    const init = await paystackInit({ email: p.email, amountCents: PAL_COWORKER_AMOUNT, reference, metadata: { userId: p.sub, purpose: "pal_coworker" }, callbackUrl: PAYSTACK_CALLBACK_URL });
    return json(200, { authorizationUrl: init.authorization_url, reference });
  } catch (e) {
    await sql("UPDATE pal_payments SET status = 'failed' WHERE reference = :ref", { ref: reference });
    console.error("paystackInit failed:", (e && e.message) || e);
    return json(502, { error: "Couldn't start payment. Please try again." });
  }
}

// Mark a payment successful + activate the Pal coworker subscription (idempotent).
async function activatePalPayment(reference) {
  const rows = await sql("SELECT user_id, status FROM pal_payments WHERE reference = :ref", { ref: reference });
  if (!rows.length) return false;
  if (rows[0].status !== "success") {
    await sql("UPDATE pal_payments SET status = 'success' WHERE reference = :ref", { ref: reference });
    await sql(
      `INSERT INTO subscriptions (user_id, product, plan, status, current_period_end)
       VALUES (:uid::uuid, 'stack62', 'coworker', 'active', now() + interval '30 days')
       ON CONFLICT (user_id, product) DO UPDATE SET status = 'active', plan = 'coworker', current_period_end = now() + interval '30 days'`,
      { uid: rows[0].user_id }
    );
  }
  return true;
}

async function payVerify(headers, reference) {
  const p = await authenticate(headers);
  if (!p) return json(401, { error: "Not authenticated." });
  if (!reference) return json(400, { error: "Missing reference." });
  try {
    const data = await paystackVerify(reference);
    if (data.status === "success") { await activatePalPayment(reference); return json(200, { status: "success" }); }
    return json(200, { status: data.status || "pending" });
  } catch (e) {
    console.error("payVerify failed:", (e && e.message) || e);
    return json(502, { error: "Couldn't verify payment." });
  }
}

async function paystackWebhook(event, body) {
  const sig = (event.headers && (event.headers["x-paystack-signature"] || event.headers["X-Paystack-Signature"])) || "";
  const raw = event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString("utf8") : (event.body || "");
  const expected = crypto.createHmac("sha512", PAYSTACK_SECRET_KEY || "").update(raw).digest("hex");
  if (!sig || sig !== expected) return json(401, { error: "Invalid signature." });
  if (body && body.event === "charge.success" && body.data && body.data.reference) {
    await activatePalPayment(body.data.reference);
  }
  return json(200, { ok: true });
}

// ── Loopital Academy ──────────────────────────────────────────────────────
// Public course catalog + application capture, plus an admin-only management
// portal (single shared credential, set once via self-service bootstrap).

const ADMIN_TOKEN_TTL = "12h";

function parseJsonField(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch (_) {
    return fallback;
  }
}

// Shape a raw course row for the client (camelCase, parsed JSON fields).
function courseOut(row) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    image: row.image || "",
    track: row.track,
    courseType: row.course_type || "live",
    deliveryMode: row.delivery_mode || "online",
    shortDesc: row.short_desc || "",
    fullDesc: row.full_desc || "",
    whoFor: parseJsonField(row.who_for, []),
    curriculum: parseJsonField(row.curriculum, []),
    format: parseJsonField(row.format, {}),
    priceCents: Number(row.price_cents) || 0,
    currency: row.currency || "USD",
    status: row.status,
    published: row.published === true || row.published === "true",
    sortOrder: Number(row.sort_order) || 0,
    instructorName: row.instructor_name || "",
    instructorTitle: row.instructor_title || "",
    instructorBio: row.instructor_bio || "",
    introVideoUrl: row.intro_video_url || "",
    selfPacedVideos: parseJsonField(row.self_paced_videos, []),
  };
}

const COURSE_COLS =
  "id, slug, title, image, track, course_type, delivery_mode, short_desc, full_desc, who_for, curriculum, format, price_cents, currency, status, published, sort_order, instructor_name, instructor_title, instructor_bio, intro_video_url, self_paced_videos";

async function listCourses() {
  const rows = await sql(
    `SELECT ${COURSE_COLS} FROM academy_courses WHERE published = true ORDER BY sort_order, title`
  );
  return json(200, { courses: rows.map(courseOut) });
}

async function getCourse(slug) {
  const clean = String(slug || "").trim().toLowerCase();
  const rows = await sql(
    `SELECT ${COURSE_COLS} FROM academy_courses WHERE slug = :slug AND published = true`,
    { slug: clean }
  );
  if (rows.length === 0) return json(404, { error: "Course not found." });
  return json(200, { course: courseOut(rows[0]) });
}

async function submitApplication(body) {
  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const phone = (body.phone || "").trim() || null;
  const courseSlug = String(body.courseSlug || "").trim().toLowerCase();
  const motivation = (body.motivation || "").trim() || null;
  const heardFrom = (body.heardFrom || "").trim() || null;

  if (!name) return json(400, { error: "Please enter your name." });
  if (!EMAIL_RE.test(email)) return json(400, { error: "Please enter a valid email address." });
  if (!courseSlug) return json(400, { error: "Missing course." });

  const found = await sql("SELECT title FROM academy_courses WHERE slug = :slug", { slug: courseSlug });
  const courseTitle = found.length ? found[0].title : courseSlug;

  await sql(
    `INSERT INTO academy_applications (course_slug, course_title, name, email, phone, motivation, heard_from)
     VALUES (:courseSlug, :courseTitle, :name, :email, :phone, :motivation, :heardFrom)`,
    { courseSlug, courseTitle, name, email, phone, motivation, heardFrom }
  );
  return json(201, { ok: true });
}

// Verify a management-portal admin token (distinct from user tokens).
async function adminAuth(headers) {
  const payload = await authenticate(headers);
  if (!payload || payload.role !== "academy_admin") return null;
  return payload;
}

async function issueAdminToken() {
  const secret = await getJwtSecret();
  return jwt.sign({ role: "academy_admin" }, secret, { expiresIn: ADMIN_TOKEN_TTL });
}

async function adminStatus() {
  const rows = await sql("SELECT 1 AS ok FROM academy_admin WHERE id = 1");
  return json(200, { initialized: rows.length > 0 });
}

async function adminBootstrap(body) {
  const password = body.password || "";
  if (password.length < 8)
    return json(400, { error: "Password must be at least 8 characters." });
  const existing = await sql("SELECT 1 AS ok FROM academy_admin WHERE id = 1");
  if (existing.length > 0)
    return json(409, { error: "Admin is already set up. Please log in." });
  const hash = await bcrypt.hash(password, 10);
  await sql("INSERT INTO academy_admin (id, password_hash) VALUES (1, :hash)", { hash });
  return json(201, { token: await issueAdminToken() });
}

async function adminLogin(body) {
  const password = body.password || "";
  const rows = await sql("SELECT password_hash FROM academy_admin WHERE id = 1");
  if (rows.length === 0)
    return json(409, { error: "Admin isn't set up yet.", needsBootstrap: true });
  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) return json(401, { error: "Incorrect password." });
  return json(200, { token: await issueAdminToken() });
}

async function adminChangePassword(headers, body) {
  if (!(await adminAuth(headers))) return json(401, { error: "Not authorized." });
  const current = body.current || "";
  const next = body.next || "";
  if (next.length < 8) return json(400, { error: "New password must be at least 8 characters." });
  const rows = await sql("SELECT password_hash FROM academy_admin WHERE id = 1");
  if (rows.length === 0) return json(409, { error: "Admin isn't set up." });
  const ok = await bcrypt.compare(current, rows[0].password_hash);
  if (!ok) return json(401, { error: "Current password is incorrect." });
  const hash = await bcrypt.hash(next, 10);
  await sql("UPDATE academy_admin SET password_hash = :hash, updated_at = now() WHERE id = 1", { hash });
  return json(200, { ok: true });
}

async function adminListCourses(headers) {
  if (!(await adminAuth(headers))) return json(401, { error: "Not authorized." });
  const rows = await sql(`SELECT ${COURSE_COLS} FROM academy_courses ORDER BY sort_order, title`);
  return json(200, { courses: rows.map(courseOut) });
}

// Normalize the editor payload into DB params shared by insert + update.
function courseParams(body) {
  const slug = String(body.slug || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return {
    slug,
    title: (body.title || "").trim(),
    image: (body.image || "").trim() || null,
    track: ["technical", "business", "public"].includes(body.track) ? body.track : "technical",
    course_type: body.courseType === "self_paced" ? "self_paced" : "live",
    delivery_mode: ["online", "in_house", "both"].includes(body.deliveryMode) ? body.deliveryMode : "online",
    short_desc: (body.shortDesc || "").trim() || null,
    full_desc: (body.fullDesc || "").trim() || null,
    who_for: JSON.stringify(Array.isArray(body.whoFor) ? body.whoFor : []),
    curriculum: JSON.stringify(Array.isArray(body.curriculum) ? body.curriculum : []),
    format: JSON.stringify(body.format && typeof body.format === "object" ? body.format : {}),
    price_cents: Number.isFinite(+body.priceCents) ? Math.round(+body.priceCents) : 0,
    currency: body.currency || "USD",
    status: body.status === "enrolling" ? "enrolling" : "coming_soon",
    published: body.published === false ? false : true,
    sort_order: Number.isFinite(+body.sortOrder) ? Math.round(+body.sortOrder) : 0,
    instructor_name: (body.instructorName || "").trim() || null,
    instructor_title: (body.instructorTitle || "").trim() || null,
    instructor_bio: (body.instructorBio || "").trim() || null,
    intro_video_url: (body.introVideoUrl || "").trim() || null,
    self_paced_videos: JSON.stringify(Array.isArray(body.selfPacedVideos) ? body.selfPacedVideos : []),
  };
}

async function adminSaveCourse(headers, body) {
  if (!(await adminAuth(headers))) return json(401, { error: "Not authorized." });
  const p = courseParams(body);
  if (!p.slug) return json(400, { error: "A URL slug is required." });
  if (!p.title) return json(400, { error: "A title is required." });

  if (body.id) {
    const rows = await sql(
      `UPDATE academy_courses SET
         slug = :slug, title = :title, image = :image, track = :track,
         course_type = :course_type, delivery_mode = :delivery_mode,
         short_desc = :short_desc, full_desc = :full_desc, who_for = :who_for,
         curriculum = :curriculum, format = :format,
         price_cents = :price_cents::int, currency = :currency, status = :status,
         published = :published::boolean, sort_order = :sort_order::int,
         instructor_name = :instructor_name, instructor_title = :instructor_title,
         instructor_bio = :instructor_bio, intro_video_url = :intro_video_url,
         self_paced_videos = :self_paced_videos, updated_at = now()
       WHERE id = :id::uuid
       RETURNING ${COURSE_COLS}`,
      { ...p, id: body.id }
    );
    if (rows.length === 0) return json(404, { error: "Course not found." });
    return json(200, { course: courseOut(rows[0]) });
  }

  const rows = await sql(
    `INSERT INTO academy_courses
       (slug, title, image, track, course_type, delivery_mode, short_desc, full_desc, who_for, curriculum, format,
        price_cents, currency, status, published, sort_order,
        instructor_name, instructor_title, instructor_bio, intro_video_url, self_paced_videos)
     VALUES
       (:slug, :title, :image, :track, :course_type, :delivery_mode, :short_desc, :full_desc, :who_for, :curriculum, :format,
        :price_cents::int, :currency, :status, :published::boolean, :sort_order::int,
        :instructor_name, :instructor_title, :instructor_bio, :intro_video_url, :self_paced_videos)
     ON CONFLICT (slug) DO NOTHING
     RETURNING ${COURSE_COLS}`,
    p
  );
  if (rows.length === 0) return json(409, { error: "A course with that slug already exists." });
  return json(201, { course: courseOut(rows[0]) });
}

async function adminDeleteCourse(headers, body) {
  if (!(await adminAuth(headers))) return json(401, { error: "Not authorized." });
  if (!body.id) return json(400, { error: "Missing course id." });
  await sql("DELETE FROM academy_courses WHERE id = :id::uuid", { id: body.id });
  return json(200, { ok: true });
}

async function adminListApplications(headers) {
  if (!(await adminAuth(headers))) return json(401, { error: "Not authorized." });
  const rows = await sql(
    `SELECT id, course_slug, course_title, name, email, phone, motivation, heard_from, created_at
       FROM academy_applications ORDER BY created_at DESC LIMIT 500`
  );
  const applications = rows.map((r) => ({
    id: r.id,
    courseSlug: r.course_slug,
    courseTitle: r.course_title,
    name: r.name,
    email: r.email,
    phone: r.phone,
    motivation: r.motivation,
    heardFrom: r.heard_from,
    createdAt: r.created_at,
  }));
  return json(200, { applications });
}

// ── Academy LMS: facilitators & course materials ───────────────────────────

function materialOut(r) {
  return {
    id: r.id,
    courseId: r.course_id,
    title: r.title,
    kind: r.kind,
    fileName: r.file_name || "",
    contentType: r.content_type || "",
    sizeBytes: Number(r.size_bytes) || 0,
    studentVisible: r.student_visible === true || r.student_visible === "true",
    createdAt: r.created_at,
  };
}

const MATERIAL_COLS =
  "id, course_id, title, kind, file_key, file_name, content_type, size_bytes, student_visible, created_at";

async function presignPut(key, contentType) {
  const cmd = new PutObjectCommand({ Bucket: MATERIALS_BUCKET, Key: key, ContentType: contentType });
  return getSignedUrl(s3, cmd, { expiresIn: 300 });
}
async function presignGet(key, fileName) {
  const cmd = new GetObjectCommand({
    Bucket: MATERIALS_BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${String(fileName || "download").replace(/["\\]/g, "")}"`,
  });
  return getSignedUrl(s3, cmd, { expiresIn: 300 });
}

// Verify a facilitator token (distinct from admin/user/student tokens).
async function facilitatorAuth(headers) {
  const p = await authenticate(headers);
  if (!p || p.role !== "facilitator") return null;
  return p;
}

// ---- Admin: facilitators ----
async function adminListFacilitators(headers) {
  if (!(await adminAuth(headers))) return json(401, { error: "Not authorized." });
  const rows = await sql(
    `SELECT f.id, f.name, f.email, f.title, f.bio, f.active, f.created_at,
            COALESCE(json_agg(cf.course_id) FILTER (WHERE cf.course_id IS NOT NULL), '[]') AS course_ids
       FROM academy_facilitators f
       LEFT JOIN academy_course_facilitators cf ON cf.facilitator_id = f.id
      GROUP BY f.id
      ORDER BY f.created_at DESC`
  );
  const facilitators = rows.map((r) => ({
    id: r.id, name: r.name, email: r.email, title: r.title || "", bio: r.bio || "",
    active: r.active === true || r.active === "true",
    courseIds: parseJsonField(r.course_ids, []),
    createdAt: r.created_at,
  }));
  return json(200, { facilitators });
}

async function adminCreateFacilitator(headers, body) {
  if (!(await adminAuth(headers))) return json(401, { error: "Not authorized." });
  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const title = (body.title || "").trim() || null;
  const bio = (body.bio || "").trim() || null;
  if (!name) return json(400, { error: "Name is required." });
  if (!EMAIL_RE.test(email)) return json(400, { error: "A valid email is required." });
  if (password.length < 8) return json(400, { error: "Password must be at least 8 characters." });
  const existing = await sql("SELECT id FROM academy_facilitators WHERE email = :email", { email });
  if (existing.length) return json(409, { error: "A facilitator with that email already exists." });
  const hash = await bcrypt.hash(password, 10);
  const rows = await sql(
    `INSERT INTO academy_facilitators (name, email, password_hash, title, bio)
     VALUES (:name, :email, :hash, :title, :bio)
     RETURNING id, name, email, title, bio, active, created_at`,
    { name, email, hash, title, bio }
  );
  const r = rows[0];
  return json(201, { facilitator: { id: r.id, name: r.name, email: r.email, title: r.title || "", bio: r.bio || "", active: true, courseIds: [], createdAt: r.created_at } });
}

async function adminDeleteFacilitator(headers, body) {
  if (!(await adminAuth(headers))) return json(401, { error: "Not authorized." });
  if (!body.id) return json(400, { error: "Missing id." });
  await sql("DELETE FROM academy_facilitators WHERE id = :id::uuid", { id: body.id });
  return json(200, { ok: true });
}

async function adminAssignFacilitator(headers, body) {
  if (!(await adminAuth(headers))) return json(401, { error: "Not authorized." });
  const { facilitatorId, courseId } = body;
  if (!facilitatorId || !courseId) return json(400, { error: "Missing ids." });
  if (body.assigned === false) {
    await sql("DELETE FROM academy_course_facilitators WHERE facilitator_id = :f::uuid AND course_id = :c::uuid", { f: facilitatorId, c: courseId });
  } else {
    await sql("INSERT INTO academy_course_facilitators (course_id, facilitator_id) VALUES (:c::uuid, :f::uuid) ON CONFLICT DO NOTHING", { c: courseId, f: facilitatorId });
  }
  return json(200, { ok: true });
}

async function adminSetFacilitatorPassword(headers, body) {
  if (!(await adminAuth(headers))) return json(401, { error: "Not authorized." });
  if (!body.id || (body.password || "").length < 8) return json(400, { error: "Password must be at least 8 characters." });
  const hash = await bcrypt.hash(body.password, 10);
  await sql("UPDATE academy_facilitators SET password_hash = :h WHERE id = :id::uuid", { h: hash, id: body.id });
  return json(200, { ok: true });
}

// ---- Admin: materials ----
async function adminMaterialUploadUrl(headers, body) {
  if (!(await adminAuth(headers))) return json(401, { error: "Not authorized." });
  const courseId = body.courseId;
  if (!courseId) return json(400, { error: "Missing course." });
  const safe = String(body.fileName || "file").replace(/[^\w.\-]+/g, "_").slice(0, 120);
  const key = `materials/${courseId}/${Date.now()}-${safe}`;
  const uploadUrl = await presignPut(key, body.contentType || "application/octet-stream");
  return json(200, { uploadUrl, fileKey: key });
}

async function adminCreateMaterial(headers, body) {
  if (!(await adminAuth(headers))) return json(401, { error: "Not authorized." });
  const courseId = body.courseId;
  const title = (body.title || "").trim();
  const fileKey = body.fileKey;
  if (!courseId || !fileKey || !title) return json(400, { error: "Missing course, title, or file." });
  const kind = ["manual", "slides", "resource"].includes(body.kind) ? body.kind : "manual";
  const rows = await sql(
    `INSERT INTO academy_materials (course_id, title, kind, file_key, file_name, content_type, size_bytes, student_visible)
     VALUES (:courseId::uuid, :title, :kind, :fileKey, :fileName, :contentType, :size::bigint, :vis::boolean)
     RETURNING ${MATERIAL_COLS}`,
    { courseId, title, kind, fileKey, fileName: body.fileName || null, contentType: body.contentType || null, size: Number(body.sizeBytes) || 0, vis: body.studentVisible === false ? false : true }
  );
  return json(201, { material: materialOut(rows[0]) });
}

async function adminListMaterials(headers, courseId) {
  if (!(await adminAuth(headers))) return json(401, { error: "Not authorized." });
  if (!courseId) return json(400, { error: "Missing course." });
  const rows = await sql(`SELECT ${MATERIAL_COLS} FROM academy_materials WHERE course_id = :c::uuid ORDER BY created_at`, { c: courseId });
  return json(200, { materials: rows.map(materialOut) });
}

async function adminDeleteMaterial(headers, body) {
  if (!(await adminAuth(headers))) return json(401, { error: "Not authorized." });
  if (!body.id) return json(400, { error: "Missing id." });
  const rows = await sql("SELECT file_key FROM academy_materials WHERE id = :id::uuid", { id: body.id });
  if (rows.length) {
    try { await s3.send(new DeleteObjectCommand({ Bucket: MATERIALS_BUCKET, Key: rows[0].file_key })); } catch (_) { /* ignore */ }
  }
  await sql("DELETE FROM academy_materials WHERE id = :id::uuid", { id: body.id });
  return json(200, { ok: true });
}

async function adminMaterialDownloadUrl(headers, id) {
  if (!(await adminAuth(headers))) return json(401, { error: "Not authorized." });
  if (!id) return json(400, { error: "Missing id." });
  const rows = await sql("SELECT file_key, file_name FROM academy_materials WHERE id = :id::uuid", { id });
  if (!rows.length) return json(404, { error: "Not found." });
  return json(200, { url: await presignGet(rows[0].file_key, rows[0].file_name) });
}

// ---- Facilitator portal ----
async function facilitatorLogin(body) {
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const rows = await sql("SELECT id, name, email, password_hash, active FROM academy_facilitators WHERE email = :email", { email });
  if (!rows.length) return json(401, { error: "Invalid email or password." });
  if (!(rows[0].active === true || rows[0].active === "true")) return json(403, { error: "This account is inactive." });
  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) return json(401, { error: "Invalid email or password." });
  const secret = await getJwtSecret();
  const token = jwt.sign({ role: "facilitator", sub: rows[0].id, email: rows[0].email }, secret, { expiresIn: ADMIN_TOKEN_TTL });
  return json(200, { token, facilitator: { id: rows[0].id, name: rows[0].name, email: rows[0].email } });
}

async function facilitatorMe(headers) {
  const p = await facilitatorAuth(headers);
  if (!p) return json(401, { error: "Not authorized." });
  const prof = await sql("SELECT id, name, email, title, bio FROM academy_facilitators WHERE id = :id::uuid", { id: p.sub });
  if (!prof.length) return json(401, { error: "Account not found." });
  const courses = await sql(
    `SELECT c.id, c.slug, c.title, c.image, c.track, c.status, c.intro_video_url
       FROM academy_courses c
       JOIN academy_course_facilitators cf ON cf.course_id = c.id
      WHERE cf.facilitator_id = :id::uuid
      ORDER BY c.sort_order, c.title`,
    { id: p.sub }
  );
  const courseList = [];
  for (const c of courses) {
    const mats = await sql(`SELECT ${MATERIAL_COLS} FROM academy_materials WHERE course_id = :c::uuid ORDER BY created_at`, { c: c.id });
    courseList.push({
      id: c.id, slug: c.slug, title: c.title, image: c.image || "", track: c.track, status: c.status,
      introVideoUrl: c.intro_video_url || "", materials: mats.map(materialOut),
    });
  }
  const f = prof[0];
  return json(200, { facilitator: { id: f.id, name: f.name, email: f.email, title: f.title || "", bio: f.bio || "" }, courses: courseList });
}

async function facilitatorMaterialDownloadUrl(headers, id) {
  const p = await facilitatorAuth(headers);
  if (!p) return json(401, { error: "Not authorized." });
  if (!id) return json(400, { error: "Missing id." });
  const rows = await sql(
    `SELECT m.file_key, m.file_name
       FROM academy_materials m
       JOIN academy_course_facilitators cf ON cf.course_id = m.course_id
      WHERE m.id = :id::uuid AND cf.facilitator_id = :f::uuid`,
    { id, f: p.sub }
  );
  if (!rows.length) return json(404, { error: "Not found." });
  return json(200, { url: await presignGet(rows[0].file_key, rows[0].file_name) });
}

async function facilitatorChangePassword(headers, body) {
  const p = await facilitatorAuth(headers);
  if (!p) return json(401, { error: "Not authorized." });
  const rows = await sql("SELECT password_hash FROM academy_facilitators WHERE id = :id::uuid", { id: p.sub });
  if (!rows.length) return json(404, { error: "Not found." });
  const ok = await bcrypt.compare(body.current || "", rows[0].password_hash);
  if (!ok) return json(401, { error: "Current password is incorrect." });
  if ((body.next || "").length < 8) return json(400, { error: "New password must be at least 8 characters." });
  const hash = await bcrypt.hash(body.next, 10);
  await sql("UPDATE academy_facilitators SET password_hash = :h WHERE id = :id::uuid", { h: hash, id: p.sub });
  return json(200, { ok: true });
}

// ── Academy LMS: students, enrolments, sessions, certificates ──────────────

// A student token is an ordinary user JWT ({ sub, email }, no role).
async function studentAuth(headers) {
  const p = await authenticate(headers);
  if (!p || p.role || !p.sub) return null;
  return p;
}

function sessionOut(r) {
  return { id: r.id, courseId: r.course_id, title: r.title || "", startsAt: r.starts_at, endsAt: r.ends_at, location: r.location || "" };
}

// The trackable items of a course: intro video, curriculum weeks, self-paced videos.
function courseItems(course) {
  const items = [];
  if (course.introVideoUrl) items.push({ key: "intro", label: "Intro video", type: "video" });
  (course.curriculum || []).forEach((w, i) => items.push({ key: `week-${w.week || i + 1}`, label: `Week ${w.week || i + 1}: ${w.title || ""}`.trim(), type: "lesson" }));
  (course.selfPacedVideos || []).forEach((v, i) => items.push({ key: `spv-${i + 1}`, label: v.title || `Video ${i + 1}`, type: "video", url: v.url }));
  return items;
}
function totalItems(row) {
  let n = 0;
  if (row.intro_video_url) n += 1;
  n += parseJsonField(row.curriculum, []).length;
  n += parseJsonField(row.self_paced_videos, []).length;
  return Math.max(n, 1);
}

const ENROLL_COURSE_COLS = COURSE_COLS.split(", ").map((c) => "c." + c).join(", ");

// ---- Student portal ----
async function studentCourses(headers) {
  const p = await studentAuth(headers);
  if (!p) return json(401, { error: "Please sign in." });
  const rows = await sql(
    `SELECT e.id AS enrollment_id, e.status AS e_status, e.progress AS e_progress, e.completed_at AS e_completed_at, ${ENROLL_COURSE_COLS}
       FROM academy_enrollments e JOIN academy_courses c ON c.id = e.course_id
      WHERE e.user_id = :uid::uuid ORDER BY e.created_at DESC`,
    { uid: p.sub }
  );
  const courses = rows.map((r) => ({
    enrollmentId: r.enrollment_id, status: r.e_status, progress: Number(r.e_progress) || 0, completedAt: r.e_completed_at, course: courseOut(r),
  }));
  return json(200, { courses });
}

async function studentEnroll(headers, body) {
  const p = await studentAuth(headers);
  if (!p) return json(401, { error: "Please sign in." });
  if (!body.courseId) return json(400, { error: "Missing course." });
  const c = await sql("SELECT id FROM academy_courses WHERE id = :id::uuid AND published = true", { id: body.courseId });
  if (!c.length) return json(404, { error: "Course not found." });
  await sql("INSERT INTO academy_enrollments (course_id, user_id) VALUES (:c::uuid, :u::uuid) ON CONFLICT (course_id, user_id) DO NOTHING", { c: body.courseId, u: p.sub });
  return json(201, { ok: true });
}

async function studentUnenroll(headers, body) {
  const p = await studentAuth(headers);
  if (!p) return json(401, { error: "Please sign in." });
  if (!body.courseId) return json(400, { error: "Missing course." });
  await sql("DELETE FROM academy_enrollments WHERE course_id = :c::uuid AND user_id = :u::uuid", { c: body.courseId, u: p.sub });
  return json(200, { ok: true });
}

async function studentCourseDetail(headers, courseId) {
  const p = await studentAuth(headers);
  if (!p) return json(401, { error: "Please sign in." });
  if (!courseId) return json(400, { error: "Missing course." });
  const er = await sql("SELECT id, status, progress, completed_at FROM academy_enrollments WHERE course_id = :c::uuid AND user_id = :u::uuid", { c: courseId, u: p.sub });
  if (!er.length) return json(403, { error: "You're not enrolled in this course." });
  const enrollmentId = er[0].id;
  const cr = await sql(`SELECT ${COURSE_COLS} FROM academy_courses WHERE id = :c::uuid`, { c: courseId });
  if (!cr.length) return json(404, { error: "Course not found." });
  const course = courseOut(cr[0]);
  const mats = await sql(`SELECT ${MATERIAL_COLS} FROM academy_materials WHERE course_id = :c::uuid AND student_visible = true ORDER BY created_at`, { c: courseId });
  const sessions = await sql("SELECT id, course_id, title, starts_at, ends_at, location FROM academy_sessions WHERE course_id = :c::uuid ORDER BY starts_at", { c: courseId });
  const prog = await sql("SELECT item_key FROM academy_progress WHERE enrollment_id = :e::uuid", { e: enrollmentId });
  const cert = await sql("SELECT id, serial, issued_at, file_key FROM academy_certificates WHERE course_id = :c::uuid AND user_id = :u::uuid ORDER BY issued_at DESC LIMIT 1", { c: courseId, u: p.sub });
  return json(200, {
    enrollment: { id: enrollmentId, status: er[0].status, progress: Number(er[0].progress) || 0, completedAt: er[0].completed_at },
    course,
    items: courseItems(course),
    completed: prog.map((x) => x.item_key),
    materials: mats.map(materialOut),
    sessions: sessions.map(sessionOut),
    certificate: cert.length ? { id: cert[0].id, serial: cert[0].serial, issuedAt: cert[0].issued_at, hasFile: !!cert[0].file_key } : null,
  });
}

async function studentProgress(headers, body) {
  const p = await studentAuth(headers);
  if (!p) return json(401, { error: "Please sign in." });
  const { courseId, itemKey } = body;
  if (!courseId || !itemKey) return json(400, { error: "Missing fields." });
  const er = await sql("SELECT id FROM academy_enrollments WHERE course_id = :c::uuid AND user_id = :u::uuid", { c: courseId, u: p.sub });
  if (!er.length) return json(403, { error: "Not enrolled." });
  const eid = er[0].id;
  if (body.completed === false) {
    await sql("DELETE FROM academy_progress WHERE enrollment_id = :e::uuid AND item_key = :k", { e: eid, k: itemKey });
  } else {
    await sql("INSERT INTO academy_progress (enrollment_id, item_key) VALUES (:e::uuid, :k) ON CONFLICT DO NOTHING", { e: eid, k: itemKey });
  }
  const cr = await sql("SELECT curriculum, self_paced_videos, intro_video_url FROM academy_courses WHERE id = :c::uuid", { c: courseId });
  const total = cr.length ? totalItems(cr[0]) : 1;
  const done = (await sql("SELECT COUNT(*) AS n FROM academy_progress WHERE enrollment_id = :e::uuid", { e: eid }))[0].n;
  const pct = Math.min(100, Math.round((Number(done) / total) * 100));
  const status = pct >= 100 ? "completed" : "active";
  await sql("UPDATE academy_enrollments SET progress = :p::int, status = :st WHERE id = :e::uuid", { p: pct, st: status, e: eid });
  return json(200, { progress: pct, status });
}

async function studentMaterialDownloadUrl(headers, id) {
  const p = await studentAuth(headers);
  if (!p) return json(401, { error: "Please sign in." });
  if (!id) return json(400, { error: "Missing id." });
  const rows = await sql(
    `SELECT m.file_key, m.file_name FROM academy_materials m
       JOIN academy_enrollments e ON e.course_id = m.course_id AND e.user_id = :u::uuid
      WHERE m.id = :id::uuid AND m.student_visible = true`,
    { id, u: p.sub }
  );
  if (!rows.length) return json(404, { error: "Not available." });
  return json(200, { url: await presignGet(rows[0].file_key, rows[0].file_name) });
}

async function studentCertificateDownloadUrl(headers, id) {
  const p = await studentAuth(headers);
  if (!p) return json(401, { error: "Please sign in." });
  if (!id) return json(400, { error: "Missing id." });
  const rows = await sql("SELECT file_key, serial FROM academy_certificates WHERE id = :id::uuid AND user_id = :u::uuid", { id, u: p.sub });
  if (!rows.length || !rows[0].file_key) return json(404, { error: "Not found." });
  return json(200, { url: await presignGet(rows[0].file_key, `Loopital-Academy-Certificate-${rows[0].serial}.pdf`) });
}

// ---- Sessions (calendar) — admin managed ----
async function adminListSessions(headers, courseId) {
  if (!(await adminAuth(headers))) return json(401, { error: "Not authorized." });
  if (!courseId) return json(400, { error: "Missing course." });
  const rows = await sql("SELECT id, course_id, title, starts_at, ends_at, location FROM academy_sessions WHERE course_id = :c::uuid ORDER BY starts_at", { c: courseId });
  return json(200, { sessions: rows.map(sessionOut) });
}
async function adminCreateSession(headers, body) {
  if (!(await adminAuth(headers))) return json(401, { error: "Not authorized." });
  if (!body.courseId || !body.startsAt) return json(400, { error: "Course and start time are required." });
  const rows = await sql(
    `INSERT INTO academy_sessions (course_id, title, starts_at, ends_at, location)
     VALUES (:c::uuid, :title, :starts::timestamptz, :ends::timestamptz, :loc)
     RETURNING id, course_id, title, starts_at, ends_at, location`,
    { c: body.courseId, title: (body.title || "").trim() || null, starts: body.startsAt, ends: body.endsAt || null, loc: (body.location || "").trim() || null }
  );
  return json(201, { session: sessionOut(rows[0]) });
}
async function adminDeleteSession(headers, body) {
  if (!(await adminAuth(headers))) return json(401, { error: "Not authorized." });
  if (!body.id) return json(400, { error: "Missing id." });
  await sql("DELETE FROM academy_sessions WHERE id = :id::uuid", { id: body.id });
  return json(200, { ok: true });
}

// ---- Enrolments — admin managed ----
async function adminListEnrollments(headers, courseId) {
  if (!(await adminAuth(headers))) return json(401, { error: "Not authorized." });
  if (!courseId) return json(400, { error: "Missing course." });
  const rows = await sql(
    `SELECT e.id, e.status, e.progress, e.completed_at, e.created_at, u.id AS user_id, u.name, u.email, cert.serial AS cert_serial
       FROM academy_enrollments e JOIN users u ON u.id = e.user_id
       LEFT JOIN academy_certificates cert ON cert.course_id = e.course_id AND cert.user_id = e.user_id
      WHERE e.course_id = :c::uuid ORDER BY e.created_at DESC`,
    { c: courseId }
  );
  const enrollments = rows.map((r) => ({ id: r.id, userId: r.user_id, name: r.name, email: r.email, status: r.status, progress: Number(r.progress) || 0, completedAt: r.completed_at, certSerial: r.cert_serial }));
  return json(200, { enrollments });
}
async function adminRemoveEnrollment(headers, body) {
  if (!(await adminAuth(headers))) return json(401, { error: "Not authorized." });
  if (!body.id) return json(400, { error: "Missing id." });
  await sql("DELETE FROM academy_enrollments WHERE id = :id::uuid", { id: body.id });
  return json(200, { ok: true });
}

// ---- Certificates: PDF + email ----
async function buildCertificatePdf({ name, course, serial, date }) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const helvB = await doc.embedFont(StandardFonts.HelveticaBold);
  const blue = rgb(0.145, 0.388, 0.922), green = rgb(0.063, 0.725, 0.506), ink = rgb(0.11, 0.11, 0.12), gray = rgb(0.43, 0.43, 0.45);
  page.drawRectangle({ x: 22, y: 22, width: width - 44, height: height - 44, borderColor: blue, borderWidth: 2.5 });
  page.drawRectangle({ x: 30, y: 30, width: width - 60, height: height - 60, borderColor: green, borderWidth: 0.8 });
  const center = (text, font, size, y, color) => {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - w) / 2, y, size, font, color });
  };
  center("LOOPITAL ACADEMY", helvB, 15, height - 92, blue);
  center("Certificate of Completion", helvB, 33, height - 150, ink);
  page.drawRectangle({ x: width / 2 - 40, y: height - 168, width: 80, height: 3, color: green });
  center("This certificate is proudly presented to", helv, 13, height - 205, gray);
  center(name, helvB, 30, height - 250, ink);
  center("for successfully completing the course", helv, 13, height - 290, gray);
  center(course, helvB, 20, height - 322, blue);
  const dstr = date.toISOString().slice(0, 10);
  page.drawText(`Issued: ${dstr}`, { x: 78, y: 92, size: 11, font: helv, color: gray });
  page.drawText(`Certificate ID: ${serial}`, { x: 78, y: 74, size: 10, font: helv, color: gray });
  center("Tuamene Bestgod", helvB, 15, 108, ink);
  center("Founder & CEO, Loopital", helv, 10, 90, gray);
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

async function emailCertificate(to, name, course, pdfBytes, serial) {
  if (!SES_FROM) throw new Error("SES_FROM not configured.");
  const boundary = "LOOPITAL_" + Date.now().toString(36);
  const subject = `Your Loopital Academy certificate — ${course}`;
  const body = `Congratulations, ${name}!\r\n\r\nYou have successfully completed "${course}" at Loopital Academy. Your Certificate of Completion (ID ${serial}) is attached to this email as a PDF.\r\n\r\nWe are proud of what you've accomplished — keep learning and keep building.\r\n\r\nWarm regards,\r\nThe Loopital Academy Team`;
  const b64 = pdfBytes.toString("base64").replace(/(.{76})/g, "$1\r\n");
  const raw =
    `From: ${SES_FROM}\r\n` +
    `To: ${to}\r\n` +
    `Subject: ${subject}\r\n` +
    `MIME-Version: 1.0\r\n` +
    `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n` +
    `--${boundary}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${body}\r\n\r\n` +
    `--${boundary}\r\nContent-Type: application/pdf; name="Loopital-Academy-Certificate.pdf"\r\n` +
    `Content-Transfer-Encoding: base64\r\n` +
    `Content-Disposition: attachment; filename="Loopital-Academy-Certificate-${serial}.pdf"\r\n\r\n${b64}\r\n\r\n--${boundary}--`;
  await ses.send(new SendEmailCommand({ Content: { Raw: { Data: Buffer.from(raw) } } }));
}

async function generateCertificateForEnrollment(enrollmentId) {
  const er = await sql(
    `SELECT e.id, e.course_id, e.user_id, u.name, u.email, c.title AS course_title
       FROM academy_enrollments e JOIN users u ON u.id = e.user_id JOIN academy_courses c ON c.id = e.course_id
      WHERE e.id = :id::uuid`,
    { id: enrollmentId }
  );
  if (!er.length) return json(404, { error: "Enrolment not found." });
  const row = er[0];
  const existing = await sql("SELECT id, serial, file_key FROM academy_certificates WHERE course_id = :c::uuid AND user_id = :u::uuid", { c: row.course_id, u: row.user_id });
  let serial, fileKey, pdfBuffer = null;
  if (existing.length && existing[0].file_key) {
    serial = existing[0].serial; fileKey = existing[0].file_key;
  } else {
    serial = "LA-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(1000 + Math.random() * 9000);
    pdfBuffer = await buildCertificatePdf({ name: row.name, course: row.course_title, serial, date: new Date() });
    fileKey = `certificates/${serial}.pdf`;
    await s3.send(new PutObjectCommand({ Bucket: MATERIALS_BUCKET, Key: fileKey, Body: pdfBuffer, ContentType: "application/pdf" }));
    if (existing.length) {
      await sql("UPDATE academy_certificates SET serial = :s, file_key = :fk, issued_at = now() WHERE id = :id::uuid", { s: serial, fk: fileKey, id: existing[0].id });
    } else {
      await sql(
        `INSERT INTO academy_certificates (course_id, user_id, student_name, student_email, course_title, serial, file_key)
         VALUES (:cid::uuid, :uid::uuid, :name, :email, :ctitle, :serial, :fk)`,
        { cid: row.course_id, uid: row.user_id, name: row.name, email: row.email, ctitle: row.course_title, serial, fk: fileKey }
      );
    }
  }
  await sql("UPDATE academy_enrollments SET status = 'completed', progress = 100, completed_at = now() WHERE id = :id::uuid", { id: enrollmentId });
  let emailed = false, emailError = null;
  try {
    if (!pdfBuffer) {
      const g = await s3.send(new GetObjectCommand({ Bucket: MATERIALS_BUCKET, Key: fileKey }));
      const chunks = []; for await (const ch of g.Body) chunks.push(ch); pdfBuffer = Buffer.concat(chunks);
    }
    await emailCertificate(row.email, row.name, row.course_title, pdfBuffer, serial);
    emailed = true;
  } catch (e) {
    emailError = String((e && e.message) || e);
  }
  return json(200, { ok: true, serial, emailed, emailError });
}

async function adminGenerateCertificate(headers, body) {
  if (!(await adminAuth(headers))) return json(401, { error: "Not authorized." });
  if (!body.enrollmentId) return json(400, { error: "Missing enrolment." });
  return generateCertificateForEnrollment(body.enrollmentId);
}

// ---- Facilitator: roster + certificate ----
async function facilitatorRoster(headers, courseId) {
  const p = await facilitatorAuth(headers);
  if (!p) return json(401, { error: "Not authorized." });
  if (!courseId) return json(400, { error: "Missing course." });
  const a = await sql("SELECT 1 AS ok FROM academy_course_facilitators WHERE course_id = :c::uuid AND facilitator_id = :f::uuid", { c: courseId, f: p.sub });
  if (!a.length) return json(403, { error: "Not your course." });
  const rows = await sql(
    `SELECT e.id, e.status, e.progress, e.completed_at, u.id AS user_id, u.name, u.email, cert.serial AS cert_serial
       FROM academy_enrollments e JOIN users u ON u.id = e.user_id
       LEFT JOIN academy_certificates cert ON cert.course_id = e.course_id AND cert.user_id = e.user_id
      WHERE e.course_id = :c::uuid ORDER BY e.created_at DESC`,
    { c: courseId }
  );
  const students = rows.map((r) => ({ enrollmentId: r.id, userId: r.user_id, name: r.name, email: r.email, status: r.status, progress: Number(r.progress) || 0, completedAt: r.completed_at, certSerial: r.cert_serial }));
  return json(200, { students });
}
async function facilitatorGenerateCertificate(headers, body) {
  const p = await facilitatorAuth(headers);
  if (!p) return json(401, { error: "Not authorized." });
  if (!body.enrollmentId) return json(400, { error: "Missing enrolment." });
  const chk = await sql(
    `SELECT 1 AS ok FROM academy_enrollments e JOIN academy_course_facilitators cf ON cf.course_id = e.course_id
      WHERE e.id = :id::uuid AND cf.facilitator_id = :f::uuid`,
    { id: body.enrollmentId, f: p.sub }
  );
  if (!chk.length) return json(403, { error: "Not your student." });
  return generateCertificateForEnrollment(body.enrollmentId);
}

// ── Academy: reviews, exams, usernames, achievements, verification ─────────

async function enrolledId(userId, courseId) {
  const e = await sql("SELECT id FROM academy_enrollments WHERE course_id = :c::uuid AND user_id = :u::uuid", { c: courseId, u: userId });
  return e.length ? e[0].id : null;
}
async function facilitatorAssigned(fid, courseId) {
  const a = await sql("SELECT 1 AS ok FROM academy_course_facilitators WHERE course_id = :c::uuid AND facilitator_id = :f::uuid", { c: courseId, f: fid });
  return a.length > 0;
}
function setEq(a, b) {
  const A = Array.isArray(a) ? a : [], B = Array.isArray(b) ? b : [];
  if (A.length !== B.length) return false;
  const s = new Set(A.map(String));
  return B.every((x) => s.has(String(x)));
}

// ---- Reviews ----
async function listReviews(courseId) {
  if (!courseId) return json(400, { error: "Missing course." });
  const rows = await sql(
    `SELECT r.rating, r.comment, r.created_at, u.name
       FROM academy_reviews r JOIN users u ON u.id = r.user_id
      WHERE r.course_id = :c::uuid AND r.hidden = false
      ORDER BY r.created_at DESC LIMIT 100`,
    { c: courseId }
  );
  const reviews = rows.map((r) => ({ name: r.name, rating: Number(r.rating), comment: r.comment || "", createdAt: r.created_at }));
  const count = reviews.length;
  const average = count ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
  return json(200, { reviews, count, average });
}
async function studentReview(headers, body) {
  const p = await studentAuth(headers);
  if (!p) return json(401, { error: "Please sign in." });
  const rating = Math.round(Number(body.rating));
  if (!body.courseId || !(rating >= 1 && rating <= 5)) return json(400, { error: "Pick a rating from 1 to 5." });
  if (!(await enrolledId(p.sub, body.courseId))) return json(403, { error: "Only enrolled students can review this course." });
  await sql(
    `INSERT INTO academy_reviews (course_id, user_id, rating, comment)
     VALUES (:c::uuid, :u::uuid, :rating::int, :comment)
     ON CONFLICT (course_id, user_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, hidden = false, created_at = now()`,
    { c: body.courseId, u: p.sub, rating, comment: (body.comment || "").trim() || null }
  );
  return json(201, { ok: true });
}
async function adminListReviews(headers, courseId) {
  if (!(await adminAuth(headers))) return json(401, { error: "Not authorized." });
  if (!courseId) return json(400, { error: "Missing course." });
  const rows = await sql(
    `SELECT r.id, r.rating, r.comment, r.hidden, r.created_at, u.name, u.email
       FROM academy_reviews r JOIN users u ON u.id = r.user_id
      WHERE r.course_id = :c::uuid ORDER BY r.created_at DESC`,
    { c: courseId }
  );
  return json(200, { reviews: rows.map((r) => ({ id: r.id, name: r.name, email: r.email, rating: Number(r.rating), comment: r.comment || "", hidden: r.hidden === true || r.hidden === "true", createdAt: r.created_at })) });
}
async function adminHideReview(headers, body) {
  if (!(await adminAuth(headers))) return json(401, { error: "Not authorized." });
  if (!body.id) return json(400, { error: "Missing id." });
  await sql("UPDATE academy_reviews SET hidden = :h::boolean WHERE id = :id::uuid", { h: body.hidden === false ? false : true, id: body.id });
  return json(200, { ok: true });
}

// ---- Exams ----
function questionOut(row, includeCorrect) {
  return {
    id: row.id,
    prompt: row.prompt,
    kind: row.kind,
    options: parseJsonField(row.options, []),
    points: Number(row.points) || 1,
    sortOrder: Number(row.sort_order) || 0,
    ...(includeCorrect ? { correct: parseJsonField(row.correct, []) } : {}),
  };
}
async function loadExam(courseId) {
  const ex = await sql("SELECT id, course_id, title, pass_mark, published FROM academy_exams WHERE course_id = :c::uuid", { c: courseId });
  if (!ex.length) return null;
  const qs = await sql("SELECT id, prompt, kind, options, correct, points, sort_order FROM academy_exam_questions WHERE exam_id = :e::uuid ORDER BY sort_order", { e: ex[0].id });
  return { exam: ex[0], questions: qs };
}
async function attemptStatus(examId, userId, passMark) {
  const attempts = await sql("SELECT score, passed, attempt_no FROM academy_exam_attempts WHERE exam_id = :e::uuid AND user_id = :u::uuid ORDER BY attempt_no", { e: examId, u: userId });
  const ov = await sql("SELECT extra FROM academy_exam_overrides WHERE exam_id = :e::uuid AND user_id = :u::uuid", { e: examId, u: userId });
  const extra = ov.length ? Number(ov[0].extra) || 0 : 0;
  const used = attempts.length;
  const passed = attempts.some((a) => a.passed === true || a.passed === "true");
  const best = attempts.reduce((m, a) => Math.max(m, Number(a.score) || 0), 0);
  const maxAttempts = 3 + extra;
  return { attemptsUsed: used, maxAttempts, passed, bestScore: best, canTake: !passed && used < maxAttempts, passMark };
}

// Student: fetch exam (no answers) + their status
async function studentExam(headers, courseId) {
  const p = await studentAuth(headers);
  if (!p) return json(401, { error: "Please sign in." });
  if (!courseId) return json(400, { error: "Missing course." });
  if (!(await enrolledId(p.sub, courseId))) return json(403, { error: "You're not enrolled in this course." });
  const data = await loadExam(courseId);
  if (!data || !(data.exam.published === true || data.exam.published === "true")) return json(200, { exam: null });
  const status = await attemptStatus(data.exam.id, p.sub, Number(data.exam.pass_mark));
  return json(200, {
    exam: { id: data.exam.id, title: data.exam.title, passMark: Number(data.exam.pass_mark), questions: data.questions.map((q) => questionOut(q, false)) },
    status,
  });
}
// Student: submit + auto-grade
async function studentSubmitExam(headers, body) {
  const p = await studentAuth(headers);
  if (!p) return json(401, { error: "Please sign in." });
  const courseId = body.courseId;
  if (!courseId) return json(400, { error: "Missing course." });
  if (!(await enrolledId(p.sub, courseId))) return json(403, { error: "You're not enrolled." });
  const data = await loadExam(courseId);
  if (!data || !(data.exam.published === true || data.exam.published === "true")) return json(404, { error: "No exam available." });
  const status = await attemptStatus(data.exam.id, p.sub, Number(data.exam.pass_mark));
  if (status.passed) return json(409, { error: "You've already passed this exam." });
  if (!status.canTake) return json(403, { error: "You've used all your attempts. Please contact support or your instructor." });

  const answers = body.answers || {};
  let earned = 0, total = 0;
  for (const q of data.questions) {
    const pts = Number(q.points) || 1;
    total += pts;
    if (setEq(answers[q.id], parseJsonField(q.correct, []))) earned += pts;
  }
  const score = total ? Math.round((earned / total) * 100) : 0;
  const passMark = Number(data.exam.pass_mark);
  const passed = score >= passMark;
  const attemptNo = status.attemptsUsed + 1;
  await sql(
    "INSERT INTO academy_exam_attempts (exam_id, user_id, score, passed, attempt_no) VALUES (:e::uuid, :u::uuid, :s::int, :passed::boolean, :n::int)",
    { e: data.exam.id, u: p.sub, s: score, passed, n: attemptNo }
  );
  const attemptsLeft = status.maxAttempts - attemptNo;
  return json(200, { score, passed, passMark, attemptNo, attemptsLeft: passed ? 0 : Math.max(0, attemptsLeft), canRetake: !passed && attemptsLeft > 0 });
}

// Instructor/admin: get full exam (with answers) for editing
async function getExamForEdit(courseId) {
  const data = await loadExam(courseId);
  if (!data) return json(200, { exam: null });
  return json(200, { exam: { id: data.exam.id, courseId: data.exam.course_id, title: data.exam.title, passMark: Number(data.exam.pass_mark), published: data.exam.published === true || data.exam.published === "true", questions: data.questions.map((q) => questionOut(q, true)) } });
}
// Instructor/admin: upsert exam + replace questions
async function saveExam(courseId, body) {
  const title = (body.title || "Course assessment").trim();
  const passMark = Math.min(100, Math.max(1, Math.round(Number(body.passMark) || 70)));
  const published = body.published === true;
  const rows = await sql(
    `INSERT INTO academy_exams (course_id, title, pass_mark, published)
     VALUES (:c::uuid, :title, :pm::int, :pub::boolean)
     ON CONFLICT (course_id) DO UPDATE SET title = EXCLUDED.title, pass_mark = EXCLUDED.pass_mark, published = EXCLUDED.published, updated_at = now()
     RETURNING id`,
    { c: courseId, title, pm: passMark, pub: published }
  );
  const examId = rows[0].id;
  await sql("DELETE FROM academy_exam_questions WHERE exam_id = :e::uuid", { e: examId });
  const questions = Array.isArray(body.questions) ? body.questions : [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const kind = ["single", "multi", "truefalse"].includes(q.kind) ? q.kind : "single";
    await sql(
      `INSERT INTO academy_exam_questions (exam_id, prompt, kind, options, correct, points, sort_order)
       VALUES (:e::uuid, :prompt, :kind, :options, :correct, :points::int, :sort::int)`,
      {
        e: examId,
        prompt: (q.prompt || "").trim() || "Question",
        kind,
        options: JSON.stringify(Array.isArray(q.options) ? q.options : []),
        correct: JSON.stringify(Array.isArray(q.correct) ? q.correct : []),
        points: Math.max(1, Math.round(Number(q.points) || 1)),
        sort: i,
      }
    );
  }
  return json(200, { ok: true, examId });
}
async function grantRetake(courseId, userId) {
  const ex = await sql("SELECT id FROM academy_exams WHERE course_id = :c::uuid", { c: courseId });
  if (!ex.length) return json(404, { error: "No exam for this course." });
  await sql(
    `INSERT INTO academy_exam_overrides (exam_id, user_id, extra) VALUES (:e::uuid, :u::uuid, 3)
     ON CONFLICT (exam_id, user_id) DO UPDATE SET extra = academy_exam_overrides.extra + 3`,
    { e: ex[0].id, u: userId }
  );
  return json(200, { ok: true });
}

// Admin wrappers
async function adminGetExam(headers, courseId) {
  if (!(await adminAuth(headers))) return json(401, { error: "Not authorized." });
  if (!courseId) return json(400, { error: "Missing course." });
  return getExamForEdit(courseId);
}
async function adminSaveExam(headers, body) {
  if (!(await adminAuth(headers))) return json(401, { error: "Not authorized." });
  if (!body.courseId) return json(400, { error: "Missing course." });
  return saveExam(body.courseId, body);
}
async function adminGrantRetake(headers, body) {
  if (!(await adminAuth(headers))) return json(401, { error: "Not authorized." });
  if (!body.courseId || !body.userId) return json(400, { error: "Missing ids." });
  return grantRetake(body.courseId, body.userId);
}
// Facilitator wrappers (must be assigned to the course)
async function facilitatorGetExam(headers, courseId) {
  const p = await facilitatorAuth(headers);
  if (!p) return json(401, { error: "Not authorized." });
  if (!courseId || !(await facilitatorAssigned(p.sub, courseId))) return json(403, { error: "Not your course." });
  return getExamForEdit(courseId);
}
async function facilitatorSaveExam(headers, body) {
  const p = await facilitatorAuth(headers);
  if (!p) return json(401, { error: "Not authorized." });
  if (!body.courseId || !(await facilitatorAssigned(p.sub, body.courseId))) return json(403, { error: "Not your course." });
  return saveExam(body.courseId, body);
}
async function facilitatorGrantRetake(headers, body) {
  const p = await facilitatorAuth(headers);
  if (!p) return json(401, { error: "Not authorized." });
  if (!body.courseId || !body.userId || !(await facilitatorAssigned(p.sub, body.courseId))) return json(403, { error: "Not your course." });
  return grantRetake(body.courseId, body.userId);
}

// ---- Username, achievements, verification ----
async function studentProfile(headers) {
  const p = await studentAuth(headers);
  if (!p) return json(401, { error: "Please sign in." });
  const rows = await sql("SELECT name, email, username FROM users WHERE id = :id::uuid", { id: p.sub });
  if (!rows.length) return json(404, { error: "Not found." });
  return json(200, { name: rows[0].name, email: rows[0].email, username: rows[0].username || "" });
}
async function setUsername(headers, body) {
  const p = await studentAuth(headers);
  if (!p) return json(401, { error: "Please sign in." });
  const username = String(body.username || "").trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return json(400, { error: "Username must be 3–20 characters: lowercase letters, numbers, or underscore." });
  const taken = await sql("SELECT id FROM users WHERE lower(username) = :u AND id <> :id::uuid", { u: username, id: p.sub });
  if (taken.length) return json(409, { error: "That username is taken." });
  await sql("UPDATE users SET username = :u WHERE id = :id::uuid", { u: username, id: p.sub });
  return json(200, { username });
}
async function publicAchievements(username) {
  const clean = String(username || "").trim().toLowerCase();
  if (!clean) return json(400, { error: "Missing username." });
  const u = await sql("SELECT id, name, username FROM users WHERE lower(username) = :u", { u: clean });
  if (!u.length) return json(404, { error: "Profile not found." });
  const rows = await sql(
    `SELECT c.title AS course_title, c.track, e.completed_at, cert.serial, cert.issued_at
       FROM academy_enrollments e JOIN academy_courses c ON c.id = e.course_id
       LEFT JOIN academy_certificates cert ON cert.course_id = e.course_id AND cert.user_id = e.user_id
      WHERE e.user_id = :uid::uuid AND (e.status = 'completed' OR cert.id IS NOT NULL)
      ORDER BY e.completed_at DESC NULLS LAST`,
    { uid: u[0].id }
  );
  const achievements = rows.map((r) => ({ courseTitle: r.course_title, track: r.track, completedAt: r.completed_at, certificateSerial: r.serial || null, certificateIssuedAt: r.issued_at || null }));
  return json(200, { name: u[0].name, username: u[0].username, achievements });
}
async function verifyCertificate(serial) {
  const s = String(serial || "").trim();
  if (!s) return json(400, { error: "Enter a certificate ID." });
  const rows = await sql("SELECT student_name, course_title, issued_at FROM academy_certificates WHERE upper(serial) = upper(:s)", { s });
  if (!rows.length) return json(200, { valid: false });
  return json(200, { valid: true, name: rows[0].student_name, courseTitle: rows[0].course_title, issuedAt: rows[0].issued_at, serial: s });
}

// ── Notification + contact emails (SES) ────────────────────────────────────
const NOTIFY_EMAILS = ["admin@loopital.com", "tuamenebestgod@gmail.com"];

// Sends via Resend (https://resend.com) when configured; falls back to SES.
async function sendSimpleEmail(to, subject, text, replyTo) {
  const recipients = Array.isArray(to) ? to : [to];
  if (RESEND_API_KEY && RESEND_FROM_EMAIL) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: RESEND_FROM_EMAIL, to: recipients, subject, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    return;
  }
  if (!SES_FROM) return;
  await ses.send(
    new SendEmailCommand({
      FromEmailAddress: SES_FROM,
      Destination: { ToAddresses: recipients },
      ...(replyTo ? { ReplyToAddresses: [replyTo] } : {}),
      Content: { Simple: { Subject: { Data: subject }, Body: { Text: { Data: text } } } },
    })
  );
}

// Best-effort admin notification — never blocks or fails the primary action.
async function notifyAdmins(subject, text) {
  try {
    await sendSimpleEmail(NOTIFY_EMAILS, subject, text);
  } catch (e) {
    console.error("notifyAdmins failed:", (e && e.message) || e);
  }
}

async function handleContact(body) {
  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const subject = (body.subject || "").trim() || "General";
  const message = (body.message || "").trim();
  if (!name || !EMAIL_RE.test(email) || !message)
    return json(400, { error: "Please add your name, a valid email, and a message." });
  const text = `New contact form submission\n\nName: ${name}\nEmail: ${email}\nTopic: ${subject}\n\nMessage:\n${message}`;
  try {
    await sendSimpleEmail(NOTIFY_EMAILS, `[Loopital] ${subject} — ${name}`, text, email);
  } catch (e) {
    console.error("contact email failed:", (e && e.message) || e);
  }
  return json(201, { ok: true });
}

exports.handler = async (event) => {
  const method =
    event.requestContext?.http?.method || event.httpMethod || "GET";
  const path = event.rawPath || event.path || "";
  const route = path.replace(/^\/api/, "") || "/";
  const query = event.queryStringParameters || {};
  const qs = (k) => (query ? query[k] : undefined);

  if (method === "OPTIONS") return json(204, {});

  let body = {};
  if (event.body) {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;
    try {
      body = JSON.parse(raw || "{}");
    } catch (_) {
      return json(400, { error: "Invalid request body." });
    }
  }

  try {
    const headers = event.headers || {};
    if (method === "GET" && route === "/health") return json(200, { status: "ok" });
    if (method === "POST" && route === "/auth/signup") return await signup(body);
    if (method === "POST" && route === "/auth/signin") return await signin(body);
    if (method === "POST" && route === "/waitlist") return await joinWaitlist(body);
    if (method === "POST" && route === "/contact") return await handleContact(body);
    if (method === "GET" && route === "/auth/me") return await me(headers);
    if (method === "GET" && route === "/account/subscriptions") return await getSubscriptions(headers);
    if (method === "GET" && route === "/account/invoices") return await getInvoices(headers);
    if (method === "POST" && route === "/sso/token") return await issueSsoToken(headers, body);
    if (method === "POST" && route === "/sso/exchange") return await exchangeSsoToken(body);

    // Pal workspace: profile/onboarding + billing (Loopital-billed coworker)
    if (method === "GET" && route === "/account/pal") return await palProfile(headers);
    if (method === "POST" && route === "/account/pal/onboarding") return await palOnboarding(headers, body);
    if (method === "POST" && route === "/account/pal/subscribe") return await palSubscribe(headers);
    if (method === "GET" && route === "/account/pay/verify") return await payVerify(headers, qs("reference"));
    if (method === "POST" && route === "/paystack/webhook") return await paystackWebhook(event, body);

    // Academy — public
    if (method === "GET" && route === "/academy/courses") return await listCourses();
    if (method === "GET" && route.startsWith("/academy/courses/"))
      return await getCourse(decodeURIComponent(route.slice("/academy/courses/".length)));
    if (method === "POST" && route === "/academy/apply") return await submitApplication(body);

    // Academy — admin management portal
    if (method === "GET" && route === "/academy/admin/status") return await adminStatus();
    if (method === "POST" && route === "/academy/admin/bootstrap") return await adminBootstrap(body);
    if (method === "POST" && route === "/academy/admin/login") return await adminLogin(body);
    if (method === "POST" && route === "/academy/admin/password") return await adminChangePassword(headers, body);
    if (method === "GET" && route === "/academy/admin/courses") return await adminListCourses(headers);
    if (method === "POST" && route === "/academy/admin/courses/delete") return await adminDeleteCourse(headers, body);
    if (method === "POST" && route === "/academy/admin/courses") return await adminSaveCourse(headers, body);
    if (method === "GET" && route === "/academy/admin/applications") return await adminListApplications(headers);

    // Academy — admin: facilitators
    if (method === "GET" && route === "/academy/admin/facilitators") return await adminListFacilitators(headers);
    if (method === "POST" && route === "/academy/admin/facilitators/delete") return await adminDeleteFacilitator(headers, body);
    if (method === "POST" && route === "/academy/admin/facilitators/assign") return await adminAssignFacilitator(headers, body);
    if (method === "POST" && route === "/academy/admin/facilitators/password") return await adminSetFacilitatorPassword(headers, body);
    if (method === "POST" && route === "/academy/admin/facilitators") return await adminCreateFacilitator(headers, body);

    // Academy — admin: materials
    if (method === "POST" && route === "/academy/admin/materials/upload-url") return await adminMaterialUploadUrl(headers, body);
    if (method === "POST" && route === "/academy/admin/materials/delete") return await adminDeleteMaterial(headers, body);
    if (method === "GET" && route === "/academy/admin/materials/download") return await adminMaterialDownloadUrl(headers, qs("id"));
    if (method === "GET" && route === "/academy/admin/materials") return await adminListMaterials(headers, qs("courseId"));
    if (method === "POST" && route === "/academy/admin/materials") return await adminCreateMaterial(headers, body);

    // Academy — facilitator portal
    if (method === "POST" && route === "/academy/facilitator/login") return await facilitatorLogin(body);
    if (method === "GET" && route === "/academy/facilitator/me") return await facilitatorMe(headers);
    if (method === "POST" && route === "/academy/facilitator/password") return await facilitatorChangePassword(headers, body);
    if (method === "GET" && route === "/academy/facilitator/materials/download") return await facilitatorMaterialDownloadUrl(headers, qs("id"));
    if (method === "GET" && route === "/academy/facilitator/roster") return await facilitatorRoster(headers, qs("courseId"));
    if (method === "POST" && route === "/academy/facilitator/certificate") return await facilitatorGenerateCertificate(headers, body);

    // Academy — student portal (uses the standard user JWT)
    if (method === "GET" && route === "/academy/student/courses") return await studentCourses(headers);
    if (method === "POST" && route === "/academy/student/enroll") return await studentEnroll(headers, body);
    if (method === "POST" && route === "/academy/student/unenroll") return await studentUnenroll(headers, body);
    if (method === "GET" && route === "/academy/student/course") return await studentCourseDetail(headers, qs("courseId"));
    if (method === "POST" && route === "/academy/student/progress") return await studentProgress(headers, body);
    if (method === "GET" && route === "/academy/student/materials/download") return await studentMaterialDownloadUrl(headers, qs("id"));
    if (method === "GET" && route === "/academy/student/certificate/download") return await studentCertificateDownloadUrl(headers, qs("id"));

    // Academy — admin: sessions, enrolments, certificates
    if (method === "GET" && route === "/academy/admin/sessions") return await adminListSessions(headers, qs("courseId"));
    if (method === "POST" && route === "/academy/admin/sessions/delete") return await adminDeleteSession(headers, body);
    if (method === "POST" && route === "/academy/admin/sessions") return await adminCreateSession(headers, body);
    if (method === "GET" && route === "/academy/admin/enrollments") return await adminListEnrollments(headers, qs("courseId"));
    if (method === "POST" && route === "/academy/admin/enrollments/remove") return await adminRemoveEnrollment(headers, body);
    if (method === "POST" && route === "/academy/admin/certificate") return await adminGenerateCertificate(headers, body);

    // Academy — reviews (public list + student post)
    if (method === "GET" && route === "/academy/reviews") return await listReviews(qs("courseId"));
    if (method === "POST" && route === "/academy/student/review") return await studentReview(headers, body);

    // Academy — exams (student take + submit)
    if (method === "GET" && route === "/academy/student/exam") return await studentExam(headers, qs("courseId"));
    if (method === "POST" && route === "/academy/student/exam/submit") return await studentSubmitExam(headers, body);

    // Academy — student profile + username
    if (method === "GET" && route === "/academy/student/profile") return await studentProfile(headers);
    if (method === "POST" && route === "/academy/student/username") return await setUsername(headers, body);

    // Academy — public achievements + certificate verification
    if (method === "GET" && route.startsWith("/academy/u/")) return await publicAchievements(decodeURIComponent(route.slice("/academy/u/".length)));
    if (method === "GET" && route === "/academy/verify") return await verifyCertificate(qs("serial"));

    // Academy — admin: reviews + exams
    if (method === "GET" && route === "/academy/admin/reviews") return await adminListReviews(headers, qs("courseId"));
    if (method === "POST" && route === "/academy/admin/reviews/hide") return await adminHideReview(headers, body);
    if (method === "GET" && route === "/academy/admin/exam") return await adminGetExam(headers, qs("courseId"));
    if (method === "POST" && route === "/academy/admin/exam/grant") return await adminGrantRetake(headers, body);
    if (method === "POST" && route === "/academy/admin/exam") return await adminSaveExam(headers, body);

    // Academy — facilitator: exams
    if (method === "GET" && route === "/academy/facilitator/exam") return await facilitatorGetExam(headers, qs("courseId"));
    if (method === "POST" && route === "/academy/facilitator/exam/grant") return await facilitatorGrantRetake(headers, body);
    if (method === "POST" && route === "/academy/facilitator/exam") return await facilitatorSaveExam(headers, body);

    return json(404, { error: "Not found." });
  } catch (err) {
    console.error("Handler error:", err);
    return json(500, { error: "Something went wrong. Please try again." });
  }
};
