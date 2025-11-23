const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS links (
      id SERIAL PRIMARY KEY,
      code VARCHAR(16) UNIQUE NOT NULL,
      url TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_clicked_at TIMESTAMPTZ,
      click_count INTEGER NOT NULL DEFAULT 0
    )
  `);
}

module.exports = {
  pool,
  initDb,
};
