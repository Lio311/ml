require('dotenv').config({path: '.env.local'});
const {Pool} = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl:{rejectUnauthorized:false}});

const modelsToUpdate = ['California Love', 'Pina Colada', 'Midnight Rio'];

pool.query(`
    UPDATE products 
    SET perfume_email_sent = true 
    WHERE brand = 'Memoirs Of A Perfume Collector' 
    AND model = ANY($1)
`, [modelsToUpdate]).then(res => {
    console.log(`Updated ${res.rowCount} products to perfume_email_sent = true.`);
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
