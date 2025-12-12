const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function inspect() {
    try {
        const client = await pool.connect();
        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products';
    `);
        console.log(res.rows);
        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

inspect();
