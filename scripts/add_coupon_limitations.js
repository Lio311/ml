const { Pool } = require('pg');
require('dotenv').config({ path: './.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function addLimitationsColumn() {
    try {
        const client = await pool.connect();
        console.log("Connected to DB...");

        await client.query(`
      ALTER TABLE coupons 
      ADD COLUMN IF NOT EXISTS limitations JSONB DEFAULT NULL;
    `);

        console.log("Added 'limitations' column successfully! 🎫");
        client.release();
    } catch (err) {
        console.error("Error updating DB:", err);
    } finally {
        pool.end();
    }
}

addLimitationsColumn();
