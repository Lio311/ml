
const { Pool } = require('pg');

async function backfill() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    const client = await pool.connect();
    try {
        console.log("Starting backfill of phone numbers from orders...");
        
        // Find all orders that have a phone number in customer_details
        const res = await client.query(`
            SELECT DISTINCT 
                (customer_details->>'email') as email, 
                (customer_details->>'phone') as phone 
            FROM orders 
            WHERE customer_details->>'phone' IS NOT NULL 
              AND customer_details->>'phone' != ''
        `);

        console.log(`Found ${res.rows.length} unique emails with phone numbers in orders.`);

        for (const row of res.rows) {
            const { email, phone } = row;
            console.log(`Updating user ${email} with phone ${phone}...`);
            await client.query(`
                UPDATE users 
                SET phone = $1 
                WHERE email = $2 AND (phone IS NULL OR phone = '')
            `, [phone, email]);
        }

        console.log("Backfill completed.");
    } catch (err) {
        console.error("Backfill failed:", err);
    } finally {
        client.release();
        await pool.end();
        process.exit();
    }
}

backfill();
