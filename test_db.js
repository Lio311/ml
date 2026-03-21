const { Client } = require('pg'); 
require('dotenv').config({path: '.env.local'}); 
const client = new Client({ connectionString: process.env.DATABASE_URL }); 
client.connect()
  .then(() => client.query("SELECT DISTINCT brand FROM products WHERE brand ILIKE '%roja%'"))
  .then(res => { console.dir(res.rows); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });
