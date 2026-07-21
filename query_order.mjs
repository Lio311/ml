import pkg from 'pg';
const { Client } = pkg;
const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_4clX3WtUfIdw@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT * FROM orders WHERE id = $1", [233]);
  if (res.rows.length > 0) {
     console.log("Order 233:");
     console.log(JSON.stringify(res.rows[0], null, 2));
  } else {
     console.log("Order 233 not found.");
  }
  await client.end();
}
run().catch(console.error);
