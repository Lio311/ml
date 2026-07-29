const { Pool } = require("pg");
require("dotenv").config({ path: ".env.local" });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT id, to_email, subject, status, created_at, error_message FROM email_logs ORDER BY created_at DESC LIMIT 5")
  .then(res => { console.log(res.rows); pool.end(); })
  .catch(console.error);
