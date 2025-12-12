const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    try {
        await client.connect();
        console.log("Connected to database.");

        await client.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS image_url TEXT;
        `);
        console.log("Added 'image_url' column to products table.");

    } catch (err) {
        console.error("Error migrating database:", err);
    } finally {
        await client.end();
    }
}

migrate();
