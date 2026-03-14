
import pool from "../../../lib/db";

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("Checking for 'phone' column in 'users' table...");
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'phone'
        `);

        if (res.rows.length === 0) {
            console.log("Adding 'phone' column to 'users' table...");
            await client.query(`ALTER TABLE users ADD COLUMN phone TEXT`);
            console.log("Column added successfully.");
        } else {
            console.log("Column 'phone' already exists.");
        }
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
