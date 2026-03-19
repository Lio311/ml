const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkFrederic() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });
    try {
        const res = await pool.query("SELECT name, image_url FROM products WHERE name ILIKE '%Acne%'");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkFrederic();
