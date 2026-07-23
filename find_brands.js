require('dotenv').config({path: '.env.local'});
const {Pool} = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl:{rejectUnauthorized:false}});
pool.query('SELECT name, description, highlights, perfumer FROM brands ORDER BY name ASC').then(res => {
    const needingEnrichment = res.rows.filter(b => !b.description || b.description.length < 50 || !b.highlights || !b.perfumer);
    console.log("Brands needing enrichment:", needingEnrichment.map(b => b.name).join(', '));
    process.exit(0);
});
