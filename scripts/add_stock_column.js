const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        const client = await pool.connect();

        console.log("Checking if 'stock' column exists in 'products' table...");

        // Check if column exists
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='products' AND column_name='stock';
        `);

        if (res.rows.length === 0) {
            console.log("Adding 'stock' column...");
            await client.query(`
                ALTER TABLE products 
                ADD COLUMN stock INTEGER DEFAULT 0;
            `);
            console.log("Column 'stock' added successfully.");
        } else {
            console.log("Column 'stock' already exists.");
        }

        client.release();
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}

migrate();
