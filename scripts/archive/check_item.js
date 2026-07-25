require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function run() {
  const res = await pool.query("SELECT id, name, brand, model, image_url, stock, price_2ml, price_5ml, price_10ml, single_price, is_discovery_set, discount_percentage, discount_sizes FROM products WHERE id = 305 AND status = 'active'");
  console.log(JSON.stringify(res.rows[0], null, 2));
  pool.end();
}
run();
