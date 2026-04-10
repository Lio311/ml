"use client";

import { useCart } from "../../../context/CartContext";
import Image from "@/app/components/CImage";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useUser, useClerk } from "@clerk/nextjs";

export default function CatalogCartClient({ slug }) {
    const { 
        cartItems, removeFromCart, updateQuantity, clearActiveVendorCart, 
        setActiveVendorId, activeItems, subtotal, vendorConfig, freeSamplesCount,
        total, isSelfPickup, setIsSelfPickup
    } = useCart();
    
    const [catalogInfo, setCatalogInfo] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const { user, isLoaded } = useUser();
    const { openSignIn } = useClerk();

    const [notes, setNotes] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneError, setPhoneError] = useState('');

    // Fetch catalog info and sync active vendor
    useEffect(() => {
        const fetchCat = async () => {
             try {
                const res = await fetch(`/api/user-catalogs/public-by-slug/${slug}`);
                if (res.ok) {
                    const data = await res.json();
                    setCatalogInfo(data.catalog);
                    // Ensure context has the correct config loaded via slug
                    setActiveVendorId(slug);
                }
             } catch(e) {}
        };
        fetchCat();
    }, [slug, setActiveVendorId]);


    // Use calculations from CartContext
    const catalogCartItems = activeItems;
    const effectiveTotal = total;

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
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        if (!user) {
            openSignIn({ mode: 'modal' });
            return;
        }

        const pError = validatePhone(phoneNumber);
        if (pError) { setPhoneError(pError); toast.error(pError); return; }
        if (!catalogInfo) { toast.error("שגיאה בטעינת הקטלוג"); return; }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/user-catalogs/${slug}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: catalogCartItems,
                    total: effectiveTotal,
                    notes: notesToUse,
                    deliveryMethod: isSelfPickup ? 'self_pickup' : 'mail',
                    phoneNumber: phoneToUse.replace(/\D/g, ''),
                    activeVendorId: slug
                })
            });

            if (res.ok) {
                clearActiveVendorCart();
                router.push('/checkout/success');
            } else {
                const data = await res.json();
                toast.error(`אירעה שגיאה: ${data.error}`);
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

    if (catalogCartItems.length === 0) {
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

                {catalogCartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-6 border border-gray-100 p-5 rounded-3xl bg-white shadow-sm hover:shadow-md transition">
                        <div className="w-24 h-24 bg-gray-50 flex items-center justify-center rounded-2xl overflow-hidden relative border border-gray-100 flex-shrink-0">
                            {item.image_url ? (
                                <Image 
                                    src={item.image_url} 
                                    alt={item.name} 
                                    fill 
                                    className="object-cover" 
                                />
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
                            <button onClick={() => updateQuantity(item.id, item.size, item.quantity - 1, catalogId || slug)} className="w-8 h-8 rounded-full bg-white hover:bg-gray-200 transition shadow-sm border border-gray-100 flex items-center justify-center font-bold">-</button>
                            <span className="w-8 text-center font-bold text-gray-900">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.size, item.quantity + 1, catalogId || slug)} className="w-8 h-8 rounded-full bg-white hover:bg-gray-200 transition shadow-sm border border-gray-100 flex items-center justify-center font-bold">+</button>
                        </div>

                        <button onClick={() => removeFromCart(item.id, item.size, catalogId || slug)} className="text-red-300 p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition" aria-label="Remove">
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
                    {/* Auth Overlay for Guests */}
                    {isLoaded && !user && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-8 text-center bg-white/70 backdrop-blur-md animate-in fade-in duration-500">
                            <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center mb-6 shadow-2xl animate-bounce">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-black mb-3 text-gray-900">הזמנות לקטלוג מחייבות התחברות</h3>
                            <p className="text-gray-600 mb-8 leading-relaxed font-medium">
                                כדי שתוכלו לתקשר עם {catalogInfo?.name || 'בעל הקטלוג'} ולעקוב אחר ההזמנה, עליכם להתחבר למערכת.
                            </p>
                            <button 
                                onClick={() => openSignIn({ mode: 'modal' })}
                                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span>התחברו כעת</span>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                                    <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    )}

                     <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-blue-600"></div>
                     <h2 className="text-2xl font-bold pb-4 mb-8 border-b border-gray-50">סיכום הזמנה</h2>

                     <div className="flex justify-between items-center text-lg mb-6">
                        <span className="text-gray-500 font-medium">סכום ביניים</span>
                        <span className="font-black text-gray-900">{subtotal} ₪</span>
                    </div>

                    {/* Delivery Method Selection */}
                    {(vendorConfig?.delivery_active || vendorConfig?.self_pickup_active) && (
                        <div className="space-y-4 mb-8">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-right">שיטת אספקה</p>
                            <div className="grid grid-cols-2 gap-4">
                                {vendorConfig.delivery_active && (
                                    <button 
                                        onClick={() => setIsSelfPickup(false)} 
                                        className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-300 ${!isSelfPickup ? 'border-black bg-black text-white shadow-xl scale-[1.02]' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                        </svg>
                                        <span className="text-sm font-bold">משלוח</span>
                                        <span className={`text-xs ${!isSelfPickup ? 'text-gray-300' : 'text-gray-900'} font-bold`}>{vendorConfig.delivery_price} ₪</span>
                                    </button>
                                )}
                                {vendorConfig.self_pickup_active && (
                                    <button 
                                        onClick={() => setIsSelfPickup(true)} 
                                        className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-300 ${isSelfPickup ? 'border-black bg-black text-white shadow-xl scale-[1.02]' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                        </svg>
                                        <span className="text-sm font-bold">איסוף עצמי</span>
                                        <span className="text-xs font-bold text-green-600">חינם</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Free Samples Promo */}
                    {freeSamplesCount > 0 && (
                        <div className="bg-green-50 border border-green-100 p-4 rounded-2xl mb-8 flex items-center gap-3 animate-bounce">
                            <div className="bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl">🎁</div>
                            <div>
                                <p className="text-green-900 font-bold text-sm">הטבה מחכה לך!</p>
                                <p className="text-green-700 text-xs font-medium">מגיע לך {freeSamplesCount} דוגמיות חינם בהזמנה זו!</p>
                            </div>
                        </div>
                    )}

                    {/* Total */}
                    <div className="bg-gray-50 p-6 rounded-3xl mb-8">
                         <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-gray-600">סה״כ לתשלום</span>
                            <span className="text-4xl font-black text-black">{effectiveTotal} ₪</span>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="space-y-5 mb-8">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">מספר טלפון לתיאום <span className="text-red-500">*</span></label>
                            <input
                                type="tel"
                                required
                                value={phoneNumber}
                                onChange={(e) => { setPhoneNumber(e.target.value); if (phoneError) setPhoneError(''); }}
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
                        onClick={() => handleCheckout()}
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
