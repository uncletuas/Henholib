// Postgres data layer for the loopital API on Render.
//
// The original handler ran on AWS Lambda and talked to Aurora via the RDS Data
// API through a `sql(statement, params)` helper that used NAMED parameters
// (`:email`, `:id::uuid`). This module reproduces that exact contract on top of
// node-postgres (`pg`) so every call site in app.js keeps working unchanged:
//   - named `:param` placeholders are rewritten to positional `$1..$n`
//   - `::type` casts (e.g. `:id::uuid`) are preserved
//   - rows come back as plain objects (like `formatRecordsAs: "JSON"` did)
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("FATAL: DATABASE_URL is not set.");
}

// Render's INTERNAL database URL needs no TLS (same private network). Only turn
// SSL on for external/managed hosts that require it.
const needsSsl = /sslmode=require/.test(connectionString || "") ||
  /[?&]ssl=true/.test(connectionString || "");

// loopital shares the pal-db instance but lives in its OWN schema so its tables
// (users, subscriptions, payments, …) never collide with Pal's public tables.
// Setting search_path at connection startup scopes every query to that schema.
const SCHEMA = process.env.DB_SCHEMA || "loopital";

const pool = new Pool({
  connectionString,
  ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  options: `-c search_path=${SCHEMA}`,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
});

pool.on("error", (err) => console.error("pg pool error:", err.message));

// Rewrite `:name` → `$n`. A leading-`:` cast (`::uuid`) is left alone because
// the second colon is preceded by `:` and the first is followed by `:` (not a
// letter), so neither matches. Repeated names reuse the same positional slot.
function rewrite(statement) {
  const order = [];
  const text = statement.replace(/(?<!:):([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
    let i = order.indexOf(name);
    if (i === -1) { order.push(name); i = order.length - 1; }
    return "$" + (i + 1);
  });
  return { text, order };
}

/** Execute a parameterised statement (named `:params`) and return the rows. */
async function sql(statement, params = {}) {
  const { text, order } = rewrite(statement);
  const values = order.map((name) => {
    const v = params[name];
    return v === undefined ? null : v;
  });
  const res = await pool.query(text, values);
  return res.rows;
}

module.exports = { pool, sql, SCHEMA };
