const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function getBrands() {
    try {
        const res = await pool.query('SELECT DISTINCT brand FROM products WHERE active = true ORDER BY brand ASC');
        console.log(res.rows.map(r => r.brand));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

getBrands();
