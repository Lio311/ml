
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('Adding detailed fields to user_catalog_items...');
        
        await client.query(`
            ALTER TABLE user_catalog_items 
            ADD COLUMN IF NOT EXISTS brand VARCHAR(255),
            ADD COLUMN IF NOT EXISTS fragrance_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS top_notes TEXT,
            ADD COLUMN IF NOT EXISTS middle_notes TEXT,
            ADD COLUMN IF NOT EXISTS base_notes TEXT,
            ADD COLUMN IF NOT EXISTS gender VARCHAR(50),
            ADD COLUMN IF NOT EXISTS category VARCHAR(255);
        `);
        
        console.log('Successfully added detailed fields to user_catalog_items.');
    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        client.release();
        process.exit();
    }
}

runMigration();
