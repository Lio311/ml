const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => {
  client.query("SELECT id, brand, name, name_he, brand_he, stock, active FROM products WHERE brand ILIKE '%Farmacia%' OR name_he ILIKE '%Farmacia%' OR name ILIKE '%Citrus%'").then(res => {
    console.table(res.rows);
    client.end();
  }).catch(e => {
    console.error(e);
    client.end();
  });
});
