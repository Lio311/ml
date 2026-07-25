const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query("SELECT subject, sent_at FROM email_logs ORDER BY sent_at DESC LIMIT 5").then(pRes => {
  console.log('Recent emails:', pRes.rows);
  process.exit(0);
});
