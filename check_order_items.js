import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false }
});

async function checkOrderItems() {
    try {
        const { rows } = await pool.query('SELECT items FROM orders LIMIT 1');
        if (rows.length > 0) {
            console.log("Order Items Structure:");
            console.log(JSON.stringify(rows[0].items, null, 2));
        } else {
            console.log("No orders found.");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkOrderItems();
