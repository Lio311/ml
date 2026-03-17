const { Pool } = require('pg');
const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false }
});

async function checkUsers() {
    const client = await pool.connect();
    try {
        console.log('Checking users table schema...');
        const res = await client.query("SELECT column_name, column_default, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position");
        console.log('Columns in users table:', res.rows);
    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

checkUsers();
