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

export const metadata = {
    title: "ניהול הזמנות | ml_tlv",
    robots: "noindex, nofollow",
};

export default async function AdminOrdersPage(props) {
    const searchParams = await props.searchParams;
    const page = Number(searchParams?.page) || 1;
    const LIMIT = 3; // Limited to 3 orders per page as requested
    
    const offset = (page - 1) * LIMIT;

    const client = await pool.connect();
    let orders = [];
    let totalOrders = 0;

    try {
        // Fetch Main Site Orders (catalog_id IS NULL)
        const [res, countRes] = await Promise.all([
            client.query('SELECT id, items, total_amount, status, customer_details, created_at, invoice_url, catalog_id, free_samples_count, notes, delivery_method FROM orders WHERE catalog_id IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2', [LIMIT, offset]),
            client.query('SELECT COUNT(*) FROM orders WHERE catalog_id IS NULL')
        ]);
        orders = sanitizeProductArray(res.rows);
        totalOrders = parseInt(countRes.rows[0].count);
    } finally {
        client.release();
    }

    const totalPages = Math.ceil(totalOrders / LIMIT);

    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;
    const role = user?.publicMetadata?.role;
    const isSuperAdmin = email === process.env.ADMIN_EMAIL;
    const canEdit = isSuperAdmin || role === 'admin';

    async function deleteOrder(formData) {
        "use server";
        const user = await currentUser();
        const role = user?.publicMetadata?.role;
        const email = user?.emailAddresses[0]?.emailAddress;
        if (email !== process.env.ADMIN_EMAIL && role !== 'admin') {
            throw new Error("Unauthorized");
        }

        const orderId = formData.get("orderId");

        const client = await pool.connect();
        try {
            // 1. Get items to restore stock
            const res = await client.query('SELECT items FROM orders WHERE id = $1', [orderId]);
            if (res.rows.length > 0) {
                const items = res.rows[0].items;
                for (const item of items) {
                    const itemSize = parseFloat(String(item.size));
                    if (!item.isPrize && !isNaN(itemSize)) {
                        const amountToRestore = itemSize * item.quantity;

                        // Fix for composite IDs (e.g. "74-2")
                        let dbId = item.id;
                        if (typeof dbId === 'string' && dbId.includes('-')) {
                            dbId = parseInt(dbId.split('-')[0]);
                        }

                        await client.query(
                            'UPDATE products SET stock = stock + $1 WHERE id = $2',
                            [amountToRestore, dbId]
                        );

                        // --- RESTORE BOTTLE INVENTORY ---
                        const bottleSize = itemSize;

                        if ([2, 5, 10].includes(bottleSize)) {
                            await client.query(
                                'UPDATE bottle_inventory SET quantity = quantity + $1 WHERE size = $2',
                                [item.quantity, bottleSize]
                            );
                        }
                    }
                }

                // --- RESTORE FREE SAMPLES (2ml) ---
                if (res.rows[0].free_samples_count > 0) {
                    await client.query(
                        'UPDATE bottle_inventory SET quantity = quantity + $1 WHERE size = 2',
                        [res.rows[0].free_samples_count]
                    );
                }
            }

            // 2. Delete
            await client.query('DELETE FROM orders WHERE id = $1', [orderId]);

            // --- AUDIT LOG ---
            const heads = await headers();
            await recordAuditLog({
                userId: user?.id,
                action: 'delete_order',
                entityType: 'order',
                entityId: String(orderId),
                details: { orderId, deletedBy: email },
                req: { headers: heads } // Mocking request object for metadata extraction
            });
        } finally {
            client.release();
        }
        revalidatePath("/admin/orders");
    }

    return (
        <AdminOrdersListClient 
            orders={orders} 
            totalPages={totalPages}
            currentPage={page}
            totalOrders={totalOrders}
            canEdit={canEdit} 
            deleteOrder={deleteOrder} 
        />
    );
}
