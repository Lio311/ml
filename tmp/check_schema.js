const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkSchema() {
    try {
        const prodRes = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products'");
        console.log("--- Products Columns ---");
        prodRes.rows.forEach(col => console.log(`${col.column_name}: ${col.data_type}`));

        const brandRes = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'brands'");
        console.log("--- Brands Columns ---");
        brandRes.rows.forEach(col => console.log(`${col.column_name}: ${col.data_type}`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
