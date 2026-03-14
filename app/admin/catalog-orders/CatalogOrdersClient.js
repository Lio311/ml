"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function CatalogOrdersClient() {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/catalog-orders");
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            } else {
                toast.error("שגיאה בטעינת הזמנות");
            }
        } catch (e) {
            console.error("Error fetching orders:", e);
            toast.error("שגיאה בטעינת הזמנות");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const res = await fetch(`/api/admin/catalog-orders`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, status: newStatus })
            });
            if (res.ok) {
                toast.success('סטטוס חבילה עודכן בהצלחה');
                fetchOrders();
            } else {
                toast.error('שגיאה בעדכון סטטוס');
            }
        } catch (e) {
            toast.error('שגיאה בעדכון סטטוס');
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק את ההזמנה? פעולה זו אינה ניתנת לביטול.')) return;

        try {
            const res = await fetch(`/api/admin/catalog-orders?orderId=${orderId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                toast.success('הזמנה נמחקה בהצלחה');
                fetchOrders();
            } else {
                toast.error('שגיאה במחיקת הזמנה');
            }
        } catch (e) {
            console.error("Error deleting order:", e);
            toast.error('שגיאה במחיקת הזמנה');
        }
    };

    if (isLoading) return <div className="text-center py-20 text-gray-500 animate-pulse font-bold text-xl">טוען הזמנות...</div>;

    if (orders.length === 0) {
        return (
            <div className="bg-white p-10 rounded-xl shadow-md border border-gray-100 text-center">
                <span className="text-5xl block mb-4">🏪</span>
                <h3 className="text-2xl font-bold text-gray-800">אין עדיין הזמנות קטלוגים</h3>
                <p className="text-gray-500 mt-2">ברגע שיכנסו הזמנות דרך קטלוגים של ספקים, הן יופיעו כאן.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-right">
            <div className="p-6 border-b flex flex-wrap gap-4 justify-between items-center bg-gray-50">
                <h3 className="font-bold text-xl">כלל ההזמנות במערכת הקטלוגים</h3>
                <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md">{orders.length} הזמנות צד ג'</span>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 border-b whitespace-nowrap">
                        <tr>
                            <th className="p-4 text-right font-semibold">מס' הזמנה</th>
                            <th className="p-4 text-right font-semibold">תאריך</th>
                            <th className="p-4 text-right font-semibold">הזמנה מקטלוג</th>
                            <th className="p-4 text-right font-semibold">לקוח</th>
                            <th className="p-4 text-right font-semibold">סכום ופירוט פריטים</th>
                            <th className="p-4 text-center font-semibold">סטטוס משלוח</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-right">
                        {orders.map(order => {
                            const customer = typeof order.customer_details === 'string' ? JSON.parse(order.customer_details) : order.customer_details;
                            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                            
                            return (
                                <tr key={order.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 font-bold text-gray-700">
                                        <div className="flex items-center gap-2">
                                            <span>#{order.id}</span>
                                            <button 
                                                onClick={() => handleDeleteOrder(order.id)}
                                                className="text-gray-300 hover:text-red-600 transition-colors p-1"
                                                title="מחק הזמנה"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-500 whitespace-nowrap">{new Date(order.created_at).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-blue-700 bg-blue-50 inline-block px-2 py-1 rounded">{order.catalog_name}</div>
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                        <div className="font-bold text-gray-800">{customer?.name}</div>
                                        <div className="text-xs text-gray-400">{customer?.email}</div>
                                        <div className="text-xs text-gray-400">{customer?.phone}</div>
                                    </td>
                                    <td className="p-4 font-bold text-lg">
                                        <div className="mb-2">{order.total_amount} ₪</div>
                                        <div className="text-xs text-gray-500 font-normal max-w-[250px] min-w-[200px]">
                                            <ul className="list-disc list-inside space-y-1">
                                                {items.map((item, i) => (
                                                    <li key={i} className="truncate" title={item.name}>
                                                        {item.quantity}x {item.name} ({item.size}ml)
                                                    </li>
                                                ))}
                                            </ul>
                                            {order.free_samples_count > 0 && (
                                                <div className="mt-1 text-pink-500 font-bold bg-pink-50 inline-block px-2 py-0.5 rounded shadow-sm">+ {order.free_samples_count} דוגמיות חינם</div>
                                            )}
                                            {order.notes && (
                                                <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">הערה: {order.notes}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                            className={`p-2 border rounded-xl font-bold text-sm outline-none transition-colors select-none cursor-pointer w-[140px] shadow-sm
                                                ${order.status === 'pending' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                                order.status === 'processing' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                                order.status === 'shipped' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                                order.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                                                'bg-gray-100 text-gray-800 border-gray-200'}`}
                                        >
                                            <option value="pending" className="bg-white text-black">ממתין</option>
                                            <option value="processing" className="bg-white text-black">בטיפול</option>
                                            <option value="shipped" className="bg-white text-black">נשלח בדואר</option>
                                            <option value="completed" className="bg-white text-black">נמסר/הושלם</option>
                                            <option value="cancelled" className="bg-white text-black">בוטל</option>
                                        </select>
                                        {order.delivery_method === 'self_pickup' && (
                                            <div className="mt-2 text-[10px] font-bold text-green-700 uppercase bg-green-50 rounded p-1 inline-block">איסוף עצמי</div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
