require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT id, status FROM orders WHERE id IN (185, 188, 190, 191, 192)').then(res => {
    console.log(res.rows);
    process.exit(0);
});
