"use client";

import { useState } from "react";
import Link from "next/link";
import DeleteOrderButton from "./DeleteOrderButton";
import AdminOrderStatusSelect from "./AdminOrderStatusSelect";
import DownloadOrderPDF from "./DownloadOrderPDF";
import DownloadFullOrderPDF from "./DownloadFullOrderPDF";
import SendOrderEmailButton from "./SendOrderEmailButton";
import toast from "react-hot-toast";
import DownloadBatchOrderPDF from "./DownloadBatchOrderPDF";
import CustomDropdown from "../../components/ui/CustomDropdown";
import EditOrderModal from "./EditOrderModal";
import { Edit2, Search } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import Customer360Modal from "./Customer360Modal";
import OrderAlerts from "./OrderAlerts";
import { useInView } from "react-intersection-observer";

const formatDiscoverySize = (label) => {
    if (!label) return 'מארז דוגמיות';
    const nums = label.match(/\d+/g);
    if (nums && nums.length >= 2) {
        return `${nums[0]}X${nums[1]}ml`;
    }
    return label;
};

const STATUS_OPTIONS = [
    { value: 'no_change', label: 'ללא שינוי סטטוס', icon: <div className="w-2 h-2 rounded-full border border-gray-300 bg-transparent" /> },
    { value: 'pending', label: 'ממתין', icon: <div className="w-2 h-2 rounded-full bg-orange-500" /> },
    { value: 'processing', label: 'בטיפול', icon: <div className="w-2 h-2 rounded-full bg-blue-500" /> },
    { value: 'shipped', label: 'נשלח', icon: <div className="w-2 h-2 rounded-full bg-purple-500" /> },
    { value: 'ready_for_pickup', label: 'מוכן לאיסוף', icon: <div className="w-2 h-2 rounded-full bg-indigo-500" /> },
    { value: 'completed', label: 'הושלם', icon: <div className="w-2 h-2 rounded-full bg-green-500" /> },
    { value: 'cancelled', label: 'בוטל', icon: <div className="w-2 h-2 rounded-full bg-gray-400" /> },
];

const DELIVERY_METHOD_OPTIONS = [
    { value: 'no_change', label: 'ללא שינוי שילוח', icon: <div className="w-2 h-2 rounded-full border border-gray-300 bg-transparent" /> },
    { value: 'self_pickup', label: 'איסוף עצמי', icon: <span className="text-[10px]">📍</span> },
    { value: 'mail', label: 'משלוח', icon: <span className="text-[10px]">📦</span> }
];

