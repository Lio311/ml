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
        <div className="pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 text-right md:text-right">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ניהול הזמנות</h1>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto custom-scrollbar">
                    <table className="w-full text-right" dir="rtl">
                        <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase font-bold">
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
                        <tbody className="divide-y divide-gray-100 text-center">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4 font-bold text-gray-900">{order.id}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900">{order.customer_details?.name}</div>
                                        <div className="text-xs text-gray-500">{order.customer_details?.email}</div>
                                        {order.customer_details?.phone && (
                                            <div className="text-xs font-bold text-gray-700 mt-1 flex items-center justify-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-gray-400">
                                                    <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.261-.15-3.326-.43a13.006 13.006 0 01-9.244-9.244A13.006 13.006 0 012 5V3.5z" clipRule="evenodd" />
                                                </svg>
                                                <a href={`tel:${order.customer_details.phone}`} className="hover:text-blue-600 transition-colors">{order.customer_details.phone}</a>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm text-right">
                                        <ul className="space-y-1">
                                            {order.items?.map((item, idx) => (
                                                <li key={idx} className="flex gap-2 text-gray-700 justify-start">
                                                    <span className="font-bold whitespace-nowrap text-blue-600">{item.quantity}x</span>
                                                    <span>{item.name}</span>
                                                    <span className="text-gray-400 whitespace-nowrap" dir="ltr">{item.size.toString().includes('ml') ? item.size : `${item.size} ml`}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        {order.notes && (
                                            <div className="mt-2 text-[10px] bg-amber-50 p-2 rounded-lg border border-amber-100 text-amber-900 max-w-[240px] break-words ml-auto mr-0">
                                                <span className="font-bold block mb-0.5 text-right">הערות:</span>
                                                {order.notes}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 font-black text-gray-900 whitespace-nowrap">{order.total_amount} ₪</td>
                                    <td className="p-4">
                                        <div className="flex justify-center">
                                            {order.free_samples_count > 0 ? (
                                                <div className="inline-flex flex-col items-center text-[10px] text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100" title="דוגמיות מתנה">
                                                    <span className="text-sm">🎁</span>
                                                    <span className="font-bold whitespace-nowrap">{order.free_samples_count} דוגמיות</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-200 font-light">—</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center">
                                            {order.delivery_method === 'self_pickup' ? (
                                                <div className="inline-flex flex-col items-center text-[10px] text-green-700 bg-green-50 px-2 py-1 rounded-lg border border-green-100" title="איסוף עצמי">
                                                    <span className="text-sm">📍</span>
                                                    <span className="font-bold">איסוף</span>
                                                </div>
                                            ) : (
                                                <div className="inline-flex flex-col items-center text-[10px] text-sky-700 bg-sky-50 px-2 py-1 rounded-lg border border-sky-100" title="משלוח בדואר">
                                                    <span className="text-sm">📦</span>
                                                    <span className="font-bold">משלוח</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                                        {new Date(order.created_at).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center">
                                            <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${order.status === 'pending' ? 'bg-orange-100 text-orange-800' :
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
                                                <span className="text-gray-400 text-xs font-bold uppercase">צפייה בלבד</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View - Card Layout */}
                <div className="md:hidden divide-y divide-gray-100">
                    {orders.map((order) => (
                        <div key={order.id} className="p-4 bg-white hover:bg-gray-50/50 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-xs font-bold text-gray-400 ml-2">#{order.id}</span>
                                    <span className="font-bold text-gray-900">{order.customer_details?.name}</span>
                                    <div className="text-[10px] text-gray-500 mt-0.5">{order.customer_details?.email}</div>
                                </div>
                                <div className="text-left">
                                    <div className="font-black text-gray-900">{order.total_amount} ₪</div>
                                    <div className="text-[9px] text-gray-400">
                                        {new Date(order.created_at).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                <h4 className="text-[10px] uppercase font-bold text-gray-400 mb-2">תכולת ההזמנה:</h4>
                                <ul className="space-y-1.5">
                                    {order.items?.map((item, idx) => (
                                        <li key={idx} className="flex justify-between text-xs">
                                            <div className="flex gap-2 items-start">
                                                <span className="font-bold text-blue-600">{item.quantity}x</span>
                                                <span className="text-gray-700 leading-tight">{item.name}</span>
                                            </div>
                                            <span className="text-gray-400 text-[10px] shrink-0" dir="ltr">
                                                {item.size.toString().includes('ml') ? item.size : `${item.size}ml`}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                {order.notes && (
                                    <div className="mt-3 text-[10px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-100">
                                        <span className="font-bold block mb-1">הערה:</span>
                                        {order.notes}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${order.status === 'pending' ? 'bg-orange-100 text-orange-800' :
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
                                </div>

                                {order.free_samples_count > 0 && (
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                                        <span>🎁</span>
                                        <span>{order.free_samples_count}</span>
                                    </div>
                                )}

                                <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg border ${order.delivery_method === 'self_pickup' ? 'text-green-700 bg-green-50 border-green-100' : 'text-sky-700 bg-sky-50 border-sky-100'}`}>
                                    <span>{order.delivery_method === 'self_pickup' ? '📍' : '📦'}</span>
                                    <span>{order.delivery_method === 'self_pickup' ? 'איסוף' : 'משלוח'}</span>
                                </div>
                            </div>

                            {canEdit && (
                                <div className="mt-4 flex gap-2">
                                    <div className="flex-1">
                                        <AdminOrderStatusSelect orderId={order.id} initialStatus={order.status} />
                                    </div>
                                    <DeleteOrderButton orderId={order.id} deleteAction={deleteOrder} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Pagination Controls - Brand Style */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                    <Link
                        href={`/admin/orders?page=${Math.max(1, page - 1)}`}
                        className={`w-10 h-10 flex items-center justify-center border rounded-xl hover:bg-gray-100 transition-all ${page === 1 ? 'opacity-30 pointer-events-none' : 'shadow-sm'}`}
                        aria-disabled={page === 1}
                    >
                        →
                    </Link>

                    <div className="flex gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <Link
                                key={p}
                                href={`/admin/orders?page=${p}`}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${page === p ? 'bg-black text-white shadow-md scale-110' : 'text-gray-400 hover:bg-gray-100'}`}
                            >
                                {p}
                            </Link>
                        ))}
                    </div>

                    <Link
                        href={`/admin/orders?page=${Math.min(totalPages, page + 1)}`}
                        className={`w-10 h-10 flex items-center justify-center border rounded-xl hover:bg-gray-100 transition-all ${page === totalPages ? 'opacity-30 pointer-events-none' : 'shadow-sm'}`}
                        aria-disabled={page === totalPages}
                    >
                        ←
                    </Link>
                </div>
            )}
        </div>
    );
}
        </div>
    );
}
