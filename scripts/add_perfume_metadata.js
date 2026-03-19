const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to database.");

        // Add seasons column
        try {
            await client.query('ALTER TABLE products ADD COLUMN seasons TEXT');
            console.log("Added 'seasons' column.");
        } catch (e) {
            console.log("'seasons' column might already exist.");
        }

        // Add perfumers column
        try {
            await client.query('ALTER TABLE products ADD COLUMN perfumers TEXT');
            console.log("Added 'perfumers' column.");
        } catch (e) {
            console.log("'perfumers' column might already exist.");
        }

        // Add country column
        try {
            await client.query('ALTER TABLE products ADD COLUMN country TEXT');
            console.log("Added 'country' column.");
        } catch (e) {
            console.log("'country' column might already exist.");
        }

        console.log("Migration completed successfully.");
    } catch (err) {
        console.error("Migration error:", err);
    } finally {
        await client.end();
    }
}

migrate();
