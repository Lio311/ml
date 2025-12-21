const { Pool } = require('pg');

// Hardcoded for diagnosis to bypass environment setup issues
const DATABASE_URL = "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function diagnoseUsersTable() {
    const client = await pool.connect();

    try {
        console.log('=== DIAGNOSING USERS TABLE ===\n');

        // 1. Check table structure
        console.log('1. TABLE STRUCTURE:');
        const structure = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `);
        console.table(structure.rows);

        // 2. Count total users
        console.log('\n2. TOTAL USERS:');
        const count = await client.query('SELECT COUNT(*) FROM users');
        console.log(`Total: ${count.rows[0].count}`);

        // 3. Sample data
        console.log('\n3. SAMPLE DATA (first 5 users):');
        const sample = await client.query('SELECT * FROM users LIMIT 5');
        console.table(sample.rows);

        // 4. Check dates
        console.log('\n4. DATE ANALYSIS:');
        const dates = await client.query(`
            SELECT 
                created_at,
                EXTRACT(MONTH FROM created_at) as month,
                EXTRACT(DAY FROM created_at) as day,
                EXTRACT(YEAR FROM created_at) as year
            FROM users 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        console.table(dates.rows);

        // 5. Try the actual query from admin page
        console.log('\n5. TESTING ACTUAL QUERY (December 2025):');
        try {
            const testQuery = await client.query(`
                SELECT 
                    EXTRACT(DAY FROM created_at)::int as day,
                    COUNT(*)::int as count
                FROM users
                WHERE EXTRACT(MONTH FROM created_at) = $1
                AND EXTRACT(YEAR FROM created_at) = $2
                GROUP BY day
                ORDER BY day
            `, [12, 2025]);
            console.log('✅ Query succeeded!');
            console.table(testQuery.rows);
        } catch (err) {
            console.log('❌ Query failed:', err.message);
        }

        console.log('\n=== DIAGNOSIS COMPLETE ===');

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

diagnoseUsersTable();
