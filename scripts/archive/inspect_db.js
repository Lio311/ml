const pool = require('./app/lib/db');

async function main() {
    try {
        const productsRes = await pool.query("SELECT * FROM products LIMIT 1");
        console.log("Products columns:", Object.keys(productsRes.rows[0] || {}));

        const brandsRes = await pool.query("SELECT * FROM brands LIMIT 1");
        console.log("Brands columns:", Object.keys(brandsRes.rows[0] || {}));

        const blogRes = await pool.query("SELECT * FROM blog_posts LIMIT 1");
        console.log("Blog columns:", Object.keys(blogRes.rows[0] || {}));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
