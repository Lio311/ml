require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function setupNotifications() {
    const client = await pool.connect();
    try {
        console.log("Creating notifications table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                type VARCHAR(50) NOT NULL, -- 'order', 'alert', 'info'
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT NOW(),
                meta JSONB DEFAULT '{}' -- e.g. { orderId: 123 }
            );
        `);
        console.log("notifications table created.");

        // Clean up old test data if any? No, it's new.

    } catch (err) {
        console.error("Error setting up notifications:", err);
    } finally {
        client.release();
        pool.end();
    }
}

setupNotifications();
