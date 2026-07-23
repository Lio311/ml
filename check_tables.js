require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

Promise.all([
    pool.query("SELECT * FROM automation_config"),
    pool.query("SELECT * FROM workflows"),
    pool.query("SELECT * FROM email_logs WHERE created_at > NOW() - INTERVAL '1 days'")
]).then(res => {
    console.log("automation_config:", res[0].rows);
    console.log("workflows:", res[1].rows);
    console.log("recent email_logs:", res[2].rows.length);
    process.exit(0);
}).catch(console.error);
