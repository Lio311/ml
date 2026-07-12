"use server";

import pool from "../../lib/db";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { recordAuditLog } from "../../lib/audit";
import { headers } from "next/headers";

export async function deleteOrder(formData) {
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    const email = user?.emailAddresses?.[0]?.emailAddress;
    
    if (!email || (email !== process.env.ADMIN_EMAIL && role !== 'admin')) {
        throw new Error("Unauthorized");
    }

    const orderId = formData.get("orderId");
    if (!orderId) throw new Error("Missing Order ID");

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Get items to restore stock
        const res = await client.query('SELECT items, free_samples_count FROM orders WHERE id = $1', [orderId]);
        
        if (res.rows.length > 0) {
            const items = res.rows[0].items || [];
            const freeSamplesCount = res.rows[0].free_samples_count || 0;

            for (const item of items) {
                if (!item) continue;

                let dbId = item.id;
                if (typeof dbId === 'string' && dbId.includes('-')) {
                    dbId = parseInt(dbId.split('-')[0]);
                } else if (typeof dbId !== 'number') {
                    dbId = parseInt(dbId);
                }

                if (item.type === 'bundle' && Array.isArray(item.items)) {
                    const bundleSize = Number(item.size) || 2;
                    for (const innerItem of item.items) {
                        let innerDbId = innerItem.id;
                        if (typeof innerDbId === 'string' && innerDbId.includes('-')) {
                            innerDbId = parseInt(innerDbId.split('-')[0]);
                        }
                        if (!isNaN(innerDbId)) {
                            const revertAmount = bundleSize * (item.quantity || 1);
                            await client.query(
                                'UPDATE products SET stock = stock + $1 WHERE id = $2',
                                [revertAmount, innerDbId]
                            );
                        }
                    }
                    if ([2, 5, 10].includes(bundleSize)) {
                        const totalBottles = item.items.length * (item.quantity || 1);
                        await client.query(
                            'UPDATE bottle_inventory SET quantity = quantity + $1 WHERE size = $2',
                            [totalBottles, bundleSize]
                        );
                    }
                } else if (!item.isPrize) {
                    let amountToRestore = 0;
                    if (item.is_discovery_set) {
                        amountToRestore = parseInt(item.quantity) || 0;
                    } else if (!isNaN(parseFloat(String(item.size)))) {
                        amountToRestore = parseFloat(String(item.size)) * (parseInt(item.quantity) || 0);
                    }

                    if (amountToRestore > 0 && !isNaN(dbId)) {
                        await client.query(
                            'UPDATE products SET stock = stock + $1 WHERE id = $2',
                            [amountToRestore, dbId]
                        );

                        // --- RESTORE BOTTLE INVENTORY ---
                        if (!item.is_discovery_set) {
                            const itemSize = parseFloat(String(item.size));
                            if ([2, 5, 10].includes(itemSize)) {
                                await client.query(
                                    'UPDATE bottle_inventory SET quantity = quantity + $1 WHERE size = $2',
                                    [parseInt(item.quantity) || 0, itemSize]
                                );
                            }
                        }
                    }
                }
            }

            // --- RESTORE FREE SAMPLES (2ml) ---
            if (freeSamplesCount > 0) {
                await client.query(
                    'UPDATE bottle_inventory SET quantity = quantity + $1 WHERE size = 2',
                    [freeSamplesCount]
                );
            }
        }

        // 2. Delete
        await client.query('DELETE FROM orders WHERE id = $1', [orderId]);
        
        await client.query('COMMIT');

        // --- AUDIT LOG ---
        const heads = await headers();
        await recordAuditLog({
            userId: user?.id,
            action: 'delete_order',
            entityType: 'order',
            entityId: String(orderId),
            details: { orderId, deletedBy: email },
            req: { headers: heads }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error deleting order:", error);
        throw error;
    } finally {
        client.release();
    }
    
    revalidatePath("/admin/orders");
}
