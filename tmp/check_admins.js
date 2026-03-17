const { Pool } = require('pg');
const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false }
});

async function checkAdmins() {
    const client = await pool.connect();
    try {
        console.log('Fetching users with admin role...');
        const res = await client.query("SELECT id, role, last_active_at FROM users WHERE role = 'admin'");
        console.log('Admins found:', res.rows);
        
        console.log('Current system time:', new Date().toISOString());
        
        const allUsers = await client.query("SELECT id, role, last_active_at FROM users ORDER BY last_active_at DESC LIMIT 5");
        console.log('Most recently active users:', allUsers.rows);
    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

checkAdmins();
