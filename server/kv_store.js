import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const TABLE = 'kv_store_a80b6662';

export async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      key TEXT NOT NULL PRIMARY KEY,
      value JSONB NOT NULL
    )
  `);
}

export async function set(key, value) {
  await pool.query(
    `INSERT INTO ${TABLE} (key, value) VALUES ($1, $2::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, JSON.stringify(value)]
  );
}

export async function get(key) {
  const { rows } = await pool.query(
    `SELECT value FROM ${TABLE} WHERE key = $1`,
    [key]
  );
  return rows[0]?.value ?? null;
}

export async function del(key) {
  await pool.query(`DELETE FROM ${TABLE} WHERE key = $1`, [key]);
}

export async function mset(keys, values) {
  for (let i = 0; i < keys.length; i++) {
    await set(keys[i], values[i]);
  }
}

export async function mget(keys) {
  const { rows } = await pool.query(
    `SELECT key, value FROM ${TABLE} WHERE key = ANY($1)`,
    [keys]
  );
  return keys.map(k => rows.find(r => r.key === k)?.value ?? null);
}

export async function mdel(keys) {
  await pool.query(`DELETE FROM ${TABLE} WHERE key = ANY($1)`, [keys]);
}

export async function getByPrefix(prefix) {
  const { rows } = await pool.query(
    `SELECT value FROM ${TABLE} WHERE key LIKE $1`,
    [prefix + '%']
  );
  return rows.map(r => r.value);
}
