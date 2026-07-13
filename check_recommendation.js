require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
async function main() {
  const res = await pool.query("SELECT * FROM monthly_recommendations WHERE month = '2026-07'");
  console.log('Record for 2026-07:');
  console.log(res.rows[0]);
  process.exit(0);
}
main().catch(console.error);
