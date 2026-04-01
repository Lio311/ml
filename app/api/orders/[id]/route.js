import pool from "@/app/lib/db";
import { auth as clerkAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req, props) {
    const params = await props.params;
    try {
        const authData = await clerkAuth();
        const userId = authData?.userId;
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        const orderId = params.id;

        // Fetch order details
        const query = await pool.query(`
            SELECT id, user_id, items, total, status, customer_details, created_at, invoice_url, catalog_id, free_samples_count, payment_intent_id 
            FROM orders WHERE id = $1
        `, [orderId]);

        if (query.rows.length === 0) {
            return new NextResponse('Order not found', { status: 404 });
        }

        const order = query.rows[0];

        // Security check: Only owner or admin/seller can view
        // 1. Check if user is the buyer
        const isBuyer = order.customer_details?.clerk_id === userId;
        
        // 2. Check if user is an admin or the seller of this catalog
        const userQuery = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        const userRole = userQuery.rows[0]?.role;
        const isAdmin = userRole === 'admin' || userRole === 'deputy';
        const isSeller = userRole === 'seller' && order.catalog_id && (
            await pool.query('SELECT user_id FROM user_catalogs WHERE id = $1 AND user_id = $2', [order.catalog_id, userId])
        ).rows.length > 0;

        if (!isBuyer && !isAdmin && !isSeller) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error('Error fetching order details:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
