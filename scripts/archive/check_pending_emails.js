require('dotenv').config({path: '.env.local'});
const {Pool} = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl:{rejectUnauthorized:false}});

async function checkPending() {
    const perfumes = await pool.query(`
        SELECT id, brand, model, created_at 
        FROM products 
        WHERE is_discovery_set = false AND perfume_email_sent = false AND active = true
        ORDER BY created_at ASC
    `);
    
    const sets = await pool.query(`
        SELECT id, brand, model, created_at 
        FROM products 
        WHERE is_discovery_set = true AND discovery_email_sent = false AND active = true
        ORDER BY created_at ASC
    `);

    console.log("Pending New Perfumes (" + perfumes.rows.length + "):");
    perfumes.rows.forEach(p => console.log(`- ${p.brand} ${p.model}`));

    console.log("\nPending Discovery Sets (" + sets.rows.length + "):");
    sets.rows.forEach(s => console.log(`- ${s.brand} ${s.model}`));

    process.exit(0);
}

checkPending();
