const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function verify() {
    const res = await pool.query("SELECT COUNT(*) FROM blog_posts WHERE excerpt_en IS NOT NULL AND excerpt_en != ''");
    console.log('Excerpts translated:', res.rows[0].count);
    
    // Check a few specifically
    const samples = await pool.query("SELECT id, title_en, excerpt_en FROM blog_posts WHERE id IN (1, 10, 20, 27)");
    console.log(JSON.stringify(samples.rows, null, 2));
    
    await pool.end();
}

verify().catch(console.error);
