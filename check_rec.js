require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query("SELECT * FROM monthly_recommendations WHERE month = '2026-07'")
    .then(res => {
        console.log(res.rows);
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
