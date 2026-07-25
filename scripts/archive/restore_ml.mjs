import pkg from 'pg';
const { Client } = pkg;
const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_4clX3WtUfIdw@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
});

async function run() {
  await client.connect();
  const res = await client.query(`UPDATE products SET volume_label = replace(volume_label, ' ml', ' מ״ל') WHERE volume_label LIKE '% ml%' RETURNING id, model, volume_label`);
  console.log("Updated", res.rowCount, "products");
  console.log(res.rows);
  
  await client.end();
}
run();
