require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});
async function main() {
  const res = await pool.query("SELECT image_url FROM products WHERE slug = 'somens-capriccio'");
  console.log(res.rows[0]);
  process.exit(0);
}
main();
