require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT id, brand, model, volume_label, volume_label_en, is_discovery_set FROM products WHERE is_discovery_set = true OR category ILIKE '%Discovery Set%'")
    .then(res => { console.log(res.rows); pool.end(); })
    .catch(e => console.log(e));
