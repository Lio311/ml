const { Pool } = require('pg');
require('dotenv').config({path: '.env.local'});
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT value FROM site_settings WHERE key = 'home_banner'")
    .then(res => { 
        console.log(res.rows[0].value[0].contentEn); 
        process.exit(0); 
    })
    .catch(e => { 
        console.error(e); 
        process.exit(1); 
    });
