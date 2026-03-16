const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
      rejectUnauthorized: false
  }
});

async function setup() {
    console.log("Setting up chat database tables...");
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        await client.query(`
            CREATE TABLE IF NOT EXISTS conversations (
                id SERIAL PRIMARY KEY,
                participant1_id VARCHAR(255) NOT NULL,
                participant2_id VARCHAR(255) NOT NULL,
                catalog_id INTEGER REFERENCES user_catalogs(id) ON DELETE CASCADE,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Created conversations table (if it didn't exist).");

        await client.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
                sender_id VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Created messages table (if it didn't exist).");

        await client.query('COMMIT');
        console.log("Chat setup complete.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Failed to setup chat DB:", e);
    } finally {
        client.release();
        await pool.end();
        process.exit();
    }
}

setup();
