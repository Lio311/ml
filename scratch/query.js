const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_4clX3WtUfIdw@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  });
  await client.connect();
  try {
    const tables = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
    console.log("Tables:");
    console.log(tables.rows.map(r => r.table_name));
    
    const items = await client.query(`SELECT * FROM order_items WHERE order_id = 257`);
    console.log("Order Items for order 257:", items.rows);
  } catch (e) {
    console.error(e);
  }
  await client.end();
}
run();
