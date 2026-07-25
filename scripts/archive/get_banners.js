require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT value FROM site_settings WHERE key = $1', ['home_banner'])
  .then(res => { console.log(JSON.stringify(res.rows, null, 2)); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
