import { config } from 'dotenv';
config({ path: '.env.local' });
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        console.log("Adding discovery_type column to products table...");
        await pool.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS discovery_type VARCHAR(50) DEFAULT 'discovery_set';
        `);
        console.log("Migration successful.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}

runMigration();
