require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function migrateSchema() {
    if (!process.env.DATABASE_URL) { require('dotenv').config(); }
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    const client = await pool.connect();
    try {
        console.log('🔄 Starting Schema Migration...');

        // 1. Drop is_limited if exists
        await client.query(`ALTER TABLE products DROP COLUMN IF EXISTS is_limited;`);
        console.log('✅ Dropped is_limited column.');

        // 2. Add stock if not exists
        await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;`);
        console.log('✅ Ensured stock column exists.');

    } catch (err) {
        console.error('❌ Migration Error:', err);
    } finally {
        client.release();
        pool.end();
    }
}
migrateSchema();
