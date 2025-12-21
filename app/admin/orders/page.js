import pool from "../../lib/db";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";


export const metadata = {
    title: "ניהול הזמנות | ml_tlv",
    robots: "noindex, nofollow",
};

export default async function AdminOrdersPage() {
    const client = await pool.connect();
    let orders = [];
    try {
        const res = await client.query('SELECT * FROM orders ORDER BY created_at DESC');
        orders = res.rows;
    } finally {
        client.release();
    }

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


            // --- EMAIL LOGIC ---
            if (status !== 'pending') {
                let subject = "עדכון לגבי ההזמנה שלך";
                let text = `שלום ${order.customer_details.name},\n\nהסטטוס של הזמנה מספר #${order.id} עודכן ל: ${status === 'paid' ? 'שולם' :
                    status === 'shipped' ? 'נשלח' :
                        status === 'completed' ? 'הושלם' :
                            status === 'cancelled' ? 'בוטל' : status
                    }.`;

                if (status === 'shipped') {
                    subject = "ההזמנה שלך נשלחה!";
                    text = `איזה כיף! ההזמנה שלך (מספר #${order.id}) נארזה ונשלחה אליך.\nבקרוב תריח/י נפלא!`;
                }

                try {
                    // Email logic would indicate here
                    // await sendEmail(...)
                } catch (e) {
                    console.error("Email failed", e);
                }
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
            await client.query('DELETE FROM orders WHERE id = $1', [orderId]);
        } finally {
            client.release();
        }
        revalidatePath("/admin");
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto" dir="rtl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">ניהול הזמנות</h1>
                <a href="/admin" className="text-gray-500 hover:text-black">חזרה לאתר &rarr;</a>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-gray-50 text-gray-600 text-sm border-b">
                        <tr>
                            <th className="p-4 font-bold text-center">#</th>
                            <th className="p-4 font-bold">לקוח</th>
                            <th className="p-4 font-bold">תכולת ההזמנה</th>
                            <th className="p-4 font-bold">סכום</th>
                            <th className="p-4 font-bold text-center">בונוסים</th>
                            <th className="p-4 font-bold">תאריך</th>
                            <th className="p-4 font-bold text-center">סטטוס</th>
                            <th className="p-4 font-bold">פעולות</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {orders.map((order) => {
                            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                            let parsedDetails = {};
                            if (typeof order.customer_details === 'string') {
                                try { parsedDetails = JSON.parse(order.customer_details); } catch (e) { }
                            } else {
                                parsedDetails = order.customer_details || {};
                            }

                            return (
                                <tr key={order.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 font-bold text-center text-gray-700">{order.id}</td>
                                    <td className="p-4">
                                        <div className="font-bold">{parsedDetails.name || 'אורח'}</div>
                                        <div className="text-xs text-gray-500">{parsedDetails.email}</div>
                                        <div className="text-xs text-gray-400">{parsedDetails.phone}</div>
                                    </td>
                                    <td className="p-4 text-xs space-y-1">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <span className="font-bold opacity-50">{item.quantity}x</span>
                                                <span>{item.name}</span>
                                                <span className="text-gray-400">{item.size && `${item.size} ml`}</span>
                                            </div>
                                        ))}
                                    </td>
                                    <td className="p-4 font-bold">₪ {order.total_amount}</td>
                                    <td className="p-4 text-center">
                                        {/* Bonus logic placeholder if needed, otherwise empty or check items for freebies */}
                                        {items.filter(i => i.isBonus).length > 0 ? (
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                                                {items.filter(i => i.isBonus).length} דוגמיות
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="p-4 text-gray-500 text-xs text-center" dir="ltr">
                                        {new Date(order.created_at).toLocaleString('he-IL')}
                                    </td>
                                    <td className="p-4 text-center">
                                        <StatusBadge status={order.status} />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-2">
                                            {canEdit && (
                                                <form action={updateStatus} className="flex items-center gap-2">
                                                    <input type="hidden" name="orderId" value={order.id} />
                                                    <select
                                                        name="status"
                                                        defaultValue={order.status}
                                                        className="border rounded px-2 py-1 text-xs"
                                                    >
                                                        <option value="pending">ממתין</option>
                                                        <option value="paid">שולם</option>
                                                        <option value="shipped">נשלח</option>
                                                        <option value="completed">הושלם</option>
                                                        <option value="cancelled">בוטל</option>
                                                    </select>
                                                    <button className="bg-black text-white px-3 py-1 rounded text-xs">שמור</button>
                                                </form>
                                            )}
                                            {canEdit && (
                                                <form action={deleteOrder}>
                                                    <input type="hidden" name="orderId" value={order.id} />
                                                    <button className="text-red-500 text-xs underline hover:text-red-700">מחק הזמנה</button>
                                                </form>
                                            )}
                                            {!canEdit && <span className="text-gray-400 text-xs">צפייה בלבד</span>}
                                        </div>
                                    </td>

                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div >
    );
}
