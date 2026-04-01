const { Pool } = require('pg');

const DATABASE_URL = "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    const client = await pool.connect();
    try {
        // Check one order to understand the items structure
        const sample = await client.query(`SELECT items FROM orders WHERE items IS NOT NULL LIMIT 2`);
        console.log('Sample order items:');
        sample.rows.forEach(r => console.log(JSON.stringify(r.items, null, 2)));

        // Try to get top sellers by product name (simpler approach)
        const topSellers = await client.query(`
            SELECT item->>'name' as name, item->>'brand' as brand,
                   SUM((item->>'quantity')::int) as total_qty,
                   COUNT(*) as order_count
            FROM orders o, jsonb_array_elements(o.items::jsonb) AS item
            WHERE o.status != 'cancelled' AND o.items IS NOT NULL
            GROUP BY item->>'name', item->>'brand'
            ORDER BY total_qty DESC
            LIMIT 15
        `);
        console.log('\n=== TOP SELLERS (by quantity) ===');
        topSellers.rows.forEach((r, i) => {
            console.log(`${i+1}. ${r.brand || ''} ${r.name} — ${r.total_qty} units (${r.order_count} orders)`);
        });

        // Get top brands
        const topBrands = await client.query(`
            SELECT item->>'brand' as brand,
                   SUM((item->>'quantity')::int) as total_qty,
                   COUNT(DISTINCT o.id) as unique_orders
            FROM orders o, jsonb_array_elements(o.items::jsonb) AS item
            WHERE o.status != 'cancelled' AND o.items IS NOT NULL
            GROUP BY item->>'brand'
            ORDER BY total_qty DESC
            LIMIT 10
        `);
        console.log('\n=== TOP BRANDS ===');
        topBrands.rows.forEach((r, i) => {
            console.log(`${i+1}. ${r.brand || 'Unknown'} — ${r.total_qty} units across ${r.unique_orders} orders`);
        });

        // Get total order count
        const totalOrders = await client.query(`SELECT COUNT(*) FROM orders WHERE status != 'cancelled'`);
        console.log(`\nTotal completed orders: ${totalOrders.rows[0].count}`);

    } catch (e) {
        console.error('Error:', e.message, e.stack);
    } finally {
        client.release();
        process.exit();
    }
}

main();
