import pool from "../../lib/db";
import AdminProductsClient from "./AdminProductsClient";
import { currentUser } from "@clerk/nextjs/server";
import { sanitizeProductArray } from "../../lib/productUtils";


export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminProductsPage(props) {
    const searchParams = await props.searchParams;
    const search = searchParams?.q || '';
    const letter = searchParams?.letter || '';
    const view = searchParams?.view || 'all'; // 'all', 'out_of_stock', 'stock_list'
    const sort = searchParams?.sort || 'default'; // 'stock_asc', 'stock_desc'
    const page = Number(searchParams?.page) || 1;
    // Show all products (limit 1000) for stock list, otherwise regular pagination (limit 5)
    const limit = view === 'stock_list' ? 1000 : 5;
    const offset = (page - 1) * limit;

    let products = [];
    let totalProducts = 0;
    let filteredCount = 0;
    let counts = { all: 0, out_of_stock: 0, drafts: 0 };

    const client = await pool.connect();
    try {
        let query = 'SELECT id, brand, model, name, name_he, brand_he, model_he, price_2ml, price_5ml, price_10ml, image_url, category, description, stock, top_notes, middle_notes, base_notes, in_lottery, cost_price, original_size, seasons, perfumers, country, active FROM products';
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
        } else if (view === 'drafts') {
            whereClauses.push(`active = false`);
        }

        // Fetch Global Counts (Quickly, without search/letter filtering)
        const countsRes = await client.query(`
            SELECT 
                COUNT(*) as all,
                COUNT(*) FILTER (WHERE stock <= 0) as out_of_stock,
                COUNT(*) FILTER (WHERE active = false) as drafts
            FROM products
        `);
        counts = {
            all: parseInt(countsRes.rows[0].all),
            out_of_stock: parseInt(countsRes.rows[0].out_of_stock),
            drafts: parseInt(countsRes.rows[0].drafts)
        };
        totalProducts = counts.all;

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
        products = sanitizeProductArray(res.rows);

    } finally {
        client.release();
    }

    const user = await currentUser();
    const canEdit = user?.publicMetadata?.role === 'admin' || user?.emailAddresses[0]?.emailAddress === process.env.ADMIN_EMAIL;


    return (
        <AdminProductsClient
            products={products}
            initialSearch={search}
            totalProducts={totalProducts}
            filteredCount={filteredCount}
            counts={counts}
            currentPage={page}
            totalPages={Math.ceil(filteredCount / limit)}
            currentLetter={letter}
            currentView={view}
            currentSort={sort}
            canEdit={canEdit}
        />

    );
}



