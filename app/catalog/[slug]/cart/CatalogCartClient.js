"use client";

import { useCatalogCart } from "../CatalogCartContext";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function CatalogCartClient({ slug }) {
    const { cartItems, removeFromCart, updateQuantity, clearCart, subtotal, totalItems } = useCatalogCart();
    
    // Catalog specific details
    const [catalogInfo, setCatalogInfo] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    // Order Notes State
    const [notes, setNotes] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [isSelfPickup, setIsSelfPickup] = useState(false);

    const shippingCost = 30;
    const effectiveShipping = isSelfPickup ? 0 : shippingCost;
    const effectiveTotal = subtotal + effectiveShipping;

    // Fetch catalog id to send with order
    useEffect(() => {
        const fetchCat = async () => {
             try {
                const res = await fetch(`/api/user-catalogs/public-by-slug/${slug}`);
                if (res.ok) {
                    const data = await res.json();
                    setCatalogInfo(data.catalog);
                }
             } catch(e) {}
        };
        fetchCat();
    }, [slug]);

    const validatePhone = (phone) => {
        if (!phone) return "מספר טלפון הוא שדה חובה";
        const cleanPhone = phone.replace(/\\D/g, '');
        if (!cleanPhone.startsWith('05')) return "מספר טלפון חייב להתחיל ב-05";
        if (cleanPhone.length !== 10) return "מספר טלפון חייב להכיל 10 ספרות";
        return "";
    };

    const handleCheckout = async () => {
        const pError = validatePhone(phoneNumber);
        if (pError) {
            setPhoneError(pError);
            toast.error(pError);
            return;
        }

        if (!catalogInfo) {
             toast.error("שגיאה בטעינת הקטלוג");
             return;
        }

        setIsSubmitting(true);
        // Create Order via API specific to catalog
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cartItems.map(i => ({...i})), // The size is already in `i.size` from the catalog client
                    total: effectiveTotal,
                    freeSamples: 0, // No free samples for custom catalogs by default
                    notes: notes,
                    deliveryMethod: isSelfPickup ? 'self_pickup' : 'mail',
                    phoneNumber: phoneNumber.replace(/\\D/g, ''),
                    catalogId: catalogInfo.id // IMPORTANT: Pass the catalog ID
                })
            });

            if (res.ok) {
                clearCart();
                router.push('/checkout/success'); // Can reuse main site success page
            } else {
                const data = await res.json();
                toast.error(`אירעה שגיאה לצערי: ${data.error}`);
                setIsSubmitting(false);
            }
        } catch (e) {
            console.error(e);
            toast.error('אירעה שגיאה. בדוק חיבור לרשת.');
            setIsSubmitting(false);
        }
    };


    if (isSubmitting) {
        return (
            <div className="container py-20 text-center flex flex-col items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-black mb-4"></div>
                <h2 className="text-2xl font-bold animate-pulse">משדר את ההזמנה שלך...</h2>
                <p className="text-gray-500 mt-2">אנא המתן, מעביר אותך לאישור.</p>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="container py-20 text-center">
                <h1 className="text-3xl font-bold mb-4">הסל ריק</h1>
                <p className="text-gray-500 mb-8">עדיין לא הוספת מוצרים מהקטלוג.</p>
                <Link href={`/catalog/${slug}`} className="px-6 py-2 bg-black text-white rounded font-bold hover:bg-gray-800 transition">
                    חזרה לקטלוג {catalogInfo?.name}
                </Link>
            </div>
        );
    }

    return (
        <div className="container py-12 px-4 max-w-5xl mx-auto flex flex-col lg:flex-row gap-12">
            {/* Items List */}
            <div className="flex-1 space-y-6">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">העגלה שלך - {catalogInfo?.name}</h1>
                </div>

                {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 border p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition">
                        <div className="w-24 h-24 bg-gray-50 flex items-center justify-center text-2xl rounded-lg overflow-hidden relative border border-gray-100 flex-shrink-0">
                            {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                                <span>📦</span>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg leading-tight truncate">{item.name}</h3>
                            {item.size && item.size !== '1' && (
                                <p className="text-sm text-gray-500 font-mono mt-1" dir="ltr">{item.size}</p>
                            )}
                            <div className="text-sm font-black mt-2 text-black">{item.price} ₪</div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition">-</button>
                            <span className="w-8 text-center font-medium font-mono border rounded">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition">+</button>
                        </div>

                        <button onClick={() => removeFromCart(item.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-full transition" aria-label="Remove">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>

            {/* Checkout Area */}
            <div className="w-full lg:w-[400px]">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl sticky top-24">
                     <h2 className="text-xl font-bold border-b pb-4 mb-6">סיכום הזמנה</h2>

                     <div className="flex justify-between items-center text-lg mb-6">
                        <span className="text-gray-600">סכום ביניים</span>
                        <div className="flex items-center gap-2">
                            <span className="font-black whitespace-nowrap">{subtotal} ₪</span>
                        </div>
                    </div>

                    {/* Delivery Method Selection */}
                    <div className="space-y-3 mb-6">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">שיטת אספקה</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setIsSelfPickup(false)}
                                className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 text-center ${!isSelfPickup ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'}`}
                            >
                                <span className="text-sm font-bold">משלוח</span>
                                <span className="text-xs font-mono">{shippingCost} ₪</span>
                            </button>
                            <button
                                onClick={() => setIsSelfPickup(true)}
                                className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 text-center ${isSelfPickup ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'}`}
                            >
                                <span className="text-sm font-bold">איסוף עצמי</span>
                                <span className="text-xs font-mono text-green-500">חינם</span>
                            </button>
                        </div>
                    </div>

                    {/* Total Area */}
                    <div className="border-t border-b py-4 my-6">
                         <div className="flex justify-between items-end">
                            <span className="text-xl font-bold">סה״כ לתשלום</span>
                            <span className="text-3xl font-black text-black">{effectiveTotal} <span className="text-xl">₪</span></span>
                        </div>
                    </div>

                     {/* Details Form Area */}
                     <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">מספר טלפון לתיאום <span className="text-red-500">*</span></label>
                            <input
                                type="tel"
                                required
                                value={phoneNumber}
                                onChange={(e) => {
                                    setPhoneNumber(e.target.value);
                                    if (phoneError) setPhoneError('');
                                }}
                                className={`w-full p-3 border-2 rounded-xl focus:ring-0 focus:border-black outline-none transition-colors text-lg ${phoneError ? 'border-red-400 bg-red-50 text-red-900' : 'border-gray-200'}`}
                                placeholder="05X-XXXXXXX"
                                dir="ltr"
                            />
                            {phoneError && <p className="text-red-500 text-sm mt-1 font-bold">{phoneError}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">הערות להזמנה</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-black outline-none resize-none transition-colors text-sm"
                                placeholder="כתובת, בקשות מיוחדות..."
                                rows="3"
                            />
                        </div>
                    </div>

                    <p className="text-xs text-center text-gray-500 mb-4 bg-gray-50 p-2 rounded">
                        התשלום יתבצע מול הספק חיצוני. בשליחת ההזמנה, פנייתך תועבר ישירות לבעל הקטלוג.
                    </p>

                     <button
                        onClick={handleCheckout}
                        disabled={isSubmitting || !catalogInfo}
                        className="w-full py-4 bg-blue-600 text-white text-lg rounded-xl font-bold hover:bg-blue-700 transition shadow-lg active:scale-[0.98] disabled:opacity-50"
                    >
                        שליחת הזמנה 🚀
                    </button>
                </div>
            </div>
        </div>
    );
}
