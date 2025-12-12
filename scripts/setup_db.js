const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function setup() {
    try {
        await client.connect();
        console.log("Connected to database.");

        // Products Table
        await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        price_10ml INTEGER DEFAULT 0,
        price_5ml INTEGER DEFAULT 0,
        price_2ml INTEGER DEFAULT 0,
        has_image BOOLEAN DEFAULT FALSE,
        is_limited BOOLEAN DEFAULT FALSE,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log("Created/Verified 'products' table.");

        // Orders Table
        await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_details JSONB,
        total_amount INTEGER,
        status TEXT DEFAULT 'pending', 
        items JSONB,
        free_samples_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log("Created/Verified 'orders' table.");

    } catch (err) {
        console.error("Error setting up database:", err);
    } finally {
        await client.end();
    }
}

setup();
