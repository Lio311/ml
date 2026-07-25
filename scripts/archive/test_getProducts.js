require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function getProducts() {
    let query = `
    SELECT p.*, COALESCE(ps.sales_count, 0) as sales_count 
    FROM products p
    LEFT JOIN product_sales ps ON p.id = ps.product_id
    LEFT JOIN brands b ON p.brand = b.name
    WHERE p.active = true AND p.stock > 0
    `;
    const params = [];
    const search = 'fugazzi';

    if (!search) {
        query += ` AND p.is_discovery_set IS NOT TRUE AND (p.category IS NULL OR p.category != 'מארזים') AND (p.category_en IS NULL OR p.category_en != 'bundles')`;
    }

    if (search) {
        params.push(`%${search}%`);
        query += ` AND (p.name ILIKE $${params.length} 
            OR p.brand ILIKE $${params.length} 
            OR p.model ILIKE $${params.length} 
            OR p.description ILIKE $${params.length} 
            OR p.name_he ILIKE $${params.length}
            OR p.brand_he ILIKE $${params.length}
            OR p.model_he ILIKE $${params.length}
        )`;
    }
    
    console.log(query, params);
    const res = await pool.query(query, params);
    console.log(res.rows.map(r => r.name));
    process.exit(0);
}
getProducts();
