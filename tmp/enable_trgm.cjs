require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log("Enabling pg_trgm extension...");
        await pool.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
        console.log("Extension enabled successfully.");

        // Optionally, we can create an index to make searches faster
        // console.log("Creating trigram index on products...");
        // await pool.query('CREATE INDEX IF NOT EXISTS trgm_idx_product_name ON products USING GIN (name gin_trgm_ops);');
        // await pool.query('CREATE INDEX IF NOT EXISTS trgm_idx_product_brand ON products USING GIN (brand gin_trgm_ops);');
        // await pool.query('CREATE INDEX IF NOT EXISTS trgm_idx_product_name_he ON products USING GIN (name_he gin_trgm_ops);');
        // console.log("Indexes created.");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}

run();
