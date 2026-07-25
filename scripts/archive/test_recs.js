require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function main() {
    const res = await pool.query("SELECT id, created_at, status FROM orders WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '30 days' ORDER BY created_at DESC");
    console.log('Completed orders in last 30 days:', res.rows.length);
    const pending = await pool.query("SELECT id, order_id, status FROM pending_recommendation_emails");
    console.log('Total pending recommendations:', pending.rows.length);
    const missed = await pool.query("SELECT id FROM orders WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '30 days' AND id NOT IN (SELECT order_id FROM pending_recommendation_emails)");
    console.log('Missed completed orders:', missed.rows.length);
    process.exit(0);
}
main();
