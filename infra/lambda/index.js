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
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const rds = new RDSDataClient({});
const sm = new SecretsManagerClient({});

const { CLUSTER_ARN, SECRET_ARN, DB_NAME, JWT_SECRET_ARN } = process.env;
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
    "SELECT id, name, email FROM users WHERE id = :id::uuid",
    { id: payload.sub }
  );
  if (rows.length === 0) return json(401, { error: "Account not found." });
  return json(200, { user: publicUser(rows[0]) });
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
  };
}

const COURSE_COLS =
  "id, slug, title, image, track, course_type, delivery_mode, short_desc, full_desc, who_for, curriculum, format, price_cents, currency, status, published, sort_order, instructor_name, instructor_title, instructor_bio";

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
         instructor_bio = :instructor_bio, updated_at = now()
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
        instructor_name, instructor_title, instructor_bio)
     VALUES
       (:slug, :title, :image, :track, :course_type, :delivery_mode, :short_desc, :full_desc, :who_for, :curriculum, :format,
        :price_cents::int, :currency, :status, :published::boolean, :sort_order::int,
        :instructor_name, :instructor_title, :instructor_bio)
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

exports.handler = async (event) => {
  const method =
    event.requestContext?.http?.method || event.httpMethod || "GET";
  const path = event.rawPath || event.path || "";
  const route = path.replace(/^\/api/, "") || "/";

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
    if (method === "GET" && route === "/auth/me") return await me(headers);
    if (method === "GET" && route === "/account/subscriptions") return await getSubscriptions(headers);
    if (method === "GET" && route === "/account/invoices") return await getInvoices(headers);
    if (method === "POST" && route === "/sso/token") return await issueSsoToken(headers, body);
    if (method === "POST" && route === "/sso/exchange") return await exchangeSsoToken(body);

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

    return json(404, { error: "Not found." });
  } catch (err) {
    console.error("Handler error:", err);
    return json(500, { error: "Something went wrong. Please try again." });
  }
};
