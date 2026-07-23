const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL || require('dotenv').config({path: '.env.local'}).parsed.DATABASE_URL });
client.connect().then(() => {
  return client.query("DELETE FROM site_settings WHERE key = 'last_marketing_email_date'");
}).then(() => {
  console.log('Deleted rate limit');
  client.end();
});
