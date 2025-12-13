require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function ensureStockColumn() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL is missing from .env.local');
        // Try .env if .env.local fails or implies different setups
        require('dotenv').config();
        if (!process.env.DATABASE_URL) process.exit(1);
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    try {
        console.log('Checking for stock column...');
        const checkRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'stock';
    `);

        if (checkRes.rows.length === 0) {
            console.log('⚠️ Stock column missing. Adding it now...');
            await client.query(`ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0;`);
            console.log('✅ Stock column added successfully.');
        } else {
            console.log('✅ Stock column already exists.');
        }
    } catch (err) {
        console.error('Error ensuring stock column:', err);
    } finally {
        client.release();
        pool.end();
    }
}

ensureStockColumn();
