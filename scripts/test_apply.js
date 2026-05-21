const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        // 1. Find a product that has a review
        const res = await pool.query('SELECT * FROM product_desc_reviews LIMIT 1');
        if (res.rows.length === 0) {
            console.log('No reviews found.');
            return;
        }
        
        const review = res.rows[0];
        console.log('Found review for product:', review.product_id, review.brand, review.model);
        console.log('Suggested rewrite:', review.suggested_rewrite);
        
        // 2. Apply it (simulate API)
        const rewrite = review.suggested_rewrite;
        const productId = review.product_id;
        
        // Update the product description
        await pool.query(
            'UPDATE products SET description = $1 WHERE id = $2',
            [rewrite, productId]
        );
        console.log('Updated products table.');
        
        // Delete the obsolete review
        await pool.query(
            'DELETE FROM product_desc_reviews WHERE product_id = $1',
            [productId]
        );
        console.log('Deleted from product_desc_reviews table.');
        
        // 3. Verify
        const check = await pool.query('SELECT description FROM products WHERE id = $1', [productId]);
        console.log('Current description in DB:', check.rows[0].description);
        
    } catch(e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
