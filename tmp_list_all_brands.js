const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function listAllBrands() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const res = await pool.query("SELECT name FROM brands ORDER BY name ASC");
        console.log('All brands in "brands" table:');
        res.rows.forEach(r => console.log(`"${r.name}"`));
        console.log('Total count:', res.rows.length);

    } catch (err) {
        console.error('Database Error:', err);
    } finally {
        await pool.end();
    }
}

listAllBrands();
