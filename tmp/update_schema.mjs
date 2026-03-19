import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function updateSchema() {
    try {
        console.log('Connecting to database...');
        const res = await pool.query("ALTER TABLE user_catalogs ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE");
        console.log('Schema updated successfully:', res.command);
    } catch (error) {
        console.error('Error updating schema:', error);
        process.exit(1);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

updateSchema();
