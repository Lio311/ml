"use client";

import { useCart } from "../context/CartContext";
import Link from "next/link";
import { useUser, SignInButton } from "@clerk/nextjs";
import { useState, useEffect, useRef, useMemo } from "react";
import confetti from 'canvas-confetti';
import { useRouter, useSearchParams } from 'next/navigation';
import LuckyWheel from "../components/LuckyWheel";
import toast from 'react-hot-toast';

export default function CartClient() {
    const { 
        cartItems, activeVendorId, setActiveVendorId, activeItems,
        removeFromCart, updateQuantity, addToCart, clearCart, clearActiveVendorCart,
        subtotal, total, shippingCost, freeSamplesCount, nextTier, 
        luckyPrize, setLuckyPrize, discountAmount, 
        lotteryMode, lotteryTimeLeft, 
        coupon, setCoupon, isMainVendor, totalItemsCount
    } = useCart();
    
    const { isSignedIn, user } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [upsellProducts, setUpsellProducts] = useState([]);
    const prevSamplesCount = useRef(freeSamplesCount);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showWheel, setShowWheel] = useState(false);
    const [hasSeenWheel, setHasSeenWheel] = useState(false);
    const [sharedCart, setSharedCart] = useState(null);
    const [isSelfPickup, setIsSelfPickup] = useState(false);

    // Grouping all items by vendor for the selection UI
    const vendorBuckets = useMemo(() => {
        const buckets = {};
        cartItems.forEach(item => {
            const vId = item.vendorId || 'main';
            if (!buckets[vId]) {
                buckets[vId] = {
                    id: vId,
                    name: item.vendorName || (vId === 'main' ? 'האתר הרשמי' : 'ספק חיצוני'),
                    items: []
                };
            }
            buckets[vId].items.push(item);
        });
        return Object.values(buckets);
    }, [cartItems]);

    // Safety: If current vendor bucket is empty but cart has items, switch to the first non-empty vendor
    useEffect(() => {
        if (cartItems.length > 0 && activeItems.length === 0) {
            const firstVendorWithItems = vendorBuckets?.find(v => v.items.length > 0);
            if (firstVendorWithItems) {
                setActiveVendorId(firstVendorWithItems.id);
            }
        }
    }, [cartItems.length, activeItems.length, vendorBuckets, setActiveVendorId]);

    // Effective shipping cost based on delivery method
    const effectiveShipping = isSelfPickup ? 0 : shippingCost;
    const effectiveTotal = total - (isMainVendor ? shippingCost : 0) + effectiveShipping;

    // Check for shared cart in URL
    useEffect(() => {
        const shareId = searchParams.get('share');
        if (shareId) {
            fetch(`/api/cart/load?id=${shareId}`)
                .then(res => res.json())
                .then(data => {
                    if (data && Array.isArray(data)) setSharedCart(data);
                })
                .catch(err => console.error(err));
        }
    }, [searchParams]);

    const handleLoadSharedCart = () => {
        if (!sharedCart) return;
        if (confirm("פעולה זו תחליף את הסל הנוכחי שלך בסל המשותף. האם להמשיך?")) {
            clearCart();
            sharedCart.forEach(item => {
                for (let k = 0; k < item.quantity; k++) {
                    addToCart(item, item.size, item.price);
                }
            });
            setSharedCart(null);
            router.replace('/cart');
        }
    };

    const handleShareCart = async () => {
        if (cartItems.length === 0) return;
        try {
            const res = await fetch('/api/cart/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: cartItems })
            });
            if (res.ok) {
                const data = await res.json();
                const url = `${window.location.origin}/cart?share=${data.id}`;
                if (navigator.share) {
                    navigator.share({ title: 'הסל שלי ב-ml_tlv', text: 'בניתי אחלה סל, מה דעתך?', url }).catch(console.error);
                } else {
                    navigator.clipboard.writeText(url).then(() => toast.success("הקישור הועתק!"));
                }
            }
        } catch (e) { console.error(e); }
    };

    const [couponInput, setCouponInput] = useState('');
    const [couponError, setCouponError] = useState('');
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [notes, setNotes] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneError, setPhoneError] = useState('');

    useEffect(() => {
        const fetchPersonalPhone = async () => {
            try {
                const res = await fetch('/api/user/phone');
                if (res.ok) {
                    const data = await res.json();
                    if (data.phone) setPhoneNumber(data.phone);
                }
            } catch (e) { console.error(e); }
        };
        fetchPersonalPhone();
    }, []);

    const handleApplyCoupon = async () => {
        if (!couponInput) return;
        setIsValidatingCoupon(true);
        setCouponError('');
        try {
            const res = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponInput })
            });
            const data = await res.json();
            if (res.ok) {
                setCoupon({ code: data.code, discountPercent: data.discountPercent, limitations: data.limitations });
                setCouponInput('');
            } else { setCouponError('קוד לא תקין'); }
        } catch (e) { console.error(e); }
        finally { setIsValidatingCoupon(false); }
    };

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
        if (pError) { setPhoneError(pError); toast.error(pError); return; }

        setIsSubmitting(true);
        try {
            const body = {
                items: activeItems,
                total: effectiveTotal,
                notes,
                phoneNumber: phoneNumber.replace(/\D/g, ''),
                activeVendorId
            };
            if (isMainVendor) {
                body.freeSamples = freeSamplesCount;
                body.deliveryMethod = isSelfPickup ? 'self_pickup' : 'mail';
            }

            const endpoint = isMainVendor ? '/api/orders' : `/api/user-catalogs/${activeVendorId}/orders`;
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                clearActiveVendorCart();
                router.push('/checkout/success');
            } else {
                const data = await res.json();
                toast.error(`שגיאה: ${data.error}`);
                setIsSubmitting(false);
            }
        } catch (e) {
            console.error(e);
            toast.error('אירעה שגיאה. בדוק חיבור לרשת.');
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const fetchUpsell = async () => {
            try {
                const excludedIds = cartItems.map(item => item.id);
                const res = await fetch('/api/products/upsell', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ excludedIds })
                });
                if (res.ok) setUpsellProducts(await res.json());
            } catch (err) { console.error(err); }
        };
        if (isMainVendor && activeItems.length > 0) fetchUpsell();
    }, [isMainVendor, activeItems.length]);

    const recommendations = useMemo(() => {
        if (!isMainVendor || nextTier <= 0) return [];
        return upsellProducts
            .filter(p => !cartItems.some(item => item.id === p.id))
            .map(p => {
                const sizes = [
                    { size: '2', price: Number(p.price_2ml) },
                    { size: '5', price: Number(p.price_5ml) },
                    { size: '10', price: Number(p.price_10ml) }
                ].filter(s => s.price > 0);
                let bestMatch = sizes.find(s => s.price >= nextTier) || sizes[sizes.length - 1];
                return { ...p, ...bestMatch };
            }).slice(0, 3);
    }, [isMainVendor, nextTier, upsellProducts, cartItems]);

    if (isSubmitting) {
        return (
            <div className="container py-20 text-center flex flex-col items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-black mb-4"></div>
                <h2 className="text-2xl font-bold animate-pulse">מעבד את ההזמנה שלך...</h2>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="container py-20 text-center">
                <h1 className="text-3xl font-bold mb-4">העגלה שלך ריקה</h1>
                <Link href="/catalog" className="btn btn-primary">חזרה לקטלוג</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container py-12">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">העגלה שלי</h1>
                    <div className="flex items-center gap-2">
                        <span className="text-black font-normal">שיתוף הסל</span>
                        <button onClick={handleShareCart} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full transition shadow-sm hover:bg-blue-50 text-gray-600 hover:text-blue-600">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M15.75 4.5a3 3 0 1 1 .825 2.066l-8.421 4.679a3.002 3.002 0 0 1 0 1.51l8.421 4.679a3 3 0 1 1-.729 1.31l-8.421-4.678a3 3 0 1 1 0-4.132l8.421-4.679a3 3 0 0 1-.096-.755Z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Vendor Selector */}
                {vendorBuckets.length > 1 && (
                    <div className="mb-6 flex flex-wrap gap-2 sticky top-20 z-40 bg-gray-50/80 backdrop-blur-md py-4">
                        {vendorBuckets.map(vendor => (
                            <button
                                key={vendor.id}
                                onClick={() => setActiveVendorId(vendor.id)}
                                className={`px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-2 border ${activeVendorId === vendor.id ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                            >
                                <span className="font-bold text-xs whitespace-nowrap">{vendor.name}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeVendorId === vendor.id ? 'bg-white/20' : 'bg-gray-100'}`}>{vendor.items.length}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Items List */}
                    <div className="flex-1 space-y-6">
                        {activeItems.map((item) => (
                            <div key={`${item.id}-${item.size}`} className={`flex items-center gap-4 border p-4 rounded-lg bg-white shadow-sm relative ${item.isPrize ? 'border-amber-300 bg-amber-50' : ''}`}>
                                <div className="w-20 h-20 bg-white flex items-center justify-center text-2xl rounded overflow-hidden relative border border-gray-100 flex-shrink-0">
                                    {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" /> : <span>{item.isPrize ? '🎁' : '🧴'}</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold truncate">{item.name}</h3>
                                    <div className="text-sm text-gray-500">גודל: {item.size} מ"ל</div>
                                    <div className={`text-sm font-bold mt-1 ${item.isPrize ? 'text-green-600' : 'text-primary'}`}>{item.price} ₪</div>
                                </div>
                                {!item.isPrize && (
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => updateQuantity(item.id, item.size, item.quantity - 1, activeVendorId)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition">-</button>
                                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, item.size, item.quantity + 1, activeVendorId)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition">+</button>
                                    </div>
                                )}
                                <button onClick={() => removeFromCart(item.id, item.size, activeVendorId)} className="text-red-500 p-2 hover:bg-red-50 rounded-full transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                        
                        {vendorBuckets.length > 1 && (
                            <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4 text-blue-700">
                                <div className="text-3xl">🎒</div>
                                <div>
                                    <p className="font-black text-lg">שאר הפריטים מחכים לך!</p>
                                    <p className="text-sm">לאחר שתשלים את ההזמנה מ-{activeItems[0]?.vendorName || 'ספק זה'} תוכל לעבור לסל הבא.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Summary & Checkout */}
                    <div className="w-full lg:w-96 space-y-6">
                        <div className="bg-white p-6 rounded-xl border shadow-xl space-y-6 sticky top-24">
                            <h2 className="text-xl font-bold border-b pb-4">סיכום הזמנה</h2>

                            <div className="flex justify-between items-center text-lg font-bold">
                                <span>סכום ביניים</span>
                                <span>{subtotal} ₪</span>
                            </div>

                            {isMainVendor && discountAmount > 0 && (
                                <div className="flex justify-between text-lg text-green-600 font-bold">
                                    <span>הנחות כוללות</span>
                                    <span>{discountAmount}- ₪</span>
                                </div>
                            )}

                            {isMainVendor && (
                                <div className="space-y-4">
                                     {/* Coupon Section */}
                                     {coupon ? (
                                        <div className="flex justify-between items-center bg-green-50 p-3 rounded border border-green-200">
                                            <span className="font-bold text-green-700">קופון: {coupon.code}</span>
                                            <button onClick={() => setCoupon(null)} className="text-red-500">✕</button>
                                        </div>
                                     ) : (
                                        <div className="flex gap-2">
                                            <input value={couponInput} onChange={e => setCouponInput(e.target.value)} className="input border rounded p-2 flex-1" placeholder="קוד קופון" />
                                            <button onClick={handleApplyCoupon} className="btn bg-black text-white px-4 rounded">החל</button>
                                        </div>
                                     )}

                                    {/* Samples Progress */}
                                    <div className="p-4 bg-gray-50 rounded-xl border">
                                        <div className="flex justify-between text-xs font-bold mb-2">
                                            <span>מתנות מהאתר 🎁</span>
                                            <span>{freeSamplesCount}/6</span>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-600 transition-all" style={{ width: `${(subtotal/1000)*100}%` }}></div>
                                        </div>
                                        {nextTier > 0 && <p className="text-[10px] text-center mt-2">רק עוד {nextTier} ₪ למתנה הבאה!</p>}
                                    </div>
                                    
                                    {/* Upsells */}
                                    {recommendations.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold">הוספות מהירות:</p>
                                            {recommendations.map(p => (
                                                <button key={p.id} onClick={() => addToCart(p, p.size, p.price)} className="w-full flex items-center gap-2 p-2 border rounded hover:bg-gray-50 transition text-right">
                                                    <span className="flex-1 text-xs truncate"> {p.name} ({p.size}מ"ל) </span>
                                                    <span className="font-bold text-xs">{p.price} ₪</span>
                                                    <span className="text-blue-600 font-bold">+</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {isMainVendor && (
                                <div className="space-y-4 mb-4">
                                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">שיטת אספקה</p>
                                     <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => setIsSelfPickup(false)} 
                                            className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all duration-300 ${!isSelfPickup ? 'border-black bg-black text-white shadow-lg scale-105' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'}`}
                                        >
                                            <span className="text-sm font-black">משלוח</span>
                                            <span className="text-[10px] opacity-70">30 ₪</span>
                                        </button>
                                        <button 
                                            onClick={() => setIsSelfPickup(true)} 
                                            className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all duration-300 ${isSelfPickup ? 'border-black bg-black text-white shadow-lg scale-105' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'}`}
                                        >
                                            <span className="text-sm font-black">איסוף עצמי</span>
                                            <span className="text-[10px] font-bold text-green-500">חינם</span>
                                        </button>
                                     </div>
                                </div>
                            )}

                            <div className="pt-4 border-t space-y-4">
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-3 border rounded-lg text-sm bg-gray-50" rows="2" placeholder="הערות להזמנה..."></textarea>
                                <div className="space-y-1.5 text-right">
                                    <label className="block text-sm font-bold text-gray-700">
                                        מספר טלפון (חובה) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input 
                                            value={phoneNumber} 
                                            onChange={e => setPhoneNumber(e.target.value)} 
                                            className="w-full p-3 pr-10 border-2 border-gray-900 rounded-xl font-mono tracking-widest text-lg bg-white focus:ring-2 focus:ring-black focus:outline-none transition-all" 
                                            placeholder="05..."
                                            dir="ltr"
                                        />
                                        {phoneNumber.length >= 10 && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-medium">נשתמש במספר זה רק לתיאום המשלוח והתשלום.</p>
                                    {phoneError && <p className="text-red-500 text-xs font-bold text-center mt-1">{phoneError}</p>}
                                </div>
                            </div>

                            <div className="flex justify-between text-2xl font-black pt-4 border-t">
                                <span>סה״כ</span>
                                <span>{effectiveTotal} ₪</span>
                            </div>

                            <button onClick={handleCheckout} disabled={isSubmitting} className="w-full py-5 bg-black text-white text-xl rounded-2xl font-black shadow-2xl hover:bg-gray-900 transition active:scale-95 disabled:opacity-50">
                                {isSubmitting ? 'מעבד...' : 'שלח הזמנה לספק זה'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
