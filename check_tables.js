require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query(`
    SELECT id, brand, model, created_at, discovery_email_sent, perfume_email_sent, is_discovery_set, active 
    FROM products 
    WHERE (brand ILIKE '%anelo%' OR model ILIKE '%anelo%' 
       OR brand ILIKE '%yuma%' OR model ILIKE '%yuma%'
       OR brand ILIKE '%maiestus%' OR model ILIKE '%maiestus%')
`).then(res => {
    console.log("Perfumes:", res.rows);
    process.exit(0);
}).catch(console.error);
