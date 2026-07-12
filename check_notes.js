const pool = require('./app/lib/db');

async function main() {
    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products'");
        console.log(res.rows.filter(r => r.column_name.includes('notes')));
    } finally {
        process.exit(0);
    }
}
main();
