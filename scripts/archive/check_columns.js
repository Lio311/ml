require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'orders'").then(res => {
    console.log(res.rows.map(r => r.column_name));
    process.exit(0);
});
