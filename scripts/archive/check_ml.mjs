import pkg from 'pg';
const { Client } = pkg;
const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_4clX3WtUfIdw@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
});

async function run() {
  await client.connect();
  const res = await client.query(`SELECT id, model, volume_label FROM products WHERE volume_label LIKE '%ml%'`);
  console.log(res.rows);
  
  // also check if any products have volume_label exactly '2 ml' or '5 ml' or '10 ml'
  // and we can generate the UPDATE statement
  await client.end();
}
run();
