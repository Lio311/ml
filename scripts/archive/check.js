import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function getProducts(search) {
    const LIMIT = 16;
    const OFFSET = 0;
    const joinType = 'LEFT JOIN';

    let query = `
    SELECT p.*, COALESCE(ps.sales_count, 0) as sales_count 
    FROM products p
    ${joinType} product_sales ps ON p.id = ps.product_id
    ${joinType} brands b ON p.brand = b.name
    WHERE p.active = true AND p.stock > 0
    `;
    const params = [];

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

    const countQuery = `SELECT COUNT(*) FROM (${query}) AS total`;

    let orderBy = 'id DESC';
    query += ` ORDER BY ${orderBy} LIMIT ${LIMIT} OFFSET ${OFFSET}`;

    try {
        const countRes = await pool.query(countQuery, params);
        console.log("Count:", countRes.rows[0].count);
        const res = await pool.query(query, params);
        console.log("Products length:", res.rows.length);
        console.log("Product names:", res.rows.map(r => r.name));
    } catch (e) {
        console.error("Error:", e);
    }
}

getProducts('fugazzi').finally(() => pool.end());
