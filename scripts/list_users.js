
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function listUsers() {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT id, first_name, last_name, email, created_at FROM users ORDER BY created_at DESC');
        console.log("Current Users in DB:");
        console.table(res.rows.map(u => ({
            Name: `${u.first_name || ''} ${u.last_name || ''}`,
            Email: u.email,
            Created: u.created_at
        })));
    } catch (err) {
        console.error("Query failed", err);
    } finally {
        client.release();
        pool.end();
    }
}

listUsers();
