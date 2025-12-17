const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    const client = await pool.connect();
    try {
        console.log('Creating shared_carts table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS shared_carts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        items JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days')
      );
    `);
        console.log('Table created successfully.');
    } catch (e) {
        console.error('Error creating table:', e);
    } finally {
        client.release();
        pool.end();
    }
}

main();
