
const { Pool } = require('pg');

async function checkRecovery() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    const client = await pool.connect();
    try {
        console.log("--- CHECKING FOR recovery_logs or similar ---");
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.table(tables.rows);

        // If recovery_logs exists, check content
        if (tables.rows.some(t => t.table_name === 'recovery_logs')) {
             const logs = await client.query('SELECT * FROM recovery_logs ORDER BY sent_at DESC LIMIT 5');
             console.log("Recent Recovery Logs:");
             console.table(logs.rows);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        client.release();
        await pool.end();
        process.exit();
    }
}

checkRecovery();
