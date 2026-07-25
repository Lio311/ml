const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'brands'").then(pRes => {
  console.log('Brands columns:', pRes.rows.map(r => r.column_name));
  process.exit(0);
});
