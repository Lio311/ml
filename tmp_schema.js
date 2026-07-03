import pool from './lib/db.js';

async function check() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);
        console.log(res.rows);
    } finally {
        client.release();
    }
}
check();
