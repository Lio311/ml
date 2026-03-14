
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('Adding image_url to user_catalogs table...');
        
        await client.query(`
            ALTER TABLE user_catalogs 
            ADD COLUMN IF NOT EXISTS image_url TEXT;
        `);
        
        console.log('Successfully added image_url column.');
    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        client.release();
        process.exit();
    }
}

runMigration();
