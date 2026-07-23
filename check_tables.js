require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query("SELECT id, status, scheduled_at FROM email_campaigns WHERE status = 'scheduled' AND scheduled_at IS NULL").then(res => { console.log('Null scheduled_at with status=scheduled:', res.rows); process.exit(0); });
