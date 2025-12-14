
const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load .env from root
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function createTable() {
    const client = await pool.connect();
    try {
        await client.query(`
      CREATE TABLE IF NOT EXISTS perfume_requests (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255),
        brand VARCHAR(255) NOT NULL,
        model VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('Table perfume_requests created successfully');
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        client.release();
        pool.end();
    }
}

createTable();
