const { Client } = require('pg'); 
require('dotenv').config({path: '.env.local'}); 
const client = new Client({ connectionString: process.env.DATABASE_URL }); 
const brands = ['Clive Christian', 'Frederic Malle', 'Maison Francis Kurkdjian', 'Parfums de Marly', 'Elixir Privé'];
client.connect()
  .then(() => client.query("SELECT name, title, description, highlights, perfumer FROM brands WHERE name = ANY($1)", [brands]))
  .then(res => { console.dir(res.rows, {depth: null}); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });
