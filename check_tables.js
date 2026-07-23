require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

Promise.all([
    pool.query(`
        SELECT 
            poe.order_id, poe.process_at, poe.created_at, poe.initial_status,
            o.customer_details->>'email' as recipient, 
            o.customer_details->>'name' as customer_name
        FROM pending_order_emails poe
        JOIN orders o ON o.id = poe.order_id
        WHERE poe.initial_status = 'pending'
        ORDER BY poe.process_at ASC
        LIMIT 1
    `),
    pool.query(`
        SELECT 
            pre.id, pre.created_at, pre.suggested_products,
            u.email as recipient, u.first_name, u.last_name
        FROM pending_recommendation_emails pre
        LEFT JOIN users u ON u.id = pre.user_id
        WHERE pre.status = 'pending'
        ORDER BY pre.created_at ASC
        LIMIT 1
    `),
    pool.query(`
        SELECT 
            id, title, subject, scheduled_at, recipient_type, recipients, content_html
        FROM email_campaigns
        WHERE status = 'scheduled'
        ORDER BY scheduled_at ASC
        LIMIT 1
    `)
]).then(res => {
    console.log("All queries succeeded.");
    process.exit(0);
}).catch(err => {
    console.error("SQL Error:", err.message);
    process.exit(1);
});
