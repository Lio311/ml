import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local from the root of the app
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS live_carts (
                session_id VARCHAR(255) PRIMARY KEY,
                email VARCHAR(255),
                items JSONB NOT NULL,
                total_price DECIMAL(10, 2),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("Table live_carts created successfully.");
    } catch (error) {
        console.error("Error creating table:", error);
    } finally {
        // End the pool gracefully
        await pool.end();
        process.exit(0);
    }
}
run();
