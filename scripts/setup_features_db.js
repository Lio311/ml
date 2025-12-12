const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function setup() {
    try {
        const client = await pool.connect();

        console.log("Creating 'reviews' table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, product_id)
            );
        `);

        console.log("Creating 'wishlist' table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS wishlist (
                id SERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(user_id, product_id)
            );
        `);

        console.log("Tables created successfully.");
        client.release();
    } catch (err) {
        console.error("Error creating tables:", err);
    } finally {
        await pool.end();
    }
}

setup();
