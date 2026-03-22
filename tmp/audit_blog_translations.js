const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function audit() {
    const res = await pool.query('SELECT id, title, excerpt FROM blog_posts ORDER BY id');
    console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
}

audit().catch(console.error);
