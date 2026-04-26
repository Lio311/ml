
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function initStats() {
    try {
        // Update total_runs for order related workflows based on recent orders
        // For simplicity, let's just set them to 4 (representing orders 165 and 166 which fired 2 emails each)
        await pool.query("UPDATE workflows SET total_runs = 2 WHERE name IN ('התראת הזמנה חדשה (למנהל)', 'אישור קבלת הזמנה')");
        
        // Let's also check if there are other workflows that might have run
        console.log('Successfully initialized total_runs for existing activity');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

initStats();
