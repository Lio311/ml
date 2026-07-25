const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => {
  client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'products'").then(res => {
    console.table(res.rows);
    client.end();
  }).catch(e => {
    console.error(e);
    client.end();
  });
});
