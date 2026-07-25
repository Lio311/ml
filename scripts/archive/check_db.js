const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query("SELECT * FROM site_settings WHERE key = 'last_marketing_email_date'").then(res => {
  console.log('Settings:', res.rows);
  pool.query("SELECT id, brand, model, is_preorder, perfume_email_sent, created_at FROM products WHERE model ILIKE '%MIDNIGHT RIO%'").then(pRes => {
    console.log('Products:', pRes.rows);
    process.exit(0);
  });
});
