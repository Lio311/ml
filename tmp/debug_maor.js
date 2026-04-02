const pool = require('../app/lib/db.js').default;

async function debugMaor() {
    try {
        console.log('--- Searching for User ---');
        const userRes = await pool.query(`
            SELECT id, first_name, last_name, email, phone 
            FROM users 
            WHERE last_name ILIKE '%לנציאנו%' 
               OR last_name ILIKE '%Lanziano%'
               OR first_name ILIKE '%מאור%'
               OR first_name ILIKE '%Maor%'
        `);
        console.log('Users found:', userRes.rows);

        if (userRes.rows.length === 0) {
            console.log('No user found matching Maor Lanziano in the users table.');
        } else {
            for (const user of userRes.rows) {
                console.log(`\n--- Checking Orders for User: ${user.first_name} ${user.last_name} (${user.email}) ---`);
                const orderRes = await pool.query(`
                    SELECT id, customer_details->>'email' as customer_email, customer_details->>'clerk_id' as clerk_id, customer_details->>'phone' as phone, catalog_id
                    FROM orders 
                    WHERE customer_details->>'email' = $1 
                       OR customer_details->>'clerk_id' = $2
                    LIMIT 10
                `, [user.email, user.id]);
                
                console.log(`Orders found for ${user.id}:`, orderRes.rows);
            }
        }

    } catch (e) {
        console.error('Debug Error:', e);
    } finally {
        process.exit();
    }
}

debugMaor();
