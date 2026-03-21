const { Client } = require('pg'); 
require('dotenv').config({path: '.env.local'}); 
const client = new Client({ connectionString: process.env.DATABASE_URL }); 

const wikimediaLogo = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Arabian_Oud_logo.png/512px-Arabian_Oud_logo.png';

async function update() {
  await client.connect();
  console.log(`Updating Arabian Oud logo to Wikimedia...`);
  await client.query(
    `UPDATE brands SET logo_url = $1 WHERE name = 'Arabian Oud'`,
    [wikimediaLogo]
  );
  console.log('Update complete!');
  process.exit(0);
}

update().catch(err => {
  console.error(err);
  process.exit(1);
});
