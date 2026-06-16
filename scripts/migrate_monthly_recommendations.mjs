import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log("Creating monthly_recommendations table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS monthly_recommendations (
                id SERIAL PRIMARY KEY,
                month VARCHAR(10) UNIQUE NOT NULL, -- e.g. "2026-06"
                perfume_ids JSONB DEFAULT '[]', -- Array of perfume IDs or names
                status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'selected', 'skipped'
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("Success!");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await pool.end();
    }
}

run();
