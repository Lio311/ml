require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkSchema() {
    if (!process.env.DATABASE_URL) { require('dotenv').config(); }
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    const client = await pool.connect();
    try {
        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products';
    `);
        console.log('Current Columns:', res.rows.map(r => r.column_name).join(', '));
    } finally {
        client.release();
        pool.end();
    }
}
checkSchema();
