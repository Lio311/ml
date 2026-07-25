const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query("SELECT title, description, highlights FROM brands WHERE name ILIKE '%Xerjoff%'").then(pRes => {
  console.log(JSON.stringify(pRes.rows[0], null, 2));
  process.exit(0);
});
