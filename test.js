const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    const res = await pool.query('SELECT * FROM unsubscribed_emails');
    console.log(res.rows);
  } catch (err) {
    console.error('DB Error on unsubscribed_emails:', err);
  }

  try {
    const res2 = await pool.query('SELECT email, first_name, last_name, created_at FROM users WHERE email IS NOT NULL ORDER BY created_at DESC');
    console.log(res2.rows);
  } catch (err) {
    console.error('DB Error on users:', err);
  }
  process.exit();
}

main();
