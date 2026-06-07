import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

const pool = new pg.Pool({ connectionString: process.env.POSTGRES_URL });

async function migrate() {
    try {
        console.log("Adding columns to products table...");
        await pool.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS is_discovery_set BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS single_price NUMERIC,
            ADD COLUMN IF NOT EXISTS volume_label VARCHAR(255)
        `);
        console.log("Successfully added columns.");
    } catch(e) {
        console.error("Migration failed:", e);
    } finally {
        process.exit(0);
    }
}
migrate();
