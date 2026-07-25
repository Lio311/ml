import pkg from 'pg';
const { Client } = pkg;
const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_4clX3WtUfIdw@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
});

async function run() {
  await client.connect();
  const res = await client.query(`SELECT id, model, volume_label FROM products WHERE active = true AND stock > 0 AND show_on_home = true ORDER BY created_at DESC LIMIT 6`);
  console.log(res.rows);
  await client.end();
}
run();
