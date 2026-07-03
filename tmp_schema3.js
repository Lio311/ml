const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function check() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);
        console.log("Users Table Columns:");
        console.table(res.rows);
    } catch(err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
check();