export default function AdminOrdersListClient({ 
    orders, 
    totalPages, 
    currentPage, 
    totalOrders,
    canEdit, 
    deleteOrder,
    currentLimit,
    currentStatus,
    currentSearch,
    statusCounts
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [selectedOrderIds, setSelectedOrderIds] = useState([]);
    const [batchStatus, setBatchStatus] = useState('no_change');
    const [batchDeliveryMethod, setBatchDeliveryMethod] = useState('no_change');
    const [isApplyingBatch, setIsApplyingBatch] = useState(false);
    const [editingOrder, setEditingOrder] = useState(null);
    const [viewingCustomerEmail, setViewingCustomerEmail] = useState(null);
    
    // Auto-load more logic (infinite scroll) for mobile
    const [displayedOrders, setDisplayedOrders] = useState(orders);
    const { ref: loadMoreRef, inView } = useInView({ threshold: 0.1 });

    useEffect(() => {
        if (currentPage === 1) {
            setDisplayedOrders(orders);
        } else {
            setDisplayedOrders(prev => {
                const prevIds = new Set(prev.map(o => o.id));
                const newOrders = orders.filter(o => !prevIds.has(o.id));
                return [...prev, ...newOrders];
            });
        }
    }, [orders, currentPage]);

    useEffect(() => {
        if (inView && currentPage < totalPages && !isApplyingBatch) {
            const params = new URLSearchParams(searchParams);
            params.set('page', (currentPage + 1).toString());
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [inView, currentPage, totalPages, pathname, router, searchParams, isApplyingBatch]);

    // Search state
    const [searchTerm, setSearchTerm] = useState(currentSearch || '');
    const isInitialMount = useRef(true);

    // Debounced search
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timeoutId = setTimeout(() => {
            const params = new URLSearchParams(searchParams);
            if (searchTerm.trim()) {
                params.set('search', searchTerm.trim());
            } else {
                params.delete('search');
            }
            params.set('page', '1');
            router.push(`${pathname}?${params.toString()}`);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, searchParams, pathname, router]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedOrderIds(orders.map(o => o.id));
        } else {
            setSelectedOrderIds([]);
        }
    };

    const handleSelectOrder = (id) => {
        setSelectedOrderIds(prev => 
            prev.includes(id) ? prev.filter(orderId => orderId !== id) : [...prev, id]
        );
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams);
        if (searchTerm.trim()) {
            params.set('search', searchTerm.trim());
        } else {
            params.delete('search');
        }
        params.set('page', '1');
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleApplyBatchStatus = async () => {
        if (selectedOrderIds.length === 0) return;
        if (batchStatus === 'no_change' && batchDeliveryMethod === 'no_change') {
            toast.error('לא נבחרו שינויים להחלה');
            return;
        }

        setIsApplyingBatch(true);
        const toastId = toast.loading(`מעדכן ${selectedOrderIds.length} הזמנות...`);
        try {
            await Promise.all(selectedOrderIds.map(async (id) => {
                const formData = new FormData();
                formData.set("orderId", id);
                formData.set("status", batchStatus);
                formData.set("deliveryMethod", batchDeliveryMethod);
                await fetch("/api/admin/orders/update-status", {
                    method: "POST",
                    body: formData,
                });
            }));
            
            toast.success('המקבץ התעדכן בהצלחה', { id: toastId });
            setSelectedOrderIds([]);
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } catch (e) {
            toast.error('שגיאה בעדכון חלק מההזמנות', { id: toastId });
        } finally {
            setIsApplyingBatch(false);
        }
    };

    const selectedOrdersData = orders.filter(o => selectedOrderIds.includes(o.id));

    const renderOrdersTable = () => {
        const themeColor = 'blue';

        if (orders.length === 0) {
            return (
                <div className={`p-8 text-center bg-${themeColor}-50/30 border border-dashed border-${themeColor}-100 rounded-2xl mb-8`}>
                    <p className={`text-${themeColor}-600 font-bold italic`}>אין הזמנות בקטגוריה זו</p>
                </div>
            );
        }

        return (
            <div className={`bg-white rounded-2xl shadow-sm border border-${themeColor}-100 overflow-hidden mb-12 relative`}>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto custom-scrollbar">
                    <table className="w-full text-right" dir="rtl">
                        <thead className={`bg-${themeColor}-50/80 text-${themeColor}-700 text-xs uppercase font-bold`}>
                            <tr>
                                <th className="p-4 text-center w-12">
                                    <input 
                                        type="checkbox" 
                                        className={`w-4 h-4 rounded border-gray-300 text-${themeColor}-600 focus:ring-${themeColor}-500 cursor-pointer`}
                                        checked={orders.length > 0 && orders.every(o => selectedOrderIds.includes(o.id))}
                                        onChange={handleSelectAll}
                                    />
                                </th>
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
                                <tr key={order.id} className={`hover:bg-${themeColor}-50/30 transition-colors ${selectedOrderIds.includes(order.id) ? `bg-${themeColor}-50/50` : ''}`}>
                                    <td className="p-4 text-center">
                                       <input 
                                             type="checkbox" 
                                             className={`w-4 h-4 rounded border-gray-300 text-${themeColor}-600 focus:ring-${themeColor}-500 cursor-pointer`}
                                             checked={selectedOrderIds.includes(order.id)}
                                             onChange={() => handleSelectOrder(order.id)}
                                         />
                                    </td>
                                    <td className="p-4 font-bold text-gray-900">{order.id}</td>
                                    <td className="p-4 text-center">
                                        <button 
                                            onClick={() => setViewingCustomerEmail(order.customer_details?.email)}
                                            className="font-bold text-gray-900 leading-tight mb-1 uppercase tracking-tight hover:text-blue-600 transition-colors cursor-pointer text-center w-full"
                                        >
                                            {(order.customer_details?.name || '').replace(/\bnull\b/gi, '').trim()}
                                        </button>
                                        <div className="text-[9px] text-gray-400 font-medium mb-1.5 break-all max-w-[240px] mx-auto selection:bg-blue-100">{order.customer_details?.email}</div>
                                        {order.customer_details?.phone && (
                                            <div className="text-[11px] font-black text-blue-600/90 flex items-center justify-center gap-1.5 bg-blue-50/50 py-1 px-2 rounded-lg border border-blue-100/50 w-fit mx-auto cursor-pointer hover:bg-blue-100/50 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 opacity-70">
                                                    <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.261-.15-3.326-.43a13.006 13.006 0 01-9.244-9.244A13.006 13.006 0 012 5V3.5z" clipRule="evenodd" />
                                                </svg>
                                                <a href={`https://wa.me/972${order.customer_details.phone.replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer" dir="ltr">{order.customer_details.phone}</a>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm text-right">
                                        <ul className="space-y-1">
                                            {order.items?.map((item, idx) => (
                                                <div key={idx}>
                                                    <li className="flex gap-2 text-gray-700 justify-start">
                                                        <span className={`font-bold whitespace-nowrap text-${themeColor}-600`}>x{item.quantity}</span>
                                                        <Link 
                                                            href={item.is_discovery_set ? '/discovery-sets' : (item.type === 'bundle' ? '/bundles' : `/product/${(item.product_id || item.id)?.toString().split('-')[0]}`)}
                                                            className="font-normal text-gray-700 leading-tight hover:text-gray-900 transition-colors"
                                                            target="_blank"
                                                        >
                                                            {item.name || (item.type === 'bundle' ? `חבילת ${item.bundleType}` : `${item.brand} ${item.model}`)}
                                                        </Link>
                                                        <span className="text-gray-400 whitespace-nowrap" dir="ltr">{item.is_discovery_set ? formatDiscoverySize(item.volume_label) : (String(item.size).includes('ml') ? item.size : `${item.size} ml`)}</span>
                                                    </li>
                                                    {item.type === 'bundle' && item.items && item.items.length > 0 && (
                                                        <ul className="pl-4 pr-6 mt-1 space-y-1 list-disc text-[11px] text-gray-500 text-right w-full">
                                                            {item.items.map((subItem, subIdx) => (
                                                                <li key={subIdx} className="text-right">
                                                                    <Link 
                                                                        href={`/product/${(subItem.product_id || subItem.id)?.toString().split('-')[0]}`}
                                                                        className="hover:text-gray-900 transition-colors"
                                                                        target="_blank"
                                                                    >
                                                                        {subItem.brand} {subItem.model} ({item.size}ml)
                                                                    </Link>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            ))}
                                        </ul>
                                        {order.customer_details?.address && (
                                            <div className="mt-2 text-[10px] bg-blue-50 p-2 rounded-lg border border-blue-100 text-blue-900 max-w-[240px] break-words ml-auto mr-0">
                                                <span className="font-bold block mb-0.5 text-right">כתובת משלוח:</span>
                                                <div className="text-right leading-tight">
                                                    {order.customer_details.address.street} {order.customer_details.address.houseNumber}{order.customer_details.address.apartment && order.customer_details.address.apartment !== '0' && ` / ${order.customer_details.address.apartment}`}<br/>
                                                    {order.customer_details.address.city}
                                                </div>
                                            </div>
                                        )}
                                        {order.notes && (
                                            <div className="mt-2 text-[10px] bg-amber-50 p-2 rounded-lg border border-amber-100 text-amber-900 max-w-[240px] break-words ml-auto mr-0">
                                                <span className="font-bold block mb-0.5 text-right">הערות:</span>
                                                {order.notes}
                                            </div>
                                        )}
                                        {order.coupon_code && (
                                            <div className="mt-2 text-right">
                                                <span className="font-bold text-gray-900 text-[9px]">קוד קופון: </span>
                                                <span className="bg-black/70 text-white px-1.5 py-[1px] rounded font-black uppercase text-[9px] tracking-wider inline-block leading-normal">{order.coupon_code}</span>
                                            </div>
                                        )}
                                        <OrderAlerts order={order} />
                                    </td>
                                    <td className="p-4 font-black text-gray-900 whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-1.5">
                                            {(order.delivery_method === 'mail' || order.delivery_method === 'shipping') && (
                                                <span className="text-[11px] text-blue-500/80 font-bold bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100" dir="ltr" title="תוספת משלוח">+30</span>
                                            )}
                                            <span><span dir="ltr">₪ {(order.total_amount - (order.delivery_method === 'mail' || order.delivery_method === 'shipping' ? (order.customer_details?.shipping_cost ?? 30) : 0))?.toLocaleString()}</span></span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center">
                                            {order.free_samples_count > 0 ? (
                                                <div className={`inline-flex flex-col items-center text-[10px] text-${themeColor}-700 bg-${themeColor}-50 px-2 py-1 rounded-lg border border-${themeColor}-100`} title="דוגמיות מתנה">
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
                                                        order.status === 'ready_for_pickup' ? 'bg-indigo-100 text-indigo-800' :
                                                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                'bg-gray-100 text-gray-800'
                                                }`}>
                                                {
                                                    order.status === 'pending' ? 'ממתין' :
                                                        order.status === 'processing' ? 'בטיפול' :
                                                            order.status === 'shipped' ? 'נשלח' :
                                                                order.status === 'ready_for_pickup' ? 'מוכן לאיסוף' :
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
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button 
                                                            onClick={() => setEditingOrder(order)}
                                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                            title="ערוך הזמנה"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                            </svg>
                                                        </button>
                                                        <DeleteOrderButton orderId={order.id} deleteAction={deleteOrder} />
                                                    </div>
                                                    <div className="flex flex-col gap-2 mt-1">
                                                        <AdminOrderStatusSelect orderId={order.id} initialStatus={order.status} />
                                                        <DownloadOrderPDF order={order} />
                                                        <DownloadFullOrderPDF order={order} />
                                                        <SendOrderEmailButton order={order} />
                                                    </div>
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
                <div className="md:hidden divide-y divide-gray-100/50">
                    {displayedOrders.map((order) => (
                        <div key={order.id} className={`p-5 hover:bg-${themeColor}-50/30 transition-colors ${selectedOrderIds.includes(order.id) ? `bg-${themeColor}-50/30` : 'bg-white'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        {canEdit && (
                                            <input 
                                                type="checkbox" 
                                                className={`w-5 h-5 rounded border-gray-300 text-${themeColor}-600 focus:ring-${themeColor}-500 cursor-pointer ml-1`}
                                                checked={selectedOrderIds.includes(order.id)}
                                                onChange={() => handleSelectOrder(order.id)}
                                            />
                                        )}
                                        <span className="text-[10px] font-black text-gray-400 leading-none">#{order.id}</span>
                                        <div className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${order.status === 'pending' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                                            order.status === 'processing' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                                order.status === 'shipped' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                                    order.status === 'ready_for_pickup' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                                        order.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-100' :
                                                            'bg-gray-50 text-gray-700 border border-gray-100'
                                            }`}>
                                            {
                                                order.status === 'pending' ? 'ממתין' :
                                                    order.status === 'processing' ? 'בטיפול' :
                                                        order.status === 'shipped' ? 'נשלח' :
                                                            order.status === 'ready_for_pickup' ? 'מוכן לאיסוף' :
                                                                order.status === 'completed' ? 'הושלם' :
                                                                    order.status === 'cancelled' ? 'בוטל' :
                                                                        order.status
                                            }
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setViewingCustomerEmail(order.customer_details?.email)}
                                        className="font-black text-gray-900 text-base text-right hover:text-blue-600 transition-colors"
                                    >
                                        {(order.customer_details?.name || '').replace(/\bnull\b/gi, '').trim()}
                                    </button>
                                    <div className="text-[9px] font-medium text-gray-500 mb-1">{order.customer_details?.email}</div>
                                    {order.customer_details?.phone && (
                                        <div className="text-[10px] font-black text-blue-600/90 flex items-center gap-1.5 bg-blue-50/50 py-0.5 px-2 rounded-lg border border-blue-100/50 w-fit cursor-pointer hover:bg-blue-100/50 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 opacity-70">
                                                <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.261-.15-3.326-.43a13.006 13.006 0 01-9.244-9.244A13.006 13.006 0 012 5V3.5z" clipRule="evenodd" />
                                            </svg>
                                            <a href={`https://wa.me/972${order.customer_details.phone.replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer" dir="ltr">{order.customer_details.phone}</a>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-end shrink-0">
                                    <div className="flex items-center justify-end gap-1.5 mb-1.5">
                                        {(order.delivery_method === 'mail' || order.delivery_method === 'shipping') && (
                                            <span className="text-[11px] text-blue-500/80 font-bold bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100" dir="ltr" title="תוספת משלוח">+30</span>
                                        )}
                                        <div className="font-black text-gray-900 text-lg leading-none" dir="ltr">₪ {(order.total_amount - (order.delivery_method === 'mail' || order.delivery_method === 'shipping' ? (order.customer_details?.shipping_cost ?? 30) : 0))?.toLocaleString()}</div>
                                    </div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                                        {new Date(order.created_at).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                    </div>
                                </div>
                            </div>

                            <div className={`mb-5 bg-${themeColor}-50/30 rounded-[1.5rem] border border-${themeColor}-100/50 p-4`}>
                                <h4 className="text-[9px] uppercase font-black text-gray-400 mb-3 tracking-widest opacity-60">תכולת ההזמנה</h4>
                                <ul className="space-y-2.5">
                                    {order.items?.map((item, idx) => (
                                        <li key={idx} className="flex flex-col text-[13px]">
                                            <div className="flex justify-between items-start">
                                                <div className="flex gap-2.5 flex-1">
                                                    <span className={`font-black text-${themeColor}-600 bg-${themeColor}-50 w-6 h-6 rounded-lg flex items-center justify-center text-[11px] shrink-0 border border-${themeColor}-100/50`}>{item.quantity}</span>
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <Link 
                                                            href={item.is_discovery_set ? '/discovery-sets' : (item.type === 'bundle' ? '/bundles' : `/product/${(item.product_id || item.id)?.toString().split('-')[0]}`)}
                                                            className="font-normal text-gray-700 leading-tight pt-0.5 hover:text-gray-900 transition-colors"
                                                            target="_blank"
                                                        >
                                                            {item.name || (item.type === 'bundle' ? `חבילת ${item.bundleType}` : `${item.brand} ${item.model}`)}
                                                        </Link>
                                                        {item.type !== 'bundle' && (
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    navigator.clipboard.writeText(item.name || (item.type === 'bundle' ? `חבילת ${item.bundleType}` : `${item.brand} ${item.model}`));
                                                                    toast.success('שם הועתק');
                                                                }}
                                                                className="md:hidden flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md active:bg-blue-100 transition-colors"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                                                                </svg>
                                                                העתק
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-gray-400 font-black text-[10px] uppercase tracking-tighter pt-1 shrink-0 bg-white px-2 py-0.5 rounded-lg border border-gray-100" dir="ltr">
                                                    {item.is_discovery_set ? formatDiscoverySize(item.volume_label) : (String(item.size).includes('ml') ? item.size : `${item.size}ml`)}
                                                </span>
                                            </div>
                                            {item.type === 'bundle' && item.items && item.items.length > 0 && (
                                                <div className="mr-6 bg-white/50 p-2.5 rounded-xl border border-gray-100/50 mt-2">
                                                    <ul className="space-y-3">
                                                        {item.items.map((subItem, subIdx) => (
                                                            <li key={subIdx} className="flex flex-col text-[13px]">
                                                                <div className="flex justify-between items-start">
                                                                    <div className="flex gap-2.5 flex-1">
                                                                        <span className="text-gray-300 font-black text-xl flex items-center justify-center shrink-0 w-6" style={{ transform: 'scaleX(-1) translateY(-2px)' }}>
                                                                            ↳
                                                                        </span>
                                                                        <div className="flex flex-col gap-1 items-start">
                                                                            <span className="font-normal text-gray-700 leading-tight pt-0.5">{subItem.brand} {subItem.model}</span>
                                                                            <button 
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    navigator.clipboard.writeText(`${subItem.brand} ${subItem.model}`);
                                                                                    toast.success('שם הועתק');
                                                                                }}
                                                                                className="md:hidden flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md active:bg-blue-100 transition-colors"
                                                                            >
                                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                                                                                </svg>
                                                                                העתק
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-gray-400 font-black text-[10px] uppercase tracking-tighter pt-1 shrink-0 bg-white px-2 py-0.5 rounded-lg border border-gray-100" dir="ltr">
                                                                        {String(item.size).includes('ml') ? item.size : `${item.size}ml`}
                                                                    </span>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                                {order.customer_details?.address && (
                                    <div className="mt-4 text-[11px] font-medium text-blue-800 bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50 leading-relaxed shadow-sm text-right">
                                        <span className="text-[9px] font-black uppercase tracking-widest block mb-1 underline decoration-blue-200 decoration-2 underline-offset-2">כתובת משלוח:</span>
                                        <div>
                                            {order.customer_details.address.street} {order.customer_details.address.houseNumber}{order.customer_details.address.apartment && order.customer_details.address.apartment !== '0' && ` / ${order.customer_details.address.apartment}`}<br/>
                                            {order.customer_details.address.city}
                                        </div>
                                    </div>
                                )}
                                {order.notes && (
                                    <div className="mt-4 text-[11px] font-medium text-amber-800 bg-amber-50/50 p-3 rounded-2xl border border-amber-100/50 leading-relaxed shadow-sm">
                                        <span className="text-[9px] font-black uppercase tracking-widest block mb-1 underline decoration-amber-200 decoration-2 underline-offset-2">הערה מיוחדת:</span>
                                        {order.notes}
                                    </div>
                                )}
                                {order.coupon_code && (
                                    <div className="mt-4 flex items-center gap-2 py-1 px-2.5 bg-black/70 text-white rounded-lg border border-white/10 shadow-sm w-fit transition-all hover:bg-black/80">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-white/60">קוד קופון:</span>
                                        <span className="font-black tracking-widest uppercase text-[10px]">{order.coupon_code}</span>
                                    </div>
                                )}
                                <OrderAlerts order={order} />
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                {order.free_samples_count > 0 && (
                                    <div className={`flex items-center gap-2 text-[10px] font-black text-${themeColor}-700 bg-${themeColor}-50 px-3 py-1.5 rounded-xl border border-${themeColor}-100 shadow-sm`}>
                                        <span className="text-xs">🎁</span>
                                        <span className="uppercase tracking-widest">{order.free_samples_count} דוגמיות</span>
                                    </div>
                                )}

                                <div className={`flex items-center gap-2 text-[10px] font-black px-3 py-1.5 rounded-xl border shadow-sm ${order.delivery_method === 'self_pickup' ? 'text-green-700 bg-green-50 border-green-100' : 'text-sky-700 bg-sky-50 border-sky-100'}`}>
                                    <span>{order.delivery_method === 'self_pickup' ? '📍' : '📦'}</span>
                                    <span className="uppercase tracking-widest">{order.delivery_method === 'self_pickup' ? 'איסוף עצמי' : 'משלוח'}</span>
                                </div>
                            </div>

                            {canEdit && (
                                <div className="mt-5 flex flex-col gap-3 pt-4 border-t border-gray-100/50">
                                    <div className="flex gap-3 w-full items-center">
                                        <div className="flex-1">
                                            <AdminOrderStatusSelect orderId={order.id} initialStatus={order.status} />
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button 
                                                onClick={() => setEditingOrder(order)}
                                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all flex items-center justify-center"
                                                title="ערוך"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                </svg>
                                            </button>
                                            <DeleteOrderButton orderId={order.id} deleteAction={deleteOrder} />
                                        </div>
                                    </div>
                                    <DownloadOrderPDF order={order} />
                                    <DownloadFullOrderPDF order={order} />
                                    <SendOrderEmailButton order={order} />
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {currentPage < totalPages && (
                        <div ref={loadMoreRef} className="py-8 flex justify-center items-center">
                            <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                            <span className="mr-3 text-xs font-bold text-gray-500 uppercase tracking-widest">טוען עוד הזמנות...</span>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className={`hidden md:flex justify-center items-center gap-4 py-6 bg-gray-50/50 border-t border-${themeColor}-50`}>
                        <Link
                            href={`/admin/orders?page=${Math.max(1, currentPage - 1)}&limit=${currentLimit === 5000 ? 'all' : currentLimit}&status=${currentStatus}`}
                            className={`w-10 h-10 flex items-center justify-center border rounded-xl hover:bg-gray-100 transition-all ${currentPage === 1 ? 'opacity-30 pointer-events-none' : 'shadow-sm'}`}
                            aria-disabled={currentPage === 1}
                        >
                            →
                        </Link>

                        <div className="flex gap-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <Link
                                    key={p}
                                    href={`/admin/orders?page=${p}&limit=${currentLimit === 5000 ? 'all' : currentLimit}&status=${currentStatus}`}
                                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${currentPage === p ? `bg-${themeColor}-600 text-white shadow-md scale-110` : 'text-gray-400 hover:bg-gray-100'}`}
                                >
                                    {p}
                                </Link>
                            ))}
                        </div>

                        <Link
                            href={`/admin/orders?page=${Math.min(totalPages, currentPage + 1)}&limit=${currentLimit === 5000 ? 'all' : currentLimit}&status=${currentStatus}`}
                            className={`w-10 h-10 flex items-center justify-center border rounded-xl hover:bg-gray-100 transition-all ${currentPage === totalPages ? 'opacity-30 pointer-events-none' : 'shadow-sm'}`}
                            aria-disabled={currentPage === totalPages}
                        >
                            ←
                        </Link>
                    </div>
                )}
            </div>
        );
    };

    const filterOptions = [
        { value: 'all', label: 'הכל', color: 'gray' },
        { value: 'pending', label: 'ממתין', color: 'orange' },
        { value: 'processing', label: 'בטיפול', color: 'blue' },
        { value: 'shipped', label: 'נשלח', color: 'purple' },
        { value: 'ready_for_pickup', label: 'מוכן לאיסוף', color: 'indigo' },
        { value: 'completed', label: 'הושלם', color: 'green' },
        { value: 'cancelled', label: 'בוטל', color: 'gray' },
    ];

    return (
        <div className="pb-8 relative">
            {/* Results per page selector - placed under the bell area */}
            <div className="hidden relative md:absolute left-0 top-0 md:flex items-center justify-end md:justify-start gap-2 z-10 md:translate-y-14 mb-6 md:mb-0 w-full md:w-auto">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">הצג:</span>
                <div className="flex bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-0.5 shadow-sm">
                    {[10, 50, 100, 'all'].map((limit) => (
                        <button
                            key={limit}
                            onClick={() => {
                                const params = new URLSearchParams(searchParams);
                                params.set('limit', limit === 'all' ? 'all' : limit.toString());
                                params.set('page', '1');
                                router.push(`${pathname}?${params.toString()}`);
                            }}
                            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                                (limit === 'all' ? currentLimit === 5000 : currentLimit === limit)
                                    ? 'bg-black text-white shadow-md'
                                    : 'text-gray-400 hover:bg-gray-100 hover:text-black'
                            }`}
                        >
                            {limit === 'all' ? 'הכל' : limit}
                        </button>
                    ))}
                </div>
            </div>

            {/* Header and Batch Action Bar */}
            <div className="flex flex-col items-center justify-center gap-4 mb-8">
                <div className="flex flex-col items-center text-center">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 shrink-0 font-black tracking-tighter">ניהול הזמנות</h1>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs md:text-sm font-bold text-blue-600">סה"כ הזמנות שבוצעו באתר: {statusCounts['all'] || totalOrders}</p>
                    </div>
                </div>

                {/* Search / Filters / Batch Actions Area */}
                <div className="w-full relative min-h-[110px] flex items-center justify-center">
                    {selectedOrderIds.length > 0 && canEdit ? (
                        <div className="bg-white border-2 border-black text-gray-800 p-2.5 md:p-3 rounded-2xl shadow-xl z-50 flex flex-col md:flex-row items-center gap-4 animate-in fade-in zoom-in-95 w-full xl:w-auto">
                            <div className="font-bold flex items-center justify-center gap-2.5 w-full md:w-auto text-sm md:text-base border-b md:border-b-0 border-gray-100 pb-3 md:pb-0 md:pl-2 whitespace-nowrap">
                                <span className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">{selectedOrderIds.length}</span>
                                <span className="text-black font-black uppercase tracking-widest text-[10px] whitespace-nowrap">סומנו לעדכון</span>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-3 md:gap-6 w-full md:w-auto md:mr-6">
                                <div className="min-w-[140px] md:min-w-[170px] flex-1">
                                    <CustomDropdown
                                        options={STATUS_OPTIONS}
                                        value={batchStatus}
                                        onChange={setBatchStatus}
                                        variant="status"
                                        fullWidth={true}
                                    />
                                </div>
                                <div className="min-w-[140px] md:min-w-[170px] flex-1">
                                    <CustomDropdown
                                        options={DELIVERY_METHOD_OPTIONS}
                                        value={batchDeliveryMethod}
                                        onChange={setBatchDeliveryMethod}
                                        variant="status"
                                        fullWidth={true}
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handleApplyBatchStatus}
                                disabled={isApplyingBatch || (batchStatus === 'no_change' && batchDeliveryMethod === 'no_change')}
                                className="w-full md:w-auto px-6 py-2.5 bg-black text-white rounded-xl font-bold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 whitespace-nowrap"
                            >
                                {isApplyingBatch ? 'מעדכן...' : 'החל שינויים'}
                            </button>
                            <div className="hidden md:block w-px h-8 bg-gray-200 mx-2"></div>
                            <div className="w-full md:w-auto pt-3 md:pt-0 border-t border-gray-100 md:border-t-0 flex justify-center whitespace-nowrap">
                                <DownloadBatchOrderPDF selectedOrders={selectedOrdersData} onComplete={() => setSelectedOrderIds([])} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center w-full animate-in fade-in duration-300">
                            {/* Smart Search Bar Row */}
                            <div className="w-full max-w-2xl relative z-10">
                                <form onSubmit={handleSearch} className="w-full relative group">
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="block w-full rounded-2xl border-0 py-3 pl-4 pr-12 text-gray-900 ring-0 focus:ring-0 outline-none focus:outline-none sm:text-sm sm:leading-6 bg-white shadow-sm transition-all"
                                        placeholder="חיפוש לפי שם, טלפון, אימייל, או מס' הזמנה..."
                                    />
                                    <button type="submit" className="hidden" />
                                </form>
                            </div>

                            {/* Status Filter Buttons */}
                            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                                {filterOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => {
                                            const params = new URLSearchParams(searchParams);
                                            params.set('status', opt.value);
                                            params.set('page', '1');
                                            router.push(`${pathname}?${params.toString()}`);
                                        }}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border shadow-sm ${
                                            currentStatus === opt.value
                                                ? `bg-black text-white border-black scale-105 shadow-md`
                                                : `bg-white text-gray-400 border-gray-100 hover:border-gray-300 hover:text-gray-600`
                                        }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${
                                            opt.value === 'all' ? 'bg-gray-300' :
                                            opt.value === 'pending' ? 'bg-orange-500' :
                                            opt.value === 'processing' ? 'bg-blue-500' :
                                            opt.value === 'shipped' ? 'bg-purple-500' :
                                            opt.value === 'ready_for_pickup' ? 'bg-indigo-500' :
                                            opt.value === 'completed' ? 'bg-green-500' :
                                            'bg-gray-400'
                                        }`} />
                                        {opt.label}
                                        {statusCounts[opt.value] > 0 && (
                                            <span className={`ms-1 px-1.5 py-0.5 rounded-lg text-[9px] ${
                                                currentStatus === opt.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
                                            }`}>
                                                {statusCounts[opt.value]}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Orders Section */}
            {renderOrdersTable()}

            {/* Edit Order Modal */}
            <AnimatePresence>
                {editingOrder && (
                    <EditOrderModal 
                        order={editingOrder} 
                        onClose={() => setEditingOrder(null)} 
                        onSuccess={() => {
                            setEditingOrder(null);
                            window.location.reload();
                        }}
                    />
                )}
            </AnimatePresence>
            {/* Customer 360 Modal */}
            <AnimatePresence>
                {viewingCustomerEmail && (
                    <Customer360Modal 
                        email={viewingCustomerEmail} 
                        onClose={() => setViewingCustomerEmail(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
