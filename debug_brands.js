const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const res = await pool.query("SELECT name, logo_url FROM brands WHERE name ILIKE '%Byredo%' OR name ILIKE '%iP%' OR name ILIKE '%Christian Provenzano%'");
    console.log(res.rows);
    pool.end();
}

run();
