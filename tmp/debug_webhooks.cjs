
const { Pool } = require('pg');

async function debugWebhooks() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    const client = await pool.connect();
    try {
        console.log("--- CHECKING NOTIFICATIONS ---");
        const notifs = await client.query(`
            SELECT * FROM notifications 
            WHERE type = 'user' 
            ORDER BY created_at DESC 
            LIMIT 10
        `);
        console.table(notifs.rows);

        console.log("--- CHECKING LATEST USERS ---");
        const users = await client.query(`
            SELECT id, email, created_at FROM users 
            ORDER BY created_at DESC 
            LIMIT 10
        `);
        console.table(users.rows);

        console.log("--- CHECKING FOR CLERK_WEBHOOK_SECRET (Placeholder check) ---");
        // I can't see the secret directly but I can check if common env vars are missing if I were running on the server.
        // Locally I don't have it.
    } catch (err) {
        console.error("Error:", err);
    } finally {
        client.release();
        await pool.end();
        process.exit();
    }
}

debugWebhooks();
