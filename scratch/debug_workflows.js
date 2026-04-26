
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'workflows'");
        console.log('Columns:', res.rows.map(r => r.column_name));
        
        const data = await pool.query("SELECT name, last_run FROM workflows LIMIT 5");
        console.log('Data sample:', data.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

check();
