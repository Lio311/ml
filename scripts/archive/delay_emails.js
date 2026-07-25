require('dotenv').config({path: '.env.local'});
const {Pool} = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl:{rejectUnauthorized:false}});

// Set last_marketing_email_date to today so the system thinks it already sent one
const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' }); // e.g. "2026-07-23"
const jsonValue = JSON.stringify(todayStr); // '"2026-07-23"'

pool.query(`
    INSERT INTO site_settings (key, value) 
    VALUES ('last_marketing_email_date', $1) 
    ON CONFLICT (key) 
    DO UPDATE SET value = $1
`, [jsonValue]).then(() => {
    console.log(`Set last_marketing_email_date to ${jsonValue}`);
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
