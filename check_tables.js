require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query("SELECT * FROM email_logs WHERE status IN ('pending', 'scheduled')").then(res => {
    console.log("email_logs pending/scheduled:", res.rows.length);
    process.exit(0);
}).catch(console.error);
