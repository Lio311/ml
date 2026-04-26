const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.query(`SELECT name, nodes FROM workflows WHERE name LIKE '%תגמול%' OR name LIKE '%אישור%'`).then(res => {
    res.rows.forEach(r => {
        console.log(`\n=== ${r.name} ===`);
        console.log(JSON.stringify(r.nodes, null, 2));
    });
    pool.end();
}).catch(console.error);
