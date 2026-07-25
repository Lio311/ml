require('dotenv').config({path: '.env.local'});
const {Pool} = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl:{rejectUnauthorized:false}});
pool.query('SELECT name FROM brands').then(res => {
    console.log("All brands:", res.rows.map(b => b.name).join(', '));
    process.exit(0);
});
