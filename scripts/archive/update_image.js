require('dotenv').config({path: '.env.local'});
const {Pool} = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL});

const newUrl = 'https://www.ml-tlv.com/logo_v5.png'; // Fallback image for now

pool.query(`UPDATE products SET image_url = $1 WHERE id = 248`, [newUrl])
  .then(() => {
    console.log("Updated image to " + newUrl);
    pool.end();
  }).catch(console.error);
