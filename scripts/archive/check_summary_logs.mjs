import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });
import pool from './app/lib/db.js';

async function checkLogs() {
  try {
    const res = await pool.query(`
      SELECT * FROM email_logs 
      WHERE (sent_at AT TIME ZONE 'Asia/Jerusalem')::date = (NOW() AT TIME ZONE 'Asia/Jerusalem')::date
      AND subject LIKE '%סיכום אימיילים יומי%'
      ORDER BY sent_at DESC
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkLogs();
