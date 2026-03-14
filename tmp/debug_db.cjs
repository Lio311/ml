
const { Pool } = require('pg');

async function checkDb() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    const client = await pool.connect();
    try {
        console.log("--- TABLE SCHEMA: users ---");
        const schema = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'users'
        `);
        console.table(schema.rows);

        console.log("--- CONSTRAINTS: users ---");
        const constraints = await client.query(`
            SELECT conname, contype, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE conrelid = 'users'::regclass
        `);
        console.table(constraints.rows);

        console.log("--- DATA SAMPLE: users (with phone) ---");
        const data = await client.query(`
            SELECT id, email, phone, role FROM users LIMIT 10
        `);
        console.table(data.rows);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        client.release();
        await pool.end();
        process.exit();
    }
}

checkDb();
