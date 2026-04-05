import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    console.log("Adding columns to orders table...");
    try {
        await pool.query(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS educational_email_sent BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS review_email_sent BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS coupon_rewarded BOOLEAN DEFAULT FALSE;
        `);
        console.log("Added columns successfully.");

        console.log("Creating pending_recommendation_emails table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS pending_recommendation_emails (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
                suggested_products JSONB NOT NULL DEFAULT '[]',
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Created table successfully.");

    } catch (e) {
        console.error("Migration error:", e);
    } finally {
        await pool.end();
        process.exit();
    }
}

runMigration();
