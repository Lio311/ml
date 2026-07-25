require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query(`
    SELECT brand, COUNT(*) as total_products, 
           SUM(CASE WHEN description IS NULL OR description = '' THEN 1 ELSE 0 END) as missing_descriptions
    FROM products 
    GROUP BY brand
    HAVING SUM(CASE WHEN description IS NULL OR description = '' THEN 1 ELSE 0 END) > 0
`).then(res => {
    console.log(`Brands with missing product descriptions:`);
    console.dir(res.rows, { depth: null });
    process.exit(0);
}).catch(console.error);
