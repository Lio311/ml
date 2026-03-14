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
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 9) return "מספר טלפון קצר מדי";
        if (cleanPhone.length > 10) return "מספר טלפון ארוך מדי";
        if (!/^05\d{8}$/.test(cleanPhone) && !/^0[23489]\d{7}$/.test(cleanPhone)) {
             return "מספר טלפון לא תקין";
        }
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
                    items: cartItems.map(i => ({...i})),
                    total: effectiveTotal,
                    freeSamples: 0,
                    notes: notes,
                    deliveryMethod: isSelfPickup ? 'self_pickup' : 'mail',
                    phoneNumber: phoneNumber.replace(/\D/g, ''),
                    catalogId: catalogInfo.id
                })
            });

            if (res.ok) {
                clearCart();
                router.push('/checkout/success');
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
                <h1 className="text-3xl font-bold mb-4 font-sans uppercase tracking-widest">הסל ריק</h1>
                <p className="text-gray-500 mb-8">עדיין לא הוספת מוצרים מהקטלוג.</p>
                <Link href={`/catalog/${slug}`} className="px-8 py-3 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition shadow-lg">
                    חזרה לקטלוג {catalogInfo?.name}
                </Link>
            </div>
        );
    }

    return (
        <div className="container py-12 px-4 max-w-6xl mx-auto flex flex-col lg:flex-row gap-12">
            {/* Items List */}
            <div className="flex-1 space-y-6">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-black text-gray-900">העגלה שלך</h1>
                    <div className="text-gray-400 font-bold uppercase tracking-tighter text-sm">{catalogInfo?.name}</div>
                </div>

                {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-6 border border-gray-100 p-5 rounded-3xl bg-white shadow-sm hover:shadow-md transition">
                        <div className="w-24 h-24 bg-gray-50 flex items-center justify-center rounded-2xl overflow-hidden relative border border-gray-100 flex-shrink-0">
                            {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-3xl">📦</span>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-xl leading-tight text-gray-900">{item.name}</h3>
                            {item.size && (
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1" dir="ltr">{item.size}</p>
                            )}
                            <div className="text-lg font-black mt-2 text-black">{item.price} ₪</div>
                        </div>

                        <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-full">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 rounded-full bg-white hover:bg-gray-200 transition shadow-sm border border-gray-100 flex items-center justify-center font-bold">-</button>
                            <span className="w-8 text-center font-bold text-gray-900">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 rounded-full bg-white hover:bg-gray-200 transition shadow-sm border border-gray-100 flex items-center justify-center font-bold">+</button>
                        </div>

                        <button onClick={() => removeFromCart(item.id)} className="text-red-300 p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition" aria-label="Remove">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>

            {/* Checkout Area */}
            <div className="w-full lg:w-[420px]">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-2xl sticky top-24 overflow-hidden relative">
                     <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-blue-600"></div>
                     <h2 className="text-2xl font-bold pb-4 mb-8 border-b border-gray-50">סיכום הזמנה</h2>

                     <div className="flex justify-between items-center text-lg mb-6">
                        <span className="text-gray-500 font-medium">סכום ביניים</span>
                        <span className="font-black text-gray-900">{subtotal} ₪</span>
                    </div>

                    {/* Delivery Method Selection */}
                    <div className="space-y-4 mb-8">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">שיטת אספקה</p>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setIsSelfPickup(false)}
                                className={`flex flex-col items-center gap-1 p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] ${!isSelfPickup ? 'border-black bg-black text-white shadow-lg' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'}`}
                            >
                                <span className="text-sm font-black">משלוח</span>
                                <span className="text-xs opacity-70">{shippingCost} ₪</span>
                            </button>
                            <button
                                onClick={() => setIsSelfPickup(true)}
                                className={`flex flex-col items-center gap-1 p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] ${isSelfPickup ? 'border-black bg-black text-white shadow-lg' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'}`}
                            >
                                <span className="text-sm font-black">איסוף עצמי</span>
                                <span className="text-xs font-bold text-green-500 uppercase">בחינם</span>
                            </button>
                        </div>
                    </div>

                    {/* Total Area */}
                    <div className="bg-gray-50 p-6 rounded-3xl mb-8">
                         <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-gray-600">סה״כ לתשלום</span>
                            <span className="text-4xl font-black text-black">{effectiveTotal} ₪</span>
                        </div>
                    </div>

                     {/* Details Form Area */}
                     <div className="space-y-5 mb-8">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">מספר טלפון לתיאום <span className="text-red-500">*</span></label>
                            <input
                                type="tel"
                                required
                                value={phoneNumber}
                                onChange={(e) => {
                                    setPhoneNumber(e.target.value);
                                    if (phoneError) setPhoneError('');
                                }}
                                className={`w-full p-4 border-2 rounded-2xl focus:ring-0 focus:border-black outline-none transition-all font-bold text-center tracking-widest text-xl ${phoneError ? 'border-red-400 bg-red-50 text-red-900' : 'border-gray-100 bg-gray-50 focus:bg-white'}`}
                                placeholder="050-0000000"
                                dir="ltr"
                            />
                            {phoneError && <p className="text-red-500 text-xs mt-2 font-bold text-center">{phoneError}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">הערות להזמנה</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full p-4 border-2 border-gray-100 bg-gray-50 rounded-2xl focus:border-black outline-none resize-none transition-all text-sm focus:bg-white"
                                placeholder="כתובת מדויקת, קומה, או כל פרט חשוב נוסף..."
                                rows="3"
                            />
                        </div>
                    </div>

                    <div className="text-[10px] leading-relaxed text-center text-gray-400 mb-6 px-4">
                        שליחת ההזמנה מהווה פנייה לבעל הקטלוג. התשלום והתיאום הסופי יתבצעו ישירות מולו.
                    </div>

                     <button
                        onClick={handleCheckout}
                        disabled={isSubmitting || !catalogInfo}
                        className="w-full py-5 bg-blue-600 text-white text-xl rounded-2xl font-black hover:bg-blue-700 transition shadow-xl active:scale-[0.98] disabled:opacity-50 group/btn overflow-hidden relative"
                    >
                        <span className="relative z-10">שליחת הזמנה</span>
                        <div className="absolute inset-0 bg-blue-500 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                    </button>
                </div>
            </div>
        </div>
    );
}
