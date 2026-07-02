require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
    try {
        const orderRes = await pool.query(`SELECT id, status, created_at, customer_details FROM orders WHERE id IN (185, 188, 190, 191, 192)`);
        console.log("Orders:", orderRes.rows);
        const recRes = await pool.query(`SELECT order_id, status FROM pending_recommendation_emails WHERE order_id IN (185, 188, 190, 191, 192)`);
        console.log("Pending Recs:", recRes.rows);
    } catch(e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
