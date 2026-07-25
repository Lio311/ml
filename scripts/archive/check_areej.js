const { Client } = require('pg'); 
require('dotenv').config({path: '.env.local'}); 
const client = new Client({ connectionString: process.env.DATABASE_URL }); 

async function check() {
  await client.connect();
  const res = await client.query("SELECT name, logo_url, description FROM brands WHERE name ILIKE '%Areej%'");
  console.log(JSON.stringify(res.rows, null, 2));
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
