'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Bell, Check, PackageOpen, Users, ArrowUpRight } from 'lucide-react';
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

    const handleNotify = async (productId) => {
        if (!confirm('האם אתה בטוח שברצונך לסמן את המוצר כזמין ולשלוח מייל לכל הנרשמים? הפעולה תהפוך את המוצר לזמין לרכישה רגילה.')) return;
        
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-black" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto" dir="rtl">
            <div className="mb-8">
                <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
                    <PackageOpen className="w-8 h-8" />
                    ניהול הזמנות מוקדמות
                </h1>
                <p className="text-gray-500">
                    מעקב אחר נרשמים להזמנה מוקדמת, ניהול סטטוסים ושליחת התראות כשהמוצר זמין.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.length === 0 ? (
                    <div className="col-span-full p-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <PackageOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-1">אין מוצרים בהזמנה מוקדמת</h3>
                        <p className="text-gray-500">כרגע אין רשימות המתנה פעילות</p>
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
                                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                                        <Image
                                            src={product.image_url || '/placeholder.png'}
                                            alt={product.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight mb-1">{product.name}</h3>
                                        <p className="text-sm text-gray-500 mb-2">{product.brand}</p>
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                                            <Users size={14} />
                                            {total} נרשמים
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-gray-50/50">
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-white p-4 rounded-2xl border border-gray-100">
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">ממתינים להתראה</p>
                                            <p className="text-2xl font-black text-gray-900">{pending}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl border border-gray-100">
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">רכשו לאחר התראה</p>
                                            <div className="flex items-end gap-2">
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

                                    {product.is_preorder ? (
                                        <button
                                            onClick={() => handleNotify(product.product_id)}
                                            disabled={notifyingId === product.product_id || pending === 0}
                                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white bg-black hover:bg-gray-800 disabled:opacity-50 transition-all active:scale-95"
                                        >
                                            {notifyingId === product.product_id ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <Bell size={18} />
                                                    <span>המוצר זמין למכירה (שלח התראות)</span>
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
