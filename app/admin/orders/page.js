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

export default async function AdminOrdersPage(props) {
    const searchParams = await props.searchParams;
    const page = Number(searchParams?.page) || 1;
    const currentStatus = searchParams?.status || 'all';
    
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
        let filterClause = 'catalog_id IS NULL';
        let queryParams = [LIMIT, offset];
        
        let countFilterClause = 'catalog_id IS NULL';
        let countQueryParams = [];

        if (currentStatus !== 'all') {
            filterClause += ' AND status = $3';
            queryParams.push(currentStatus);
            
            countFilterClause += ' AND status = $1';
            countQueryParams.push(currentStatus);
        }

        // Fetch orders, total count for current filter, and status-wise counts
        const [res, countRes, statsRes] = await Promise.all([
            client.query(`SELECT id, items, total_amount, status, customer_details, created_at, invoice_url, catalog_id, free_samples_count, notes, delivery_method, coupon_code FROM orders WHERE ${filterClause} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, queryParams),
            client.query(`SELECT COUNT(*) FROM orders WHERE ${countFilterClause}`, countQueryParams),
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
    const isSuperAdmin = email === process.env.ADMIN_EMAIL;
    const canEdit = isSuperAdmin || role === 'admin';


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
            statusCounts={statusCounts}
        />
    );
}
