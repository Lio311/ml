require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function debugCoupons() {
    try {
        const res = await pool.query('SELECT code, limitations, created_at FROM coupons ORDER BY created_at DESC LIMIT 5');
        console.log("=== LATEST COUPONS ===");
        res.rows.forEach(c => {
            console.log(`Code: ${c.code}`);
            console.log(`Type of limitations: ${typeof c.limitations}`);
            console.log(`Limitations:`, JSON.stringify(c.limitations, null, 2)); // Use JSON.stringify to see structure clearly
            console.log("--------------------------------------------------");
        });
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

debugCoupons();
