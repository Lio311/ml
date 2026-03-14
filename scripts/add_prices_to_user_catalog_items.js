
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('Adding prices JSONB column to user_catalog_items table...');
        
        await client.query(`
            ALTER TABLE user_catalog_items 
            ADD COLUMN IF NOT EXISTS prices JSONB;
        `);
        
        // Optionally make the old price column nullable so insertions without it don't fail
        await client.query(`
            ALTER TABLE user_catalog_items 
            ALTER COLUMN price DROP NOT NULL;
        `);
        
        console.log('Successfully added prices column and made price nullable.');
    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        client.release();
        process.exit();
    }
}

runMigration();
