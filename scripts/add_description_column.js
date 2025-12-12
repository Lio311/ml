const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function addDescription() {
    try {
        const client = await pool.connect();

        console.log("Adding 'description' column to 'products' table...");
        await client.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS description TEXT;
        `);

        console.log("Column added successfully or already exists.");
        client.release();
    } catch (err) {
        console.error("Error adding column:", err);
    } finally {
        await pool.end();
    }
}

addDescription();
