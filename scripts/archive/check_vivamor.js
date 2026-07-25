require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT id, model FROM products WHERE brand ILIKE '%Vivamor%'")
    .then(res => { console.log(res.rows); pool.end(); })
    .catch(e => console.log(e));
