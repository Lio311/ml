require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  const res = await pool.query("SELECT * FROM products WHERE name ILIKE '%Yuma%' OR model ILIKE '%Yuma%'");
  console.log(JSON.stringify(res.rows[0], null, 2));
  pool.end();
}
run();
