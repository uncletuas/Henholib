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
 *   GET  /api/health                                               -> { status: "ok" }
 *
 * The unified loopital account is the single identity; SART34 and STACK62
 * reference it for their (independent) subscriptions. HMS7 and FMS13 are
 * demo-led and never appear in the portal.
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
    if (method === "GET" && route === "/auth/me") return await me(headers);
    if (method === "GET" && route === "/account/subscriptions") return await getSubscriptions(headers);
    if (method === "GET" && route === "/account/invoices") return await getInvoices(headers);
    return json(404, { error: "Not found." });
  } catch (err) {
    console.error("Handler error:", err);
    return json(500, { error: "Something went wrong. Please try again." });
  }
};
