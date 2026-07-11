"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Phone, ShoppingBag, Calendar, TrendingUp, User, ArrowRight, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import EditAddressInput from "../users/EditAddressInput";
import EditSecondaryEmailInput from "../users/EditSecondaryEmailInput";
import UserEmailHistory from "../users/UserEmailHistory";

export default function Customer360Modal({ email, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('orders');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(`/api/admin/customers/history?email=${encodeURIComponent(email)}`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                } else {
                    toast.error("שגיאה בטעינת נתוני לקוח");
                }
            } catch (err) {
                console.error("Fetch history error:", err);
                toast.error("שגיאה בתקשורת עם השרת");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [email]);

    if (!email) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
                dir="rtl"
            >
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">פרופיל לקוח</h2>
                            <p className="text-sm text-gray-500 font-medium">{email}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2.5 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-200"
                    >
                        <X className="w-6 h-6 text-gray-400 font-bold" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-400 font-bold animate-pulse">טוען נתונים...</p>
                        </div>
                    ) : data ? (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            
                            {/* Stats Row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 relative overflow-hidden group">
                                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                                        <TrendingUp className="w-24 h-24" />
                                    </div>
                                    <p className="text-blue-600 font-black text-xs uppercase tracking-widest mb-1">שווי לקוח (LTV)</p>
                                    <h3 className="text-3xl font-black text-blue-900" dir="ltr">₪ {data.stats.totalSpent.toLocaleString()}</h3>
                                </div>
                                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 relative overflow-hidden group">
                                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                                        <ShoppingBag className="w-24 h-24" />
                                    </div>
                                    <p className="text-emerald-600 font-black text-xs uppercase tracking-widest mb-1">הזמנות שבוצעו</p>
                                    <h3 className="text-3xl font-black text-emerald-900">{data.stats.totalOrdersCount}</h3>
                                </div>
                                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 relative overflow-hidden group">
                                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                                        <Calendar className="w-24 h-24" />
                                    </div>
                                    <p className="text-gray-500 font-black text-xs uppercase tracking-widest mb-1">לקוח מאז</p>
                                    <h3 className="text-xl font-black text-gray-900">
                                        {data.profile?.createdAt 
                                            ? new Date(data.profile.createdAt).toLocaleDateString('he-IL') 
                                            : data.orders.length > 0 
                                                ? new Date(data.orders[data.orders.length-1].created_at).toLocaleDateString('he-IL')
                                                : '—'
                                        }
                                    </h3>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="flex flex-wrap gap-4">
                                {data.profile?.phone && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-2xl shadow-sm text-sm font-bold text-gray-700">
                                        <Phone className="w-4 h-4 text-blue-500" />
                                        <span dir="ltr">{data.profile.phone}</span>
                                    </div>
                                )}
                                <EditAddressInput
                                    userId={data.profile?.id}
                                    initialAddress={data.profile?.address}
                                    canEdit={true}
                                    onSaveSuccess={(newAddr) => {
                                        setData(prev => ({
                                            ...prev,
                                            profile: { ...prev.profile, address: newAddr }
                                        }));
                                    }}
                                />
                                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-2xl shadow-sm text-sm font-bold text-gray-700">
                                    <Mail className="w-4 h-4 text-blue-500" />
                                    <span>{email}</span>
                                </div>
                                {data.profile?.id && (
                                    <EditSecondaryEmailInput
                                        userId={data.profile.id}
                                        initialEmail={data.profile.secondary_email}
                                        canEdit={true}
                                        onSaveSuccess={(newEmail) => {
                                            setData(prev => ({
                                                ...prev,
                                                profile: { ...prev.profile, secondary_email: newEmail }
                                            }));
                                        }}
                                    />
                                )}
                                {data.profile?.role && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-2xl shadow-sm text-[10px] font-black uppercase tracking-widest">
                                        {data.profile.role}
                                    </div>
                            {/* Tabs */}
                            <div className="flex items-center gap-8 border-b border-gray-100">
                                <button 
                                    onClick={() => setActiveTab('orders')}
                                    className={`pb-4 text-sm font-black transition-colors relative ${activeTab === 'orders' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    היסטוריית הזמנות
                                    <span className="mr-2 text-xs font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{data.orders.length}</span>
                                    {activeTab === 'orders' && (
                                        <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-t-full" />
                                    )}
                                </button>
                                {data.profile?.id && (
                                    <button 
                                        onClick={() => setActiveTab('emails')}
                                        className={`pb-4 text-sm font-black transition-colors relative ${activeTab === 'emails' ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        היסטורית מיילים
                                        {activeTab === 'emails' && (
                                            <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-t-full" />
                                        )}
                                    </button>
                                )}
                            </div>

                            <AnimatePresence mode="wait">
                                {activeTab === 'orders' && (
                                    <motion.div
                                        key="orders"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-4"
                                    >
                                        <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm">
                                            <div className="overflow-x-auto">
                                        <table className="w-full text-right" dir="rtl">
                                            <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                                <tr>
                                                    <th className="p-4">#</th>
                                                    <th className="p-4">תאריך</th>
                                                    <th className="p-4">סטטוס</th>
                                                    <th className="p-4">פריטים</th>
                                                    <th className="p-4 text-left">סכום</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {data.orders.map((order) => (
                                                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="p-4 text-xs font-black text-gray-400">#{order.id}</td>
                                                        <td className="p-4 text-xs font-bold text-gray-600 whitespace-nowrap">
                                                            {new Date(order.created_at).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                                        </td>
                                                        <td className="p-4">
                                                            {(() => {
                                                                const statusMap = {
                                                                    'pending': { label: 'ממתין', color: 'bg-orange-100 text-orange-700' },
                                                                    'processing': { label: 'בטיפול', color: 'bg-blue-100 text-blue-700' },
                                                                    'shipped': { label: 'נשלח', color: 'bg-indigo-100 text-indigo-700' },
                                                                    'ready_for_pickup': { label: 'מוכן לאיסוף', color: 'bg-emerald-100 text-emerald-700' },
                                                                    'completed': { label: 'הושלם', color: 'bg-green-100 text-green-700' },
                                                                    'cancelled': { label: 'בוטל', color: 'bg-red-100 text-red-700' }
                                                                };
                                                                const s = statusMap[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' };
                                                                return (
                                                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${s.color}`}>
                                                                        {s.label}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </td>
                                                        <td className="p-4 text-xs font-medium text-gray-500 max-w-[240px]">
                                                            <div className="flex flex-wrap gap-1">
                                                                {order.items?.filter(item => item.name || item.brand || item.model).map((item, idx) => {
                                                                    const displayName = item.name || `${item.brand || ''} ${item.model || ''}`.trim() || 'פריט לא ידוע';
                                                                    return (
                                                                        <span key={idx} className="bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100 text-[10px] whitespace-nowrap" dir="rtl">
                                                                            {displayName} {item.size && <span className="opacity-70">({item.size} מ"ל)</span>}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </div>
                                                            {order.coupon_code && (
                                                                <div className="mt-2 text-right">
                                                                    <span className="font-bold text-gray-900 text-[9px]">קוד קופון: </span>
                                                                    <span className="bg-black/70 text-white px-1.5 py-[1px] rounded font-black uppercase text-[9px] tracking-wider inline-block leading-normal">{order.coupon_code}</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-left font-black text-gray-900" dir="ltr">
                                                            ₪ {parseFloat(order.total_amount).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                    </motion.div>
                                )}

                                {activeTab === 'emails' && data.profile?.id && (
                                    <motion.div
                                        key="emails"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm"
                                    >
                                        <UserEmailHistory userId={data.profile.id} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="py-20 text-center">
                            <p className="text-gray-400 font-bold">לא נמצאו נתונים עבור לקוח זה</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-end items-center">
                    <button 
                        onClick={onClose}
                        className="bg-black text-white px-8 py-3 rounded-2xl text-sm font-black transition-all hover:bg-gray-800 shadow-lg active:scale-95"
                    >
                        סגור
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
