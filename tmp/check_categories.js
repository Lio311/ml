const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkCategories() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });
    try {
        const res = await pool.query("SELECT DISTINCT category FROM products");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkCategories();
