require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkGoti() {
    const client = await pool.connect();
    try {
        const res = await client.query("SELECT id, name, brand FROM products WHERE brand ILIKE '%Goti%' OR name ILIKE '%Goti%'");
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        await pool.end();
    }
}

checkGoti();
