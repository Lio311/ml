const { Client } = require('pg'); 
require('dotenv').config({path: '.env.local'}); 
const client = new Client({ connectionString: process.env.DATABASE_URL }); 
const prods = [
  'Boadicea the Victorious Blue Sapphire Supercharged',
  'Frederic Malle Acne Studios',
  'Mayhap Amant Numérique',
  'Farmacia SS. Annunziata Sparkling Notturno'
];
client.connect()
  .then(() => client.query("SELECT name, description FROM products WHERE name = ANY($1)", [prods]))
  .then(res => { console.dir(res.rows, {depth: null}); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });
