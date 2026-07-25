const { Pool } = require('pg');
require('dotenv').config({path: '.env.local'});
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT items FROM orders WHERE items::text LIKE '%\"is_discovery_set\":true%' OR items::text LIKE '%\"is_discovery_set\": true%' LIMIT 1")
  .then(res => { console.log(JSON.stringify(res.rows[0], null, 2)); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });
