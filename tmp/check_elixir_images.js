const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkBrands() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });
    try {
        const res = await pool.query("SELECT name, logo_url FROM brands WHERE name ILIKE '%Elixir%'");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkBrands();
