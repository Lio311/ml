const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name IN ('top_notes', 'heart_notes', 'base_notes')
    `);
    console.log(res.rows);
  } finally {
    pool.end();
  }
}
main();
