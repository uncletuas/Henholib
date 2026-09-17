// Postgres data layer for the Loopital hub.
//
// `sql(statement, params)` takes NAMED parameters (`:email`, `:id::uuid`):
//   - named `:param` placeholders are rewritten to positional `$1..$n`
//   - `::type` casts (e.g. `:id::uuid`) are preserved
//   - rows come back as plain objects (like `formatRecordsAs: "JSON"` did)
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("FATAL: DATABASE_URL is not set.");
}

// A local database needs no TLS. Only turn SSL on for hosts that require it.
const needsSsl = /sslmode=require/.test(connectionString || "") ||
  /[?&]ssl=true/.test(connectionString || "");

// Every query is scoped to the hub's own schema via search_path.
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
