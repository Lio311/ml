require('dotenv').config({path: '.env.local'});
const {Pool} = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl:{rejectUnauthorized:false}});
pool.query(`
    SELECT DISTINCT p.brand 
    FROM products p 
    LEFT JOIN brands b ON p.brand = b.name 
    WHERE b.name IS NULL
`).then(res => {
    console.log("Brands in products but not in brands table:", res.rows.map(r => r.brand).join(', '));
    process.exit(0);
});
