require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Vercel/Neon usually
});

async function run() {
    try {
        console.log("Checking schema...");
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'products'");
        const columns = res.rows.map(r => r.column_name);
        console.log("Current columns:", columns);

        if (!columns.includes('slug')) {
            console.log("Adding slug column...");
            await pool.query("ALTER TABLE products ADD COLUMN slug TEXT UNIQUE");
            console.log("Slug column added.");
        } else {
            console.log("Slug column exists.");
        }

        // Populate slugs
        console.log("Populating empty slugs...");
        const products = await pool.query("SELECT id, name FROM products WHERE slug IS NULL");

        for (const p of products.rows) {
            let slug = p.name.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphen
                .replace(/^-+|-+$/g, '');   // Trim hyphens

            // Generate unique slug if collision (simple append id)
            // Ideally we check uniqueness but for existing data just appending ID is safest if name is duplicate
            // But let's try clean slug first.

            try {
                await pool.query("UPDATE products SET slug = $1 WHERE id = $2", [slug, p.id]);
                console.log(`Updated ${p.name} -> ${slug}`);
            } catch (e) {
                // If duplicate, append ID
                slug = `${slug}-${p.id}`;
                await pool.query("UPDATE products SET slug = $1 WHERE id = $2", [slug, p.id]);
                console.log(`Updated ${p.name} -> ${slug} (fallback)`);
            }
        }

        console.log("Migration complete.");

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
