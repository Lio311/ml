import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function updateStatus() {
    try {
        const res = await pool.query(`
            UPDATE pending_recommendation_emails p
            SET status = 'approved'
            FROM orders o
            WHERE p.order_id = o.id
            AND o.customer_details->>'email' ILIKE '%liortsafrir%'
            AND p.status = 'sent'
            RETURNING p.id, o.customer_details->>'email' as email
        `);
        console.log('Updated rows:', res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

updateStatus();
