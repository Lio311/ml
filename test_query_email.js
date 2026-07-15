require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT * FROM email_logs WHERE subject LIKE '%סיכום אימיילים יומי%' OR subject LIKE '%סיכום יומי%' ORDER BY sent_at DESC LIMIT 10")
    .then(res => {
        console.log('Daily summary emails:', res.rows);
    })
    .catch(console.error)
    .finally(() => pool.end());
