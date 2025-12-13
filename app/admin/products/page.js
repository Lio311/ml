import pool from "../../lib/db";
import AdminProductsClient from "./AdminProductsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminProductsPage(props) {
    const searchParams = await props.searchParams;
    const search = searchParams?.q || '';
    const letter = searchParams?.letter || '';
    const view = searchParams?.view || 'all'; // 'all', 'out_of_stock', 'stock_list'
    const sort = searchParams?.sort || 'default'; // 'stock_asc', 'stock_desc'
    const page = Number(searchParams?.page) || 1;
    // Show all products (limit 1000) for stock list, otherwise regular pagination (limit 10)
    const limit = view === 'stock_list' ? 1000 : 10;
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

        // View Filter
        if (view === 'out_of_stock') {
            whereClauses.push(`stock <= 0`);
        }

        if (whereClauses.length > 0) {
            const whereStmt = ' WHERE ' + whereClauses.join(' AND ');
            query += whereStmt;
            countQuery += whereStmt;
        }

        // Get Filtered Count
        const countRes = await client.query(countQuery, params);
        filteredCount = parseInt(countRes.rows[0].count);

        // Sorting
        let orderBy = 'brand ASC, model ASC';
        if (sort === 'stock_asc') {
            orderBy = 'stock ASC, brand ASC';
        } else if (sort === 'stock_desc') {
            orderBy = 'stock DESC, brand ASC';
        }

        query += ` ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`;

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
            currentView={view}
            currentSort={sort}
        />
    );
}



