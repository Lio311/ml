import pool from '../app/lib/db.js';

async function checkSync() {
    try {
        const res = await pool.query(`
            SELECT id, customer_details 
            FROM orders 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        console.log('--- RECENT ORDERS ---');
        res.rows.forEach(row => {
            console.log(`Order #${row.id}:`, JSON.stringify(row.customer_details, null, 2));
        });
    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit();
    }
}

checkSync();
