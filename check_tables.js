require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
pool.query("SELECT customer_details FROM orders LIMIT 1").then(res => { console.log(res.rows[0]); process.exit(0); });
