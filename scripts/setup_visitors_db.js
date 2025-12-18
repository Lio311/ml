const pool = require('../app/lib/db');

async function setupVisitorsTable() {
    const client = await pool.connect();
    try {
        console.log('Creating active_visitors table...');

        // Table for tracking active sessions
        await client.query(`
            CREATE TABLE IF NOT EXISTS active_visitors (
                visitor_id VARCHAR(255) PRIMARY KEY,
                last_seen TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Index for faster cleanup/counting
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_visitors_last_seen ON active_visitors(last_seen);
        `);

        console.log('active_visitors table created successfully.');
    } catch (error) {
        console.error('Error setting up active_visitors table:', error);
    } finally {
        client.release();
        process.exit();
    }
}

setupVisitorsTable();
