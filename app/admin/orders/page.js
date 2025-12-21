import pool from "../../lib/db";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

export const metadata = {
    title: "ניהול הזמנות | ml_tlv",
    robots: "noindex, nofollow",
};

export default async function AdminOrdersPage(props) {
    const searchParams = await props.searchParams;
    const page = Number(searchParams?.page) || 1;
    const LIMIT = 5;
    const offset = (page - 1) * LIMIT;

    const client = await pool.connect();
    let orders = [];
    let totalOrders = 0;

    try {
        const [ordersRes, countRes] = await Promise.all([
            client.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT $1 OFFSET $2', [LIMIT, offset]),
            client.query('SELECT COUNT(*) FROM orders')
        ]);
        orders = ordersRes.rows;
        totalOrders = parseInt(countRes.rows[0].count);
    } finally {
        client.release();
    }

    const totalPages = Math.ceil(totalOrders / LIMIT);

    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;
    const role = user?.publicMetadata?.role;
    const isSuperAdmin = email === 'lior31197@gmail.com';
    const canEdit = isSuperAdmin || role === 'admin';

    async function updateStatus(formData) {
        "use server";
        const user = await currentUser();
        const role = user?.publicMetadata?.role;
        const email = user?.emailAddresses[0]?.emailAddress;
        if (email !== 'lior31197@gmail.com' && role !== 'admin') {
            throw new Error("Unauthorized");
        }

        const orderId = formData.get("orderId");
        const status = formData.get("status");

        const client = await pool.connect();
        try {
            // Get order details first to send email
            const res = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);
            const order = res.rows[0];

            await client.query('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);

            // --- BOTTLE INVENTORY LOGIC FOR STATUS CHANGE ---
            const oldStatus = order.status;
            const newStatus = status;

            // 1. If Cancelling: RESTORE Stock
            if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
                const items = order.items;
                for (const item of items) {
                    if (!item.isPrize && !isNaN(item.size)) {
                        let bottleSize = Number(item.size);

                        // Luxury Bottle Logic: 10ml & Price >= 300 -> Size 11
                        if (bottleSize === 10 && item.price >= 300) {
                            bottleSize = 11;
                        }

                        if ([2, 5, 10, 11].includes(bottleSize)) {
                            await client.query(
                                'UPDATE bottle_inventory SET quantity = quantity + $1 WHERE size = $2',
                                [item.quantity, bottleSize]
                            );
                        }
                    }
                }
                // Restore Free Samples
                if (order.free_samples_count > 0) {
                    await client.query(
                        'UPDATE bottle_inventory SET quantity = quantity + $1 WHERE size = 2',
                        [order.free_samples_count]
                    );
                }
            }

            // 2. If Un-Cancelling (Restoring): DEDUCT Stock again
            if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
                const items = order.items;
                for (const item of items) {
                    if (!item.isPrize && !isNaN(item.size)) {
                        let bottleSize = Number(item.size);

                        // Luxury Bottle Logic: 10ml & Price >= 300 -> Size 11
                        if (bottleSize === 10 && item.price >= 300) {
                            bottleSize = 11;
                        }

                        if ([2, 5, 10, 11].includes(bottleSize)) {
                            await client.query(
                                'UPDATE bottle_inventory SET quantity = quantity - $1 WHERE size = $2',
                                [item.quantity, bottleSize]
                            );
                        }
                    }
                }
                // Deduct Free Samples
                if (order.free_samples_count > 0) {
                    await client.query(
                        'UPDATE bottle_inventory SET quantity = quantity - $1 WHERE size = 2',
                        [order.free_samples_count]
                    );
                }
            }

            // Send Email Notification
            const { sendEmail, getStatusUpdateTemplate } = require('../../../lib/email'); // Dynamic import for server action
            if (order && order.customer_details?.email) {
                const html = getStatusUpdateTemplate(orderId, status, order.customer_details.name);
                await sendEmail(order.customer_details.email, `עדכון סטטוס הזמנה #${orderId} - ml`, html);
            }

        } finally {
            client.release();
        }
        revalidatePath("/admin/orders");
    }

    async function deleteOrder(formData) {
        "use server";
        const user = await currentUser();
        const role = user?.publicMetadata?.role;
        const email = user?.emailAddresses[0]?.emailAddress;
        if (email !== 'lior31197@gmail.com' && role !== 'admin') {
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
                    if (!item.isPrize && !isNaN(item.size)) {
                        const amountToRestore = Number(item.size) * item.quantity;

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
                        let bottleSize = Number(item.size);

                        // Luxury Bottle Logic: 10ml & Price >= 300 -> Size 11
                        if (bottleSize === 10 && item.price >= 300) {
                            bottleSize = 11;
                        }

                        if ([2, 5, 10, 11].includes(bottleSize)) {
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
        } finally {
            client.release();
        }
        revalidatePath("/admin/orders");
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">ניהול הזמנות</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">#</th>
                            <th className="p-4">לקוח</th>
                            <th className="p-4 w-96">תכולת ההזמנה</th>
                            <th className="p-4">סכום</th>
                            <th className="p-4">בונוסים</th>
                            <th className="p-4">תאריך</th>
                            <th className="p-4">סטטוס</th>
                            <th className="p-4">פעולות</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50">
                                <td className="p-4 font-bold">{order.id}</td>
                                <td className="p-4">
                                    <div className="font-bold">{order.customer_details?.name}</div>
                                    <div className="text-xs text-gray-500">{order.customer_details?.email}</div>
                                    {order.notes && (
                                        <div className="mt-2 text-xs bg-yellow-50 p-2 rounded border border-yellow-200 text-gray-800 max-w-[200px] break-words">
                                            <span className="font-bold block mb-1">הערות:</span>
                                            {order.notes}
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 text-sm">
                                    <ul className="space-y-1">
                                        {order.items?.map((item, idx) => (
                                            <li key={idx} className="flex gap-2 text-gray-700">
                                                <span className="font-bold whitespace-nowrap">{item.quantity}x</span>
                                                <span>{item.name}</span>
                                                <span className="text-gray-500 whitespace-nowrap" dir="ltr">{item.size.toString().includes('ml') ? item.size : `${item.size} ml`}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </td>
                                <td className="p-4 font-bold">{order.total_amount} ₪</td>
                                <td className="p-4 text-sm text-center">
                                    {order.free_samples_count > 0 ? (
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                            {order.free_samples_count} דוגמיות
                                        </span>
                                    ) : '-'}
                                </td>
                                <td className="p-4 text-sm text-gray-500">
                                    {new Date(order.created_at).toLocaleString('he-IL')}
                                </td>
                                <td className="p-4">
                                    <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                            order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                        }`}>
                                        {
                                            order.status === 'pending' ? 'ממתין' :
                                                order.status === 'processing' ? 'בטיפול' :
                                                    order.status === 'shipped' ? 'נשלח' :
                                                        order.status === 'completed' ? 'הושלם' :
                                                            order.status === 'cancelled' ? 'בוטל' :
                                                                order.status
                                        }
                                    </span>
                                </td>
                                <td className="p-4">
                                    {canEdit ? (
                                        <>
                                            <form action={updateStatus} className="flex gap-2">
                                                <input type="hidden" name="orderId" value={order.id} />
                                                <select name="status" defaultValue={order.status} className="border rounded px-2 py-1 text-sm bg-white">
                                                    <option value="pending">ממתין</option>
                                                    <option value="processing">בטיפול</option>
                                                    <option value="shipped">נשלח</option>
                                                    <option value="completed">הושלם</option>
                                                    <option value="cancelled">בוטל</option>
                                                </select>
                                                <button type="submit" className="bg-black text-white px-3 py-1 rounded text-sm hover:bg-gray-800">
                                                    שמור
                                                </button>
                                            </form>
                                            <form action={deleteOrder} className="mt-1">
                                                <input type="hidden" name="orderId" value={order.id} />
                                                <button
                                                    type="submit"
                                                    className="text-red-500 text-xs underline hover:text-red-700"
                                                >
                                                    מחק הזמנה
                                                </button>
                                            </form>
                                        </>
                                    ) : (
                                        <span className="text-gray-400 text-sm">צפייה בלבד</span>
                                    )}
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls - Brand Style */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                    <Link
                        href={`/admin/orders?page=${Math.max(1, page - 1)}`}
                        className={`px-4 py-2 border rounded hover:bg-gray-100 transition ${page === 1 ? 'opacity-50 pointer-events-none' : ''}`}
                        aria-disabled={page === 1}
                    >
                        הקודם
                    </Link>

                    <span className="text-sm text-gray-600">
                        עמוד {page} מתוך {totalPages}
                    </span>

                    <Link
                        href={`/admin/orders?page=${Math.min(totalPages, page + 1)}`}
                        className={`px-4 py-2 border rounded hover:bg-gray-100 transition ${page === totalPages ? 'opacity-50 pointer-events-none' : ''}`}
                        aria-disabled={page === totalPages}
                    >
                        הבא
                    </Link>
                </div>
            )}
        </div>
    );
}
