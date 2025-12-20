require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function diagnose() {
    const client = await pool.connect();
    try {
        console.log("--- DIAGNOSIS START ---");

        // 1. Check Table Count
        const countRes = await client.query('SELECT COUNT(*) FROM users');
        console.log("Total Users in DB:", countRes.rows[0].count);

        // 2. Check Raw Data
        const res = await client.query('SELECT created_at FROM users ORDER BY created_at DESC LIMIT 5');
        console.log("Top 5 Recent Users:");

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        console.log(`Server Target Date: ${month}/${year}`);

        res.rows.forEach(row => {
            console.log("----------------");
            console.log("Raw from DB:", row.created_at, "Type:", typeof row.created_at);

            const date = new Date(row.created_at);
            console.log("Parsed JS Date:", date.toString());

            const dYear = date.getFullYear();
            const dMonth = date.getMonth() + 1;
            const dDay = date.getDate();

            console.log(`Extracted: Day=${dDay}, Month=${dMonth}, Year=${dYear}`);
            console.log(`Matches Target (${month}/${year})?`, (dYear === year && dMonth === month) ? "YES" : "NO");
        });

        console.log("--- DIAGNOSIS END ---");

    } catch (err) {
        console.error("Diagnosis failed:", err);
    } finally {
        client.release();
        process.exit();
    }
}

diagnose();
