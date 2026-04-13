"use client";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, AlertCircle } from "lucide-react";

import CustomDropdown from "../../components/ui/CustomDropdown";

const Dot = ({ color }) => <div className={`w-2 h-2 rounded-full ${color}`} />;

const STATUS_OPTIONS = [
    { value: 'pending', label: 'ממתין', color: 'bg-orange-50 text-orange-700 border-orange-100', icon: <Dot color="bg-orange-500" /> },
    { value: 'processing', label: 'בטיפול', color: 'bg-blue-50 text-blue-700 border-blue-100', icon: <Dot color="bg-blue-500" /> },
    { value: 'shipped', label: 'נשלח בדואר', color: 'bg-purple-50 text-purple-700 border-purple-100', icon: <Dot color="bg-purple-500" /> },
    { value: 'completed', label: 'נמסר/הושלם', color: 'bg-green-50 text-green-700 border-green-100', icon: <Dot color="bg-green-500" /> },
    { value: 'cancelled', label: 'בוטל', color: 'bg-gray-50 text-gray-700 border-gray-100', icon: <Dot color="bg-gray-500" /> },
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
            <div className="p-4 md:p-6 border-b flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50">
                <h3 className="font-bold text-lg md:text-xl">כלל ההזמנות במערכת הקטלוגים</h3>
                <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md">{orders.length} הזמנות צד ג'</span>
            </div>
            
            <div className="overflow-x-visible">
                {/* Desktop View Table */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-gray-50 text-gray-500 border-b whitespace-nowrap">
                            <tr>
                                <th className="p-4 text-center font-bold uppercase tracking-wider text-[11px]">מס' הזמנה</th>
                                <th className="p-4 text-center font-bold uppercase tracking-wider text-[11px]">תאריך</th>
                                <th className="p-4 text-center font-bold uppercase tracking-wider text-[11px]">הזמנה מקטלוג</th>
                                <th className="p-4 text-center font-bold uppercase tracking-wider text-[11px]">לקוח</th>
                                <th className="p-4 text-center font-bold uppercase tracking-wider text-[11px]">סכום ופריטים</th>
                                <th className="p-4 text-center font-bold uppercase tracking-wider text-[11px]">הערות</th>
                                <th className="p-4 text-center font-bold uppercase tracking-wider text-[11px]">סטטוס משלוח</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-right">
                            {orders.map(order => {
                                const customer = typeof order.customer_details === 'string' ? JSON.parse(order.customer_details) : order.customer_details;
                                const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                                
                                return (
                                    <tr key={order.id} className={`hover:bg-gray-50/50 transition-colors ${order.status === 'cancelled' ? 'opacity-60 grayscale-[0.3]' : ''}`}>
                                        <td className="p-4 font-bold text-gray-700 text-center">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded-lg text-[10px] font-mono tracking-tight">#{order.id}</span>
                                                <button 
                                                    onClick={() => setDeleteModal({ isOpen: true, orderId: order.id })}
                                                    className="text-gray-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                                                    title="מחק הזמנה"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-400 whitespace-nowrap text-center text-xs font-medium">
                                            {new Date(order.created_at).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            <div className="text-[10px] opacity-70 mt-0.5">{new Date(order.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="font-bold text-blue-700 bg-blue-50 border border-blue-100 inline-block px-2.5 py-1 rounded-lg text-xs shadow-sm">{order.catalog_name}</div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap text-center">
                                            <div className="font-bold text-gray-900 text-[13px]">{customer?.name}</div>
                                            <div className="text-[10px] text-gray-400 font-medium tracking-tight mt-0.5">{customer?.email}</div>
                                            <div className="text-[10px] text-gray-400 font-bold tracking-tight">{customer?.phone}</div>
                                        </td>
                                        <td className="p-4 text-center font-bold text-lg">
                                            <div className="mb-1.5 text-black"><span dir="ltr">₪ {order.total_amount?.toLocaleString()}</span></div>
                                            <div className="text-[11px] text-gray-500 font-normal max-w-[250px] min-w-[160px] text-right bg-gray-50/50 p-2 rounded-xl border border-gray-100/50 shadow-sm leading-relaxed">
                                                <ul className="space-y-1">
                                                    {items.map((item, i) => (
                                                        <li key={i} className="flex gap-1.5 items-start" title={item.name}>
                                                            <span className="font-black text-black shrink-0">{item.quantity}x</span>
                                                            <span className="truncate">{item.name} ({String(item.size).replace(/ml$/i, '')} מ"ל)</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                                {order.free_samples_count > 0 && (
                                                    <div className="mt-2 text-pink-600 font-black bg-pink-50 border border-pink-100 px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider inline-block">+ {order.free_samples_count} דקאנטים חינם</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center max-w-[180px]">
                                            {(order.notes || customer?.notes) ? (
                                                <div className="text-[11px] text-orange-800 bg-orange-50 border border-orange-100 p-2.5 rounded-xl text-right leading-relaxed font-medium shadow-sm">
                                                    {order.notes || customer?.notes}
                                                </div>
                                            ) : (
                                                <span className="text-gray-300 text-[10px] font-black uppercase tracking-widest leading-none">אין הערות</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <CustomDropdown 
                                                    options={STATUS_OPTIONS}
                                                    value={order.status}
                                                    onChange={(newStatus) => handleStatusChange(order.id, newStatus)}
                                                    variant="status"
                                                    className="!py-2 !px-4 !rounded-xl !text-xs !font-black !shadow-sm hover:!shadow-md transition-shadow"
                                                />
                                                {order.delivery_method === 'self_pickup' && (
                                                    <div className="text-[9px] font-black text-green-700 uppercase bg-green-50 border border-green-100 rounded-lg px-2 py-0.5 tracking-widest shadow-sm">איסוף עצמי</div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View Card Layout */}
                <div className="lg:hidden divide-y divide-gray-100 pb-20">
                    {orders.map(order => {
                        const customer = typeof order.customer_details === 'string' ? JSON.parse(order.customer_details) : order.customer_details;
                        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                        
                        return (
                            <div key={order.id} className={`p-5 space-y-5 bg-white transition-all ${order.status === 'cancelled' ? 'opacity-70 grayscale-[0.2]' : ''}`}>
                                {/* Header: ID and Time */}
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-gray-900 text-white px-2.5 py-1 rounded-xl text-xs font-black font-mono shadow-md">#{order.id}</span>
                                            <div className="font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-xl text-[10px] shadow-sm">{order.catalog_name}</div>
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider px-1">
                                            {new Date(order.created_at).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })} • {new Date(order.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <CustomDropdown 
                                            options={STATUS_OPTIONS}
                                            value={order.status}
                                            onChange={(newStatus) => handleStatusChange(order.id, newStatus)}
                                            variant="status"
                                            className="!py-2 !px-4 !rounded-2xl !text-[11px] !font-black !shadow-md"
                                        />
                                        {order.delivery_method === 'self_pickup' && (
                                            <div className="text-[9px] font-black text-green-700 uppercase bg-green-50 border border-green-100 rounded-lg px-2 py-0.5 tracking-widest shadow-sm">איסוף עצמי</div>
                                        )}
                                    </div>
                                </div>

                                {/* Customer and Order Summary */}
                                <div className="grid grid-cols-2 gap-4 pt-1">
                                    <div className="space-y-1.5 p-3 rounded-2xl bg-gray-50/50 border border-gray-100/50">
                                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">פרטי לקוח</div>
                                        <div className="font-black text-gray-900 text-sm leading-tight">{customer?.name}</div>
                                        <div className="text-[10px] font-medium text-gray-500 truncate" dir="ltr">{customer?.email}</div>
                                        <div className="text-[11px] font-black text-black tracking-tight" dir="ltr">{customer?.phone}</div>
                                    </div>
                                    <div className="space-y-1.5 p-3 rounded-2xl bg-gray-900 text-white shadow-lg shadow-gray-200">
                                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">סכום כולל</div>
                                        <div className="text-xl font-black"><span dir="ltr">₪ {order.total_amount?.toLocaleString()}</span></div>
                                        <div className="text-[10px] font-bold text-gray-400">{items.length} פריטים שונים</div>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="space-y-2 p-4 rounded-2xl bg-blue-50/30 border border-blue-100/50">
                                    <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest pb-1">פירוט הזמנה:</div>
                                    <ul className="space-y-2">
                                        {items.map((item, i) => (
                                            <li key={i} className="flex gap-2 items-start text-xs font-medium text-gray-800">
                                                <span className="font-black bg-blue-100 text-blue-700 w-6 h-6 flex items-center justify-center rounded-lg text-[10px] shrink-0">{item.quantity}</span>
                                                <div className="flex-1 space-y-0.5">
                                                    <div className="font-black text-gray-900">{item.name}</div>
                                                    <div className="text-[10px] text-gray-500">{String(item.size).replace(/ml$/i, '')} מ"ל • <span dir="ltr">₪ {item.price?.toLocaleString()}</span> ליח'</div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                    {order.free_samples_count > 0 && (
                                        <div className="mt-3 text-pink-700 font-extrabold bg-white border border-pink-100 px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-2 shadow-sm">
                                            <span className="text-base leading-none">🎁</span>
                                            + {order.free_samples_count} דקאנטים במתנה (בבחירת הלקוח)
                                        </div>
                                    )}
                                </div>

                                {/* Notes and Actions */}
                                <div className="flex items-center justify-between gap-4 pt-2">
                                    <div className="flex-1">
                                        {(order.notes || customer?.notes) && (
                                            <div className="text-[10px] text-orange-800 bg-orange-50 border border-orange-100 p-3 rounded-xl leading-relaxed font-bold shadow-sm">
                                                <span className="text-[9px] uppercase tracking-widest opacity-60 block mb-0.5">הערות:</span>
                                                {order.notes || customer?.notes}
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => setDeleteModal({ isOpen: true, orderId: order.id })}
                                        className="bg-red-50 text-red-600 p-3.5 rounded-2xl border border-red-100 active:scale-95 transition-all shadow-sm flex items-center justify-center"
                                        title="מחק הזמנה"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
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
