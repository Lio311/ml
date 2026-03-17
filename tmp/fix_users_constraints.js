const { Pool } = require('pg');
const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false }
});

async function fix() {
    const client = await pool.connect();
    try {
        console.log('Fixing users table constraints...');
        
        // Add default for created_at
        await client.query('ALTER TABLE users ALTER COLUMN created_at SET DEFAULT NOW()');
        
        // Also ensure role has a default 'customer' to avoid other constraint issues
        await client.query("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'customer'");
        
        console.log('Successfully updated users table schema.');
        
        // Test update again
        const userId = 'user_36zzhV707RK9XJWXVohCTBP8Yfy';
        const res = await client.query(`
            INSERT INTO users (id, last_active_at)
            VALUES ($1, NOW())
            ON CONFLICT (id) 
            DO UPDATE SET last_active_at = NOW()
            RETURNING id, last_active_at
        `, [userId]);
        console.log('Test update result:', res.rows[0]);
        
    } catch (err) {
        console.error('Fix failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

fix();
