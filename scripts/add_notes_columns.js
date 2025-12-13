require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});


async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Adding notes columns to products table...');

        await client.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS top_notes TEXT,
            ADD COLUMN IF NOT EXISTS middle_notes TEXT,
            ADD COLUMN IF NOT EXISTS base_notes TEXT;
        `);

        console.log('Columns added successfully (or already existed).');

        // Optional: Update a test product (e.g., ID 1) if needed, but not strictly necessary here.

    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        client.release();
        if (pool) await pool.end();
    }
}

migrate();
