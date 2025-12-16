import pool from "../../lib/db";
import { revalidatePath } from "next/cache";

export default async function AdminOrdersPage() {
    const client = await pool.connect();
    let orders = [];
    try {
        const res = await client.query('SELECT * FROM orders ORDER BY created_at DESC');
        orders = res.rows;
    } finally {
        client.release();
    }

    async function updateStatus(formData) {
        "use server";
        const orderId = formData.get("orderId");
        const status = formData.get("status");

        const client = await pool.connect();
        try {
            // Get order details first to send email
            const res = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);
            const order = res.rows[0];

            await client.query('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);

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
                        await client.query(
                            'UPDATE products SET stock = stock + $1 WHERE id = $2',
                            [amountToRestore, item.id]
                        );
                    }
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
            <h1 className="text-3xl font-bold mb-8">ניהול הזמנות</h1>

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
                                            <span className="font-bold block mb-1">📝 הערות:</span>
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
                                <td className="p-4 text-sm">
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
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
