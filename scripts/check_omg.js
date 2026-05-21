const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const check = await pool.query("SELECT * FROM products WHERE brand ILIKE '%omg%' OR model ILIKE '%omg%'");
        console.log('OMG Product from DB:');
        check.rows.forEach(r => console.log(r.id, r.brand, r.model, '\nDESC:', r.description));
        
        const review = await pool.query("SELECT * FROM product_desc_reviews WHERE product_id = $1", [check.rows[0].id]);
        console.log('\nReview for OMG:', review.rows.length);
        if (review.rows.length > 0) {
            console.log(review.rows[0]);
        }
    } catch(e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
