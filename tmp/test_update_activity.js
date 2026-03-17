const { Pool } = require('pg');
const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false }
});

async function testUpdate() {
    const userId = 'user_36zzhV707RK9XJWXVohCTBP8Yfy';
    console.log(`Testing updateUserActivity for ${userId}...`);
    try {
        const res = await pool.query(`
            INSERT INTO users (id, last_active_at)
            VALUES ($1, NOW())
            ON CONFLICT (id) 
            DO UPDATE SET last_active_at = NOW()
            RETURNING id, last_active_at
        `, [userId]);
        console.log('Update result:', res.rows[0]);
    } catch (err) {
        console.error('Update failed:', err);
    } finally {
        await pool.end();
    }
}

testUpdate();
