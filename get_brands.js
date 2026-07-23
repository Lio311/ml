const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query("SELECT name FROM brands ORDER BY name ASC").then(pRes => {
  console.log(JSON.stringify(pRes.rows.map(r => r.name)));
  process.exit(0);
});
