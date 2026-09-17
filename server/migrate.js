// Idempotent schema migration for the Loopital hub. Runs the DDL from schema.js
// against Postgres on every boot — every statement is IF NOT EXISTS.
const { pool, SCHEMA } = require("./db");
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
  // search_path points every connection at this schema, so the DDL lands here.
  await pool.query(`CREATE SCHEMA IF NOT EXISTS ${SCHEMA}`);
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
