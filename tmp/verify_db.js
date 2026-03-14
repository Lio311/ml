const pool = require('./app/lib/db');

async function verify() {
    try {
        const res = await pool.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
        console.log("Tables found:", res.rows.map(r => r.tablename));
        
        const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'abandoned_carts'");
        console.log("Columns in abandoned_carts:", cols.rows);
    } catch (err) {
        console.error("Verification error:", err);
    } finally {
        process.exit(0);
    }
}

verify();
