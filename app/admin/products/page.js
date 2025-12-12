import pool from "../../lib/db";
import AdminProductsClient from "./AdminProductsClient";

export default async function AdminProductsPage(props) {
    const searchParams = await props.searchParams;
    const search = searchParams?.q || '';
    const letter = searchParams?.letter || '';
    const page = Number(searchParams?.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    let products = [];
    let totalProducts = 0;
    let filteredCount = 0;

    const client = await pool.connect();
    try {
        // Total Count (All products)
        const totalRes = await client.query('SELECT COUNT(*) FROM products');
        totalProducts = parseInt(totalRes.rows[0].count);

        let query = 'SELECT * FROM products';
        let countQuery = 'SELECT COUNT(*) FROM products';
        const params = [];
        let whereClauses = [];

        if (search) {
            whereClauses.push(`(brand ILIKE $${params.length + 1} OR model ILIKE $${params.length + 1} OR name ILIKE $${params.length + 1})`);
            params.push(`%${search}%`);
        } else if (letter) {
            whereClauses.push(`brand ILIKE $${params.length + 1}`);
            params.push(`${letter}%`);
        }

        if (whereClauses.length > 0) {
            const whereStmt = ' WHERE ' + whereClauses.join(' AND ');
            query += whereStmt;
            countQuery += whereStmt;
        }

        // Get Filtered Count
        const countRes = await client.query(countQuery, params);
        filteredCount = parseInt(countRes.rows[0].count);

        // Add sorting and pagination
        query += ` ORDER BY brand ASC, model ASC LIMIT ${limit} OFFSET ${offset}`;

        const res = await client.query(query, params);
        products = res.rows;

    } finally {
        client.release();
    }

    return (
        <AdminProductsClient
            products={products}
            initialSearch={search}
            totalProducts={totalProducts}
            filteredCount={filteredCount}
            currentPage={page}
            totalPages={Math.ceil(filteredCount / limit)}
            currentLetter={letter}
        />
    );
}



