const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

async function fixSlugs() {
    try {
        const res = await pool.query('SELECT id, name FROM products WHERE slug IS NULL OR slug = \'\'');
        console.log(`Fixing ${res.rows.length} products...`);
        
        for (const product of res.rows) {
            const slug = slugify(product.name);
            console.log(`Setting ID ${product.id} (${product.name}) -> ${slug}`);
            await pool.query('UPDATE products SET slug = $1 WHERE id = $2', [slug, product.id]);
        }
        
        console.log('All missing slugs fixed.');
        
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

fixSlugs();
