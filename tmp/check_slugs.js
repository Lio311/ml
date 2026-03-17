const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkSlugs() {
    try {
        const res = await pool.query('SELECT id, name, slug FROM products WHERE slug IS NULL OR slug = \'\'');
        console.log(`Found ${res.rows.length} products without slugs.`);
        res.rows.slice(0, 10).forEach(p => {
            console.log(`ID: ${p.id}, Name: ${p.name}`);
        });
        
        // Check product 201 specifically
        const p201 = await pool.query('SELECT name, slug FROM products WHERE id = 201');
        console.log('Product 201:', p201.rows[0]);
        
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkSlugs();
