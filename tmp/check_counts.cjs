require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

async function check() {
  const result = await pool.query(`
    SELECT count(*) as total 
    FROM products 
    WHERE active = true AND description IS NOT NULL AND description != ''
  `);
  const rev = await pool.query('SELECT count(*) as total FROM product_desc_reviews');
  console.log('Total active with desc:', result.rows[0].total);
  console.log('Total reviewed:', rev.rows[0].total);
  pool.end();
}
check();
