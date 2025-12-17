require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'brands'");
        console.log("Brands columns:", res.rows.map(r => r.column_name));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
