const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting migration...');
        await client.query('BEGIN');

        // Add discount_percentage
        await client.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0
        `);

        // Add discount_sizes
        await client.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS discount_sizes TEXT[] DEFAULT '{}'
        `);

        await client.query('COMMIT');
        console.log('Migration completed successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
