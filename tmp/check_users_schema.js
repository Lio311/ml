const pool = require('./app/lib/db');

async function checkSchema() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        `);
        console.log('Users table columns:');
        console.table(res.rows); // Simplified output
        
        const sample = await pool.query('SELECT * FROM users LIMIT 1');
        console.log('\nSample user row:');
        console.log(sample.rows[0]);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
