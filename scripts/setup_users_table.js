require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function setupUsersTable() {
    const client = await pool.connect();
    try {
        console.log('Creating users table...');

        // Table for syncing Clerk users locally
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(255) PRIMARY KEY,
                email VARCHAR(255),
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                role VARCHAR(50) DEFAULT 'customer',
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Index for faster date queries (for charts)
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
        `);

        console.log('users table created successfully.');
    } catch (error) {
        console.error('Error setting up users table:', error);
    } finally {
        client.release();
        process.exit();
    }
}

setupUsersTable();
