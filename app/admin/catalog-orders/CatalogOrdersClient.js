"use client";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Trash2, AlertCircle } from "lucide-react";

import CustomDropdown from "../../components/ui/CustomDropdown";

const STATUS_OPTIONS = [
    { value: 'pending', label: 'ממתין', color: 'bg-orange-50 text-orange-700 border-orange-100', icon: <div className="w-2 h-2 rounded-full bg-orange-500" /> },
    { value: 'processing', label: 'בטיפול', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: <div className="w-2 h-2 rounded-full bg-blue-500" /> },
    { value: 'shipped', label: 'נשלח בדואר', color: 'bg-purple-50 text-purple-700 border-purple-100', icon: <div className="w-2 h-2 rounded-full bg-purple-500" /> },
    { value: 'completed', label: 'נמסר/הושלם', color: 'bg-green-50 text-green-700 border-green-100', icon: <div className="w-2 h-2 rounded-full bg-green-500" /> },
    { value: 'cancelled', label: 'בוטל', color: 'bg-gray-50 text-gray-700 border-gray-100', icon: <div className="w-2 h-2 rounded-full bg-gray-500" /> },
];

function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden text-right border border-gray-100"
                        dir="rtl"
                    >
                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900">{title}</h3>
                            </div>
                            <p className="text-gray-500 font-bold leading-relaxed mb-8">{message}</p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 rounded-2xl font-bold text-gray-400 hover:bg-gray-100 transition-colors"
                                >
                                    ביטול
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className="px-8 py-3 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-200 hover:bg-red-700 hover:shadow-red-300 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    מחיקה
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

export default function CatalogOrdersClient() {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, orderId: null });

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

    const handleDeleteOrder = async () => {
        const orderId = deleteModal.orderId;
        if (!orderId) return;

        try {
            const res = await fetch(`/api/admin/catalog-orders?orderId=${orderId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                toast.success('הזמנה נמחקה בהצלחה');
                setDeleteModal({ isOpen: false, orderId: null });
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
            
            <div className="overflow-x-visible pb-40">
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
                                                onClick={() => setDeleteModal({ isOpen: true, orderId: order.id })}
                                                className="text-gray-300 hover:text-red-600 transition-colors p-1"
                                                title="מחק הזמנה"
                                            >
                                                <Trash2 className="w-4 h-4" />
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
                                        <CustomDropdown 
                                            options={STATUS_OPTIONS}
                                            value={order.status}
                                            onChange={(newStatus) => handleStatusChange(order.id, newStatus)}
                                            variant="status"
                                            className="!py-1.5 !px-3 !rounded-xl"
                                        />
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

            <ConfirmationModal 
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, orderId: null })}
                onConfirm={handleDeleteOrder}
                title="מחיקת הזמנה"
                message="האם אתה בטוח שברצונך למחוק את ההזמנה? פעולה זו אינה ניתנת לביטול."
            />
        </div>
    );
}
