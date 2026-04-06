require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function init() {
    const client = await pool.connect();
    try {
        console.log("Creating email_logs table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS email_logs (
                id SERIAL PRIMARY KEY,
                recipient TEXT NOT NULL,
                subject TEXT NOT NULL,
                type TEXT NOT NULL,
                status TEXT NOT NULL, -- 'sent' or 'failed'
                error_message TEXT,
                order_id INTEGER,
                sent_at TIMESTAMP DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);
            CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);
            CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(type);
        `);
        console.log("Table created successfully.");
    } catch (err) {
        console.error("Error creating table:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

init();
