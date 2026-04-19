const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function setup() {
    const client = await pool.connect();
    try {
        console.log("Starting DB setup...");
        await client.query('BEGIN');

        // influencers table
        await client.query(`
            CREATE TABLE IF NOT EXISTS influencers (
                id SERIAL PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                base_salary NUMERIC DEFAULT 0,
                commission_percent NUMERIC DEFAULT 10,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Add influencer_id to coupons
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='influencer_id') THEN
                    ALTER TABLE coupons ADD COLUMN influencer_id INTEGER REFERENCES influencers(id) ON DELETE SET NULL;
                END IF;
            END $$;
        `);

        await client.query('COMMIT');
        console.log("DB setup completed successfully.");
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("DB setup failed:", error);
    } finally {
        client.release();
        pool.end();
    }
}

setup();
