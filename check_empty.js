require('dotenv').config({path: '.env.local'});
const {Pool} = require('pg');
const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl:{rejectUnauthorized:false}});
pool.query("SELECT name, description, highlights, perfumer FROM brands").then(res => {
    const emptyDesc = res.rows.filter(b => !b.description || b.description.trim() === '' || b.description.length < 20);
    const emptyHi = res.rows.filter(b => !b.highlights || b.highlights.trim() === '');
    const emptyPerf = res.rows.filter(b => !b.perfumer || b.perfumer.trim() === '');
    console.log("Empty description:", emptyDesc.map(b => b.name).join(', '));
    console.log("Empty highlights:", emptyHi.map(b => b.name).join(', '));
    console.log("Empty perfumer:", emptyPerf.map(b => b.name).join(', '));
    process.exit(0);
});
