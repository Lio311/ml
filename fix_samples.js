require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL + '?sslmode=require' });

async function fixOrders() {
    let balancedSamples = 0;
    try {
        const res = await pool.query(`SELECT id, total_amount, free_samples_count FROM orders WHERE catalog_id IS NULL AND status != 'cancelled'`);
        
        for (const row of res.rows) {
            let expected = 0;
            if (row.total_amount >= 1000) expected = 6;
            else if (row.total_amount >= 500) expected = 4;
            else if (row.total_amount >= 300) expected = 2;
            
            if (row.free_samples_count !== expected) {
                console.log(`Fixing Order ${row.id}: has ${row.free_samples_count}, expected ${expected}`);
                const difference = row.free_samples_count - expected;
                
                await pool.query(`UPDATE orders SET free_samples_count = $1 WHERE id = $2`, [expected, row.id]);
                
                if (difference > 0) {
                    balancedSamples += difference;
                } else {
                    balancedSamples += difference;
                }
            }
        }
        
        if (balancedSamples !== 0) {
            console.log(`Balancing bottle_inventory by adding ${balancedSamples} to size 2...`);
            await pool.query(`UPDATE bottle_inventory SET quantity = quantity + $1 WHERE size = 2`, [balancedSamples]);
        }
        
        console.log('Done!');
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

fixOrders();
