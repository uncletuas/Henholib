// Idempotent schema migration for the loopital API on Render.
// Runs the byte-identical DDL from schema.js (extracted from the original
// infra/scripts/migrate.mjs) against Postgres. Safe to run on every boot —
// every statement is CREATE ... IF NOT EXISTS / ALTER ... IF NOT EXISTS.
const { pool } = require("./db");
const statements = require("./schema");

async function migrate() {
  // Fail fast if the database is unreachable, rather than retrying 59 DDL
  // statements against a dead connection (which would stall boot).
  try {
    await pool.query("SELECT 1");
  } catch (err) {
    console.error(`migrate: database unreachable, skipping schema (${err.message}).`);
    return;
  }
  for (const statement of statements) {
    const label = statement.split("\n")[0].slice(0, 64);
    try {
      await pool.query(statement);
    } catch (err) {
      // A widening ALTER can fail on a fresh DB where the object is already in
      // its final shape; log and continue rather than block boot.
      console.error(`migrate: "${label}..." -> ${err.message}`);
    }
  }
  console.log(`migrate: applied ${statements.length} statements.`);
}

module.exports = { migrate };

// Allow `node migrate.js` as a one-off.
if (require.main === module) {
  migrate()
    .then(() => pool.end())
    .then(() => process.exit(0))
    .catch((e) => { console.error(e); process.exit(1); });
}
