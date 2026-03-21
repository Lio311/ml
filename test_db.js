const { Client } = require('pg'); 
require('dotenv').config({path: '.env.local'}); 
const client = new Client({ connectionString: process.env.DATABASE_URL }); 
client.connect()
  .then(() => client.query("SELECT id, name, brand, price_2ml, price_5ml, price_10ml FROM products WHERE brand ILIKE '%roja%' OR name ILIKE '%velay%'"))
  .then(res => { console.table(res.rows); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });
