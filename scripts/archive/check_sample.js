require('dotenv').config({path: '.env.local'});
const {Pool} = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl:{rejectUnauthorized:false}});
pool.query("SELECT name, description, highlights FROM brands WHERE name NOT IN ('BORNTOSTANDOUT', 'The Lab') LIMIT 10").then(res => {
    console.log(res.rows);
    process.exit(0);
});
