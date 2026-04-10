"use client";

import { useState, useEffect } from "react";
import Image from "@/app/components/CImage";
import toast from "react-hot-toast";
import { Bell, Package, Search, Loader2, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackInStockClient() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notifyingId, setNotifyingId] = useState(null);
    const [stockValues, setStockValues] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const router = useRouter();

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/stock-notifications');
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            } else {
                toast.error("שגיאה בטעינת המוצרים");
            }
        } catch (err) {
            console.error(err);
            toast.error("שגיאה בתקשורת");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleNotify = async (productId) => {
        const newStock = stockValues[productId];
        if (!newStock || isNaN(newStock) || Number(newStock) <= 0) {
            toast.error("נא להזין מלאי תקין (גדול מ-0)");
            return;
        }

        setNotifyingId(productId);
        try {
            const res = await fetch('/api/admin/stock-notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, newStock: Number(newStock) })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(`נשלחו ${data.notifiedCount} התראות והמלאי עודכן`);
                // Refresh internal state and DB
                fetchProducts();
                router.refresh();
            } else {
                toast.error(data.error || "שגיאה בשליחת התראות");
            }
        } catch (err) {
            toast.error("שגיאה בתקשורת");
        } finally {
            setNotifyingId(null);
        }
    };

    const filteredProducts = products.filter(p => 
        (p.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.brand_he || '').includes(searchTerm) ||
        (p.model_he || '').includes(searchTerm)
    );

    return (
        <div className="space-y-8" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">ניהול חזרה למלאי</h1>
                    <p className="text-gray-500 text-sm">ניהול בקשות עדכון והפצת התראות במייל ללקוחות</p>
                </div>
                
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="חפש מוצר..."
                        className="bg-white border border-gray-200 rounded-xl pr-10 pl-4 py-2.5 w-full md:w-80 outline-none focus:ring-2 focus:ring-black/5"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 italic text-gray-400">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-gray-200" />
                    <p>טוען נתונים...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-20 text-center shadow-sm">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-gray-200" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">אין בקשות ממתינות</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">נכון לעכשיו אין לקוחות שנרשמו להתראות על מוצרים שאינם במלאי.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredProducts.map((product) => (
                        <div key={product.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6 transition-all hover:shadow-md hover:border-gray-200">
                            {/* Product Image */}
                            <div className="relative w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden shadow-inner border border-gray-100 flex-shrink-0">
                                <Image
                                    src={product.image_url || '/placeholder.png'}
                                    alt={product.brand}
                                    fill
                                    className="object-contain p-2"
                                />
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 text-center md:text-right">
                                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                                    <h3 className="text-lg font-black text-gray-900">{product.brand_he || product.brand}</h3>
                                    <span className="hidden md:block text-gray-300">|</span>
                                    <p className="text-gray-600 font-bold">{product.model_he || product.model}</p>
                                </div>
                                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
                                    <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-bold">
                                        <Bell className="w-4 h-4" />
                                        <span>{product.subscriber_count} ממתינים להתראה</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-gray-50 text-gray-500 px-3 py-1.5 rounded-full font-bold">
                                        <Package className="w-4 h-4" />
                                        <span>מלאי נוכחי: {product.stock} מ״ל</span>
                                    </div>
                                    {!product.active && (
                                        <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full font-bold">
                                            <AlertCircle className="w-4 h-4" />
                                            <span>המוצר בטיוטה - יש להפעיל כדי לשלוח</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Restock Form */}
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-4 md:mt-0 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="space-y-1 w-full sm:w-32">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">מלאי חדש (מ״ל)</label>
                                    <input
                                        type="number"
                                        placeholder="למשל: 100"
                                        value={stockValues[product.id] || ""}
                                        onChange={(e) => setStockValues({ ...stockValues, [product.id]: e.target.value })}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 font-bold outline-none focus:border-black transition-colors"
                                    />
                                </div>
                                
                                <button
                                    onClick={() => handleNotify(product.id)}
                                    disabled={notifyingId === product.id || !product.active}
                                    className={`w-full sm:w-auto h-[48px] px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                                        !product.active 
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                        : 'bg-black text-white hover:bg-gray-800'
                                    }`}
                                >
                                    {notifyingId === product.id ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Bell className="w-5 h-5" />
                                    )}
                                    <span>עדכן ושלח מיילים</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 text-blue-900">
                <div className="flex gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Loader2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-1">איך המערכת עובדת?</h4>
                        <ul className="text-sm space-y-2 opacity-90">
                            <li>• המערכת שולחת מייל אוטומטי לכל הלקוחות שנרשמו להתראה על מוצר ספציפי.</li>
                            <li>• לאחר השליחה, הלקוחות מועברים למצב "קיבלו התראה" והם יורדים מהרשימה הנוכחית.</li>
                            <li>• <strong>חשוב:</strong> המערכת מאפשרת שליחה רק למוצרים שהם במצב "פעיל" (Active) כדי למנוע שליחת קישורים חסומים במייל.</li>
                            <li>• ההתראה כוללת תמונה של המוצר, שם המותג בעברית וקישור ישיר לרכישה.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
