"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, RefreshCw, XCircle, Clock, ChevronDown, ChevronUp, Trash2, Server, AlertOctagon, CheckCircle2, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";

export default function CheckoutErrorsPage() {
    const [errors, setErrors] = useState([]);
    const [stats, setStats] = useState({ total: 0, last_24h: 0, last_7d: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [tableExists, setTableExists] = useState(true);
    const [isSettingUp, setIsSettingUp] = useState(false);

    const fetchErrors = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/checkout-errors');
            if (res.ok) {
                const data = await res.json();
                setErrors(data.errors || []);
                setStats(data.stats || {});
                setTableExists(data.tableExists !== false);
            }
        } catch (e) {
            console.error("Failed to fetch errors:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchErrors(); }, []);

    const handleSetup = async () => {
        setIsSettingUp(true);
        try {
            const res = await fetch('/api/admin/checkout-errors', { method: 'POST' });
            if (res.ok) {
                toast.success("הטבלאות נוצרו בהצלחה");
                setTableExists(true);
                fetchErrors();
            }
        } catch (e) {
            toast.error("שגיאה בהגדרת הטבלה");
        } finally {
            setIsSettingUp(false);
        }
    };

    const handleAction = async (id, action) => {
        try {
            const res = await fetch('/api/admin/checkout-errors', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action })
            });
            if (res.ok) {
                toast.success(action === 'delete' ? "השגיאה נמחקה" : (action === 'resolve' ? "סומן כטופל" : "בוטל סימון"));
                fetchErrors();
            } else {
                toast.error("פעולה נכשלה");
            }
        } catch (e) {
            toast.error("שגיאה בביצוע הפעולה");
        }
    };

    const timeAgo = (date) => {
        if (!date) return '';
        const diff = Date.now() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'כרגע';
        if (minutes < 60) return `לפני ${minutes} דקות`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `לפני ${hours} שעות`;
        const days = Math.floor(hours / 24);
        return `לפני ${days} ימים`;
    };

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8" dir="rtl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">שגיאות קופה (Checkout)</h1>
                    <p className="text-sm text-gray-500 mt-1">מעקב אחר משתמשים שניסו להזמין ונתקלו בשגיאה</p>
                </div>
                <div className="flex gap-2">
                    {!tableExists && (
                        <button
                            onClick={handleSetup}
                            disabled={isSettingUp}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-2 rounded-xl transition disabled:opacity-50"
                        >
                            {isSettingUp ? 'מגדיר...' : 'הגדר טבלאות'}
                        </button>
                    )}
                    <button
                        onClick={fetchErrors}
                        className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">רענן</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                    <p className="text-2xl sm:text-3xl font-black text-gray-900">{stats.total || 0}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 font-bold mt-1">סה"כ שגיאות</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                    <p className="text-2xl sm:text-3xl font-black text-red-600">{stats.last_24h || 0}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 font-bold mt-1">24 שעות אחרונות</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                    <p className="text-2xl sm:text-3xl font-black text-orange-600">{stats.last_7d || 0}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 font-bold mt-1">7 ימים אחרונים</p>
                </div>
            </div>

            {/* Error List */}
            {isLoading ? (
                <div className="text-center py-12 text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p>טוען...</p>
                </div>
            ) : errors.length === 0 ? (
                <div className="text-center py-16 bg-green-50 rounded-2xl border border-green-100">
                    <p className="text-green-600 text-lg font-bold mb-1">אין שגיאות קופה!</p>
                    <p className="text-sm text-green-500">כל ההזמנות עוברות בהצלחה</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {errors.map((err) => {
                        const isExpanded = expandedId === err.id;
                        return (
                            <div key={err.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${err.is_resolved ? 'border-green-200 bg-green-50/30' : 'border-gray-100'}`}>
                                <div
                                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50"
                                    onClick={() => setExpandedId(isExpanded ? null : err.id)}
                                >
                                    {err.is_resolved ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    )}
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-bold text-gray-900">{err.user_name || err.user_email || 'לקוח לא מזוהה'}</span>
                                            {err.total_amount > 0 && (
                                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                    {err.total_amount} ₪
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 truncate">{err.error_message}</p>
                                    </div>

                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className="text-xs text-gray-400 hidden sm:inline">{timeAgo(err.created_at)}</span>
                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="px-4 pb-4 pt-2 border-t border-gray-50 bg-gray-50/50">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                            {/* פרטי לקוח */}
                                            <div className="bg-white p-3 rounded-lg border border-gray-100">
                                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">פרטי לקוח</h3>
                                                <div className="text-sm text-gray-800 space-y-1">
                                                    <p><span className="font-medium">שם:</span> {err.user_name || '—'}</p>
                                                    <p><span className="font-medium">אימייל:</span> {err.user_email || '—'}</p>
                                                    <p><span className="font-medium">טלפון:</span> {err.user_phone || '—'}</p>
                                                    {err.user_id && <p className="text-xs text-gray-400 mt-2">ID: {err.user_id}</p>}
                                                </div>
                                            </div>

                                            {/* שגיאה */}
                                            <div className="bg-white p-3 rounded-lg border border-red-100">
                                                <h3 className="text-xs font-black text-red-400 uppercase tracking-widest mb-2">שגיאה</h3>
                                                <p className="text-sm text-red-700 break-all">{err.error_message}</p>
                                            </div>
                                        </div>
                                        
                                        {/* עגלה */}
                                        {err.cart_items && err.cart_items.length > 0 && (
                                            <div className="mt-4 bg-white p-3 rounded-lg border border-gray-100">
                                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                    <ShoppingBag className="w-3.5 h-3.5" />
                                                    פריטים בעגלה ({err.cart_items.length})
                                                </h3>
                                                <div className="space-y-2 mt-2">
                                                    {err.cart_items.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                                            <div>
                                                                <span className="font-medium">{item.name}</span>
                                                                <span className="text-gray-400 text-xs mr-2">{item.size}ml</span>
                                                            </div>
                                                            <div className="text-gray-500">
                                                                {item.quantity} x {item.price} ₪
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* פעולות */}
                                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                                            <button 
                                                onClick={() => handleAction(err.id, 'delete')}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" /> מחק
                                            </button>
                                            
                                            {!err.is_resolved ? (
                                                <button 
                                                    onClick={() => handleAction(err.id, 'resolve')}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> סמן כטופל
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleAction(err.id, 'unresolve')}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                                                >
                                                    בטל סימון טיפול
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
