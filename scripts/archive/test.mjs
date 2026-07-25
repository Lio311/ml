import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config({path: '.env.local'});
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

pool.query("SELECT content_html FROM email_templates WHERE slug = 'new_perfumes_batch'")
    .then(res => console.log(res.rows[0]?.content_html.substring(0, 500) || 'NOT FOUND'))
    .catch(err => console.error(err))
    .finally(() => process.exit(0));
