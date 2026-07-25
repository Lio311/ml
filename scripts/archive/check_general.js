const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query("SELECT id, brand, model, category FROM products WHERE category ILIKE '%General%'").then(pRes => {
  console.log('Products in General:', pRes.rows);
  process.exit(0);
});
