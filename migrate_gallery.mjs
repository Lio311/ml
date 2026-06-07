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
        console.log("Adding columns to products table...");
        await pool.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS is_discovery_set BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS single_price INTEGER,
            ADD COLUMN IF NOT EXISTS volume_label VARCHAR(255),
            ADD COLUMN IF NOT EXISTS image_url_2 TEXT,
            ADD COLUMN IF NOT EXISTS image_url_3 TEXT;
        `);
        console.log("Migration successful.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}

runMigration();
