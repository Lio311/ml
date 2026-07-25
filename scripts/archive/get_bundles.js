const { Pool } = require('pg');
const pool = new Pool({connectionString: 'postgresql://neondb_owner:npg_7r2XpDcfwGih@ep-jolly-hat-a2t6ndp5-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require'});
pool.query("SELECT value FROM site_settings WHERE key = 'bundles_config'")
.then(r => { console.log(JSON.stringify(r.rows[0].value, null, 2)); pool.end(); })
.catch(console.error);
