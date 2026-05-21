const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await pool.query('ALTER TABLE products ALTER COLUMN discount_percentage TYPE NUMERIC(5,2);');
        console.log('Success');
    } catch(e) { console.error(e); } finally { pool.end(); }
}
run();
