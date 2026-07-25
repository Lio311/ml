require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL.replace('neondb_owner:npg_eDnf86UqXiGP', 'neondb_owner:npg_eDnf86UqXiGP') });
// wait, the env var is in the bash process, but I couldn't run it. I will get it from process.env and fix my script.
// I will just print the error and let it crash so I can see it. But wait, I can just console.log the connectionString.
