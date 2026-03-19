const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkProducts() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });
    try {
        const res = await pool.query("SELECT id, name, image_url FROM products WHERE image_url LIKE '%&s%' LIMIT 5");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkProducts();
