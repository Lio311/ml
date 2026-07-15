require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    try {
        const now = new Date();
        const year = now.getFullYear();
        const monthNum = now.getMonth() + 1;
        const monthStr = String(monthNum).padStart(2, '0');
        const currentMonth = `${year}-${monthStr}`;

        const res = await pool.query(`
            UPDATE monthly_recommendations 
            SET status = 'selected' 
            WHERE month = $1
            RETURNING *
        `, [currentMonth]);
        
        console.log("Updated record:", res.rows[0]);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

main();
