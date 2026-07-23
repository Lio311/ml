'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Bell, Check, PackageOpen, Users, ArrowUpRight, Trash2 } from 'lucide-react';
import Image from 'next/image';

export default function PreordersClient() {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [notifyingId, setNotifyingId] = useState(null);

    useEffect(() => {
        fetchPreorders();
    }, []);

    const fetchPreorders = async () => {
        try {
            const res = await fetch('/api/preorders');
            if (!res.ok) throw new Error('Failed to fetch preorders');
            const data = await res.json();
            setProducts(data);
        } catch (error) {
            console.error(error);
            toast.error('שגיאה בטעינת נתונים');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNotify = (productId) => {
        toast.custom((t) => (
            <div 
                className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex flex-col gap-3 p-5 border border-gray-100 mx-auto mt-4`} 
                dir="rtl"
            >
                <div className="flex items-start gap-4">
                    <div className="shrink-0 w-10 h-10 bg-black rounded-full flex items-center justify-center">
                        <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-black text-gray-900 text-lg mb-1">שליחת התראות זמינות</h3>
                        <p className="text-sm text-gray-500 leading-relaxed font-medium">
                            האם אתה בטוח שברצונך לסמן את המוצר כזמין ולשלוח מייל לכל הנרשמים? הפעולה תהפוך את המוצר לזמין לרכישה רגילה.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            processNotify(productId);
                        }}
                        className="flex-1 bg-black text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors"
                    >
                        אישור ושליחה
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
                    >
                        ביטול
                    </button>
                </div>
            </div>
        ), { duration: Infinity, position: 'top-center' });
    };

    const processNotify = async (productId) => {
        setNotifyingId(productId);
        try {
            const res = await fetch('/api/preorders/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId })
            });
            
            if (res.ok) {
                const data = await res.json();
                toast.success(`נשלחו הודעות ל-${data.notifiedCount} נרשמים, והמוצר זמין כעת!`);
                fetchPreorders();
            } else {
                const data = await res.json();
                toast.error(data.error || 'שגיאה בשליחת הודעות');
            }
        } catch (error) {
            console.error(error);
            toast.error('שגיאה בתקשורת');
        } finally {
            setNotifyingId(null);
        }
    };

    const handleDeletePreorder = async (preorderId) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק נרשם זה?')) return;
        try {
            const res = await fetch(`/api/preorders/${preorderId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('הנרשם נמחק בהצלחה');
                fetchPreorders();
            } else {
                toast.error('שגיאה במחיקת הנרשם');
            }
        } catch (error) {
            console.error(error);
            toast.error('שגיאה בתקשורת');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-black" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto" dir="rtl">
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-black mb-2 flex items-center gap-3">
                    ניהול הזמנות מוקדמות
                </h1>
                <p className="text-sm md:text-base text-gray-500">
                    מעקב אחר נרשמים להזמנה מוקדמת, ניהול סטטוסים ושליחת התראות כשהמוצר זמין.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {products.length === 0 ? (
                    <div className="col-span-full p-8 md:p-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">אין מוצרים בהזמנה מוקדמת</h3>
                        <p className="text-sm md:text-base text-gray-500">כרגע אין רשימות המתנה פעילות</p>
                    </div>
                ) : (
                    products.map(product => {
                        const total = Number(product.total_registrations) || 0;
                        const notified = Number(product.notified_count) || 0;
                        const converted = Number(product.converted_count) || 0;
                        const pending = total - notified;
                        const conversionRate = notified > 0 ? Math.round((converted / notified) * 100) : 0;

                        return (
                            <div key={product.product_id} className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-6 border-b border-gray-100 flex gap-4">
                                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-white shrink-0 border border-gray-100 p-2">
                                        <Image
                                            src={product.image_url || '/placeholder.png'}
                                            alt={product.name}
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg leading-tight mb-1">
                                            {product.name.replace(new RegExp(`^${product.brand}\\s*-?\\s*`, 'i'), '').trim()}
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-2">{product.brand}</p>
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                                            <Users size={14} />
                                            {total} נרשמים
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-gray-50/50">
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center">
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">סה״כ נרשמו להתראה</p>
                                            <p className="text-2xl font-black text-gray-900">{total}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center">
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">רכשו לאחר התראה</p>
                                            <div className="flex items-end justify-center gap-2">
                                                <p className="text-2xl font-black text-green-600">{converted}</p>
                                                {notified > 0 && (
                                                    <span className="text-sm font-bold text-green-600/70 mb-1 flex items-center">
                                                        ({conversionRate}%)
                                                        <ArrowUpRight size={14} />
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {product.preorders && product.preorders.some(p => p && p.id) && (
                                        <div className="mb-4 bg-white rounded-xl border border-gray-100 p-3">
                                            <p className="text-xs font-bold text-gray-500 mb-2 border-b border-gray-50 pb-2">רשימת ממתינים</p>
                                            <div className="max-h-32 overflow-y-auto custom-scrollbar pr-1">
                                                {product.preorders.filter(p => p && p.id).map(p => (
                                                    <div key={p.id} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-50 last:border-0 group">
                                                        <span className="text-gray-700 truncate" dir="ltr">{p.user_email}</span>
                                                        <button 
                                                            onClick={() => handleDeletePreorder(p.id)}
                                                            className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                            title="מחק נרשם"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {product.is_preorder ? (
                                        <button
                                            onClick={() => handleNotify(product.product_id)}
                                            disabled={notifyingId === product.product_id}
                                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white bg-black hover:bg-gray-800 disabled:opacity-50 transition-all active:scale-95"
                                        >
                                            {notifyingId === product.product_id ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <span>המוצר זמין למכירה (שלח התראות)</span>
                                                    <Bell size={18} />
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-green-700 bg-green-50 border border-green-200">
                                            <Check size={18} />
                                            <span>זמין במלאי (התראות נשלחו)</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
