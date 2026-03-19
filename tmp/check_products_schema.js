const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkSchema() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'products'");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkSchema();
