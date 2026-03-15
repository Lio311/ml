import pool from "../../lib/db";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import DeleteOrderButton from "./DeleteOrderButton";
import AdminOrderStatusSelect from "./AdminOrderStatusSelect";

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
            client.query('SELECT * FROM orders WHERE catalog_id IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2', [LIMIT, offset]),
            client.query('SELECT COUNT(*) FROM orders WHERE catalog_id IS NULL')
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
                        let bottleSize = itemSize;

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
                            <th className="p-4 text-center">#</th>
                            <th className="p-4 text-center">לקוח</th>
                            <th className="p-4 text-center w-96">תכולת ההזמנה</th>
                            <th className="p-4 text-center w-28">סכום</th>
                            <th className="p-4 text-center">בונוסים</th>
                            <th className="p-4 text-center">שיטה</th>
                            <th className="p-4 text-center">תאריך</th>
                            <th className="p-4 text-center w-48">סטטוס</th>
                            <th className="p-4 text-center">פעולות</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-center">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50">
                                <td className="p-4 font-bold">{order.id}</td>
                                <td className="p-4">
                                    <div className="font-bold">{order.customer_details?.name}</div>
                                    <div className="text-xs text-gray-500">{order.customer_details?.email}</div>
                                    {order.customer_details?.phone && (
                                        <div className="text-xs font-bold text-gray-700 mt-1 flex items-center justify-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                                <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.261-.15-3.326-.43a13.006 13.006 0 01-9.244-9.244A13.006 13.006 0 012 5V3.5z" clipRule="evenodd" />
                                            </svg>
                                            <a href={`tel:${order.customer_details.phone}`} className="hover:underline">{order.customer_details.phone}</a>
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 text-sm text-right">
                                    <ul className="space-y-1">
                                        {order.items?.map((item, idx) => (
                                            <li key={idx} className="flex gap-2 text-gray-700 justify-start">
                                                <span className="font-bold whitespace-nowrap">{item.quantity}x</span>
                                                <span>{item.name}</span>
                                                <span className="text-gray-500 whitespace-nowrap" dir="ltr">{item.size.toString().includes('ml') ? item.size : `${item.size} ml`}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    {order.notes && (
                                        <div className="mt-2 text-xs bg-yellow-50 p-2 rounded border border-yellow-200 text-gray-800 max-w-[240px] break-words ml-auto mr-0">
                                            <span className="font-bold block mb-1 text-right">הערות:</span>
                                            {order.notes}
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 font-bold whitespace-nowrap">{order.total_amount} ₪</td>
                                <td className="p-4">
                                    <div className="flex justify-center">
                                        {order.free_samples_count > 0 ? (
                                            <div className="inline-flex flex-col items-center text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200 min-w-[70px]" title="דוגמיות מתנה">
                                                <span>🎁</span>
                                                <span className="font-bold whitespace-nowrap">{order.free_samples_count} דוגמיות</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-300 font-light">—</span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center">
                                        {order.delivery_method === 'self_pickup' ? (
                                            <span className="inline-flex flex-col items-center text-xs text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200" title="איסוף עצמי">
                                                <span>📍</span>
                                                <span className="font-bold">איסוף</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex flex-col items-center text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200" title="משלוח בדואר">
                                                <span>📦</span>
                                                <span className="font-bold">משלוח</span>
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-gray-500">
                                    {new Date(order.created_at).toLocaleString('he-IL')}
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center">
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
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col items-center gap-2">
                                        {canEdit ? (
                                            <>
                                                <AdminOrderStatusSelect orderId={order.id} initialStatus={order.status} />
                                                <DeleteOrderButton orderId={order.id} deleteAction={deleteOrder} />
                                            </>
                                        ) : (
                                            <span className="text-gray-400 text-sm">צפייה בלבד</span>
                                        )}
                                    </div>
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
