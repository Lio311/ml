const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'coupons';
    `);
        console.log('Coupons Table Columns:', res.rows.map(r => r.column_name));
    } catch (e) {
        console.error('Error checking schema:', e);
    } finally {
        client.release();
        pool.end();
    }
}

checkSchema();
