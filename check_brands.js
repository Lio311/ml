require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT DISTINCT brand FROM products WHERE is_discovery_set = true OR category ILIKE '%Discovery Set%'")
    .then(res => { console.log(res.rows); pool.end(); })
    .catch(e => console.log(e));
