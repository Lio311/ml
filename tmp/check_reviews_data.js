const { Pool } = require('pg');
const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false }
});

async function checkReviewsData() {
    const client = await pool.connect();
    try {
        console.log('Checking reviews data...');
        const res = await client.query("SELECT * FROM reviews");
        console.log('Reviews in DB:', res.rows);
    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

checkReviewsData();
