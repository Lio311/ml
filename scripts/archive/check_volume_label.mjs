import pkg from 'pg';
const { Client } = pkg;
const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_4clX3WtUfIdw@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
});

async function run() {
  await client.connect();
  const res = await client.query(`SELECT id, name, model, is_discovery_set, volume_label FROM products WHERE volume_label LIKE '%ml%' OR volume_label LIKE '%מ״ל%' LIMIT 20`);
  console.log(res.rows);
  await client.end();
}
run();
