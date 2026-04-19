const { Pool } = require('pg');
const pool = new Pool({
    connectionString: "postgresql://postgres:postgres@localhost:5432/postgres", // Default local usually
});

async function checkTables() {
    const client = await pool.connect();
    try {
        const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("Tables:", res.rows.map(r => r.table_name));
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
}
checkTables();
