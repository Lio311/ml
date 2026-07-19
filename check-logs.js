require('dotenv').config({ path: './.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkLogs() {
  try {
    const res = await pool.query(`
      SELECT subject, recipient, sent_at AT TIME ZONE 'Asia/Jerusalem' as sent_at_local, type, status 
      FROM email_logs 
      WHERE type = 'system'
      ORDER BY sent_at DESC
      LIMIT 10
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkLogs();
