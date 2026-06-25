import pool from "../../lib/db";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import DeleteOrderButton from "./DeleteOrderButton";
import AdminOrderStatusSelect from "./AdminOrderStatusSelect";
import DownloadOrderPDF from "./DownloadOrderPDF";
import AdminOrdersListClient from "./AdminOrdersListClient";
import { sanitizeProductArray } from "../../lib/productUtils";
import { recordAuditLog } from "../../lib/audit";
import { headers } from "next/headers";

import { deleteOrder } from "./actions";

export const metadata = {
    title: "ניהול הזמנות Admin",
    robots: "noindex, nofollow",
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminOrdersPage(props) {
    const searchParams = await props.searchParams;
    const page = Number(searchParams?.page) || 1;
    const currentStatus = searchParams?.status || 'all';
    const searchQuery = searchParams?.search || '';
    
    // Support dynamic limits: 10, 50, 100, All (5000)
    let LIMIT = Number(searchParams?.limit) || 10;
    if (searchParams?.limit === 'all') LIMIT = 5000;
    
    const offset = (page - 1) * LIMIT;

    const client = await pool.connect();
    let orders = [];
    let totalOrders = 0;
    let statusCounts = {};

    try {
        // Build query parts
        let conditions = ['catalog_id IS NULL'];
        let countParams = [];

        if (currentStatus !== 'all') {
            countParams.push(currentStatus);
            conditions.push(`status = $${countParams.length}`);
        }

        if (searchQuery) {
            countParams.push(`%${searchQuery}%`);
            const paramIdx = countParams.length;
            
            let searchCond = `(
                customer_details->>'name' ILIKE $${paramIdx} OR 
                customer_details->>'email' ILIKE $${paramIdx} OR 
                customer_details->>'phone' ILIKE $${paramIdx}
            )`;

            // If search query is numeric, also search by order ID
            if (!isNaN(searchQuery) && searchQuery.trim() !== '') {
                countParams.push(Number(searchQuery));
                searchCond = `(id = $${countParams.length} OR ${searchCond.substring(1)}`;
            }
            
            conditions.push(searchCond);
        }

        const countFilterClause = conditions.join(' AND ');
        const queryParams = [...countParams, LIMIT, offset];
        const limitParamIdx = queryParams.length - 1;
        const offsetParamIdx = queryParams.length;

        // Fetch orders, total count for current filter, and status-wise counts
        const [res, countRes, statsRes] = await Promise.all([
            client.query(`SELECT id, items, total_amount, status, customer_details, created_at, invoice_url, catalog_id, free_samples_count, notes, delivery_method, coupon_code FROM orders WHERE ${countFilterClause} ORDER BY created_at DESC LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}`, queryParams),
            client.query(`SELECT COUNT(*) FROM orders WHERE ${countFilterClause}`, countParams),
            client.query('SELECT status, COUNT(*) FROM orders WHERE catalog_id IS NULL GROUP BY status')
        ]);

        orders = sanitizeProductArray(res.rows);
        totalOrders = parseInt(countRes.rows[0].count);
        
        // Transform statsRes rows into a more usable object
        statsRes.rows.forEach(row => {
            statusCounts[row.status] = parseInt(row.count);
        });
        // Add grand total for 'all'
        statusCounts['all'] = Object.values(statusCounts).reduce((a, b) => a + b, 0);

    } finally {
        client.release();
    }

    const totalPages = Math.ceil(totalOrders / LIMIT);

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    const role = user?.publicMetadata?.role;
    const isSuperAdmin = user?.emailAddresses?.[0]?.emailAddress === process.env.ADMIN_EMAIL;
    const canEdit = isSuperAdmin || role === 'admin' || role === 'viewer';


    return (
        <AdminOrdersListClient 
            orders={orders} 
            totalPages={totalPages}
            currentPage={page}
            totalOrders={totalOrders}
            canEdit={canEdit} 
            deleteOrder={deleteOrder}
            currentLimit={LIMIT}
            currentStatus={currentStatus}
            currentSearch={searchQuery}
            statusCounts={statusCounts}
        />
    );
}
