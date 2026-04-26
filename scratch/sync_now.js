
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function update() {
    try {
        await pool.query("UPDATE workflows SET last_run = NOW() WHERE name IN ('התראת הזמנה חדשה (למנהל)', 'אישור קבלת הזמנה')");
        console.log('Successfully updated last_run for orders');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

update();
