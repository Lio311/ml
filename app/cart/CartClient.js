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
        coupon, setCoupon, isMainVendor, totalItemsCount, vendorConfig,
        isSelfPickup, setIsSelfPickup
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

    // Initial self-pickup state is now managed by CartContext based on vendorConfig
    // No redundant useEffect needed here for isSelfPickup initialization

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
                const vIdentifier = firstVendorWithItems.items[0]?.vendorId || 'main';
                setActiveVendorId(vIdentifier);
            }
        }
    }, [cartItems.length, activeItems.length, vendorBuckets, setActiveVendorId]);

    // Use total directly from context as it handles shipping/discounts based on shared isSelfPickup
    const effectiveTotal = total;

    // Check for shared cart in URL
    useEffect(() => {
        const shareId = searchParams.get('share');
        if (shareId) {
            fetch(`/api/cart/load?id=${shareId}`)
                .then(res => res.json())
                .then(data => {
                    if (data && Array.isArray(data)) setSharedCart(data);
                })
                .catch(err => console.error("Failed to load shared cart", err));
        }
    }, [searchParams]);

    const handleLoadSharedCart = () => {
        if (!sharedCart) return;
        if (confirm("פעולה זו תחליף את הסל הנוכחי שלך בסל המשותף. האם להמשיך?")) {
            clearCart();
            sharedCart.forEach(item => {
                for (let k = 0; k < item.quantity; k++) {
                    addToCart(item, item.size, item.price, item.vendorId || 'main', item.vendorName || 'האתר הרשמי');
                }
            });
            setSharedCart(null);
            router.replace('/cart');
        }
    };

    const handleShareCart = async () => {
        if (activeItems.length === 0) {
            toast.error("הסל הנוכחי ריק ולכן לא ניתן לשתף אותו");
            return;
        }
        try {
            const res = await fetch('/api/cart/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: activeItems })
            });
            if (res.ok) {
                const data = await res.json();
                const url = `${window.location.origin}/cart?share=${data.id}`;
                if (navigator.share) {
                    navigator.share({ title: 'הסל שלי ב-ml_tlv', text: 'בניתי אחלה סל, מה דעתך?', url }).catch(console.error);
                } else {
                    navigator.clipboard.writeText(url).then(() => toast.success("הקישור הועתק, שתפו בכיף!"));
                }
            } else {
                toast.error("שגיאה ביצירת קישור שיתוף");
            }
        } catch (e) {
            console.error(e);
            toast.error("שגיאה ביצירת קישור שיתוף");
        }
    };

    // Coupon State
    const [couponInput, setCouponInput] = useState('');
    const [couponError, setCouponError] = useState('');
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

    // Order Notes State
    const [notes, setNotes] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneError, setPhoneError] = useState('');

    // Fetch Persisted Phone Number
    useEffect(() => {
        const fetchPersonalPhone = async () => {
            try {
                const res = await fetch('/api/user/phone');
                if (res.ok) {
                    const data = await res.json();
                    if (data.phone) setPhoneNumber(data.phone);
                }
            } catch (e) {
                console.error("Failed to fetch user phone:", e);
            }
        };
        fetchPersonalPhone();
    }, []);

    // Auto-Validate Coupon on Cart Change
    useEffect(() => {
        if (!coupon) return;

        let limits = coupon.limitations || {};
        if (typeof limits === 'string') {
            try { limits = JSON.parse(limits); } catch (e) { limits = {}; }
        }

        let isValid = true;
        let rejectReason = '';

        if (limits.allowed_users?.length > 0) {
            const userEmail = user?.primaryEmailAddress?.emailAddress;
            if (!userEmail || !limits.allowed_users.some(u => u.trim().toLowerCase() === userEmail.trim().toLowerCase())) {
                isValid = false;
                rejectReason = 'הקופון מוגן: אינך ברשימת המשתמשים';
            }
        }

        if (isValid && limits.min_cart_total && subtotal < limits.min_cart_total) {
            isValid = false;
            rejectReason = `הקופון מוגן: אינך מגיע לסכום ${limits.min_cart_total} ₪`;
        }

        const hasItemFilters = (limits.allowed_sizes?.length > 0) ||
            (limits.allowed_brands?.length > 0) ||
            (limits.allowed_categories?.length > 0) ||
            (limits.allowed_products?.length > 0);

        if (isValid && hasItemFilters) {
            let hasMatch = false;
            cartItems.forEach(item => {
                let isItemEligible = true;
                if (limits.allowed_sizes?.length > 0) {
                    const sizeStr = String(item.size).replace(/\D/g, '');
                    const sizeInt = sizeStr ? parseInt(sizeStr) : null;
                    if (sizeInt && !limits.allowed_sizes.some(s => parseInt(s) === sizeInt)) isItemEligible = false;
                }
                if (limits.allowed_brands?.length > 0) {
                    if (!item.brand || !limits.allowed_brands.some(b => b.trim().toLowerCase() === item.brand.trim().toLowerCase())) isItemEligible = false;
                }
                if (limits.allowed_categories?.length > 0) {
                    if (!item.category || !limits.allowed_categories.some(c => c.trim().toLowerCase() === item.category.trim().toLowerCase())) isItemEligible = false;
                }
                if (limits.allowed_products?.length > 0) {
                    if (!item.id || !limits.allowed_products.some(pid => String(pid).trim() === String(item.id).trim())) isItemEligible = false;
                }
                if (isItemEligible) hasMatch = true;
            });

            if (!hasMatch) {
                isValid = false;
                rejectReason = 'הקופון לא חל על פריטים אלה';
            }
        }

        if (!isValid) {
            setCoupon(null);
            setCouponError(rejectReason);
        }

    }, [cartItems, subtotal, user, coupon, setCoupon]);

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
                const couponData = data;
                let limits = couponData.limitations || {};
                if (typeof limits === 'string') {
                    try { limits = JSON.parse(limits); } catch (e) { limits = {}; }
                }

                if (limits.allowed_users?.length > 0) {
                    const userEmail = user?.primaryEmailAddress?.emailAddress;
                    if (!userEmail || !limits.allowed_users.some(u => u.trim().toLowerCase() === userEmail.trim().toLowerCase())) {
                        setCouponError('הקופון הזה אינו זמין עבור משתמש זה');
                        setCoupon(null);
                        return;
                    }
                }

                if (limits.min_cart_total && subtotal < limits.min_cart_total) {
                    setCouponError(`הקופון אינו מגיע לסכום ${limits.min_cart_total} ₪`);
                    setCoupon(null);
                    return;
                }

                const hasItemFilters = (limits.allowed_sizes?.length > 0) ||
                    (limits.allowed_brands?.length > 0) ||
                    (limits.allowed_categories?.length > 0) ||
                    (limits.allowed_products?.length > 0);

                if (hasItemFilters) {
                    let hasMatch = false;
                    cartItems.forEach(item => {
                        let isItemEligible = true;
                        if (limits.allowed_sizes?.length > 0) {
                            const sizeStr = String(item.size).replace(/\D/g, '');
                            const sizeInt = sizeStr ? parseInt(sizeStr) : null;
                            if (sizeInt && !limits.allowed_sizes.some(s => parseInt(s) === sizeInt)) isItemEligible = false;
                        }
                        if (limits.allowed_brands?.length > 0) {
                            if (!item.brand || !limits.allowed_brands.some(b => b.trim().toLowerCase() === item.brand.trim().toLowerCase())) isItemEligible = false;
                        }
                        if (limits.allowed_categories?.length > 0) {
                            if (!item.category || !limits.allowed_categories.some(c => c.trim().toLowerCase() === item.category.trim().toLowerCase())) isItemEligible = false;
                        }
                        if (limits.allowed_products?.length > 0) {
                            if (!item.id || !limits.allowed_products.some(pid => String(pid).trim() === String(item.id).trim())) isItemEligible = false;
                        }
                        if (isItemEligible) hasMatch = true;
                    });

                    if (!hasMatch) {
                        setCouponError('הקופון הזה אינו חל על פריטים בסל שלך');
                        setCoupon(null);
                        return;
                    }
                }

                setCoupon({
                    code: data.code,
                    discountPercent: data.discountPercent,
                    limitations: limits
                });
                setCouponInput('');
            } else {
                setCouponError('קוד קופון לא תקין');
                setCoupon(null);
            }
        } catch (e) {
            console.error(e);
            setCouponError('שגיאה בבדיקת הקופון');
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    // Confetti on sample unlocked
    useEffect(() => {
        if (isMainVendor && freeSamplesCount > prevSamplesCount.current) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                zIndex: 1000
            });
        }
        prevSamplesCount.current = freeSamplesCount;
    }, [freeSamplesCount, isMainVendor]);

    // Upsell Products
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
            } catch (err) { console.error("Failed to fetch upsell products", err); }
        };
        if (isMainVendor && activeItems.length > 0) fetchUpsell();
    }, [isMainVendor, activeItems.length]);

    // Lucky Wheel Trigger
    useEffect(() => {
        const lastSpin = localStorage.getItem('lastLuckySpin');
        const now = Date.now();
        const cooldown = 24 * 60 * 60 * 1000;
        const canSpin = !lastSpin || (now - parseInt(lastSpin) > cooldown);
        if (subtotal >= 1200 && !luckyPrize && !hasSeenWheel && canSpin) {
            setShowWheel(true);
        }
    }, [subtotal, luckyPrize, hasSeenWheel]);

    const handleWin = (prize) => {
        setLuckyPrize(prize);
        localStorage.setItem('lastLuckySpin', Date.now().toString());
        if (prize.type === 'item') {
            const prizeProduct = {
                id: `prize-${prize.size}`,
                name: prize.name,
                image_url: prize.image_url || null,
                price: 0,
                stock: 999,
                isPrize: true
            };
            addToCart(prizeProduct, prize.size, 0);
        }
        setTimeout(() => {
            setShowWheel(false);
            setHasSeenWheel(true);
        }, 1000);
    };

    const validatePhone = (phone) => {
        if (!phone) return "מספר טלפון הוא שדה חובה";
        const cleanPhone = phone.replace(/\D/g, '');
        if (!cleanPhone.startsWith('05')) return "מספר טלפון צריך להתחיל ב-05";
        if (cleanPhone.length !== 10) return "מספר טלפון צריך להיות 10 ספרות";
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
                activeVendorId,
                freeSamples: freeSamplesCount,
                deliveryMethod: isSelfPickup ? 'self_pickup' : 'mail'
            };

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

    // Smart Upsell
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
                <p className="text-gray-500 mt-2">רגע קטן, כמעט סיימנו.</p>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="container py-20 text-center">
                {sharedCart && (
                    <div className="bg-blue-600 text-white p-4 rounded-xl mb-8 shadow-lg max-w-2xl mx-auto flex items-center justify-between animate-fade-in text-right" dir="rtl">
                        <div>
                            <h3 className="font-bold text-lg">קיבלת סל משותף! 🛍️</h3>
                            <p className="text-sm opacity-90">הסל מכיל {sharedCart.length} פריטים. רוצה לטעון ולהמשיך?</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { setSharedCart(null); router.replace('/cart'); }} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition">לבטל</button>
                            <button onClick={handleLoadSharedCart} className="px-4 py-2 bg-white text-blue-600 font-bold rounded-lg text-sm hover:scale-105 transition shadow">טען סל</button>
                        </div>
                    </div>
                )}
                <h1 className="text-3xl font-bold mb-4">העגלה שלך ריקה</h1>
                <p className="text-gray-500 mb-8">בחרת להגיע לכאן ריק... בואו נמלא אותה</p>
                <Link href="/catalog" className="btn btn-primary">חזרה לקטלוג</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container py-12">

                {/* Lottery Mode Banner */}
                {lotteryMode?.active && (
                    <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-xl mb-8 shadow-lg flex items-center justify-between animate-pulse">
                        <div className="flex items-center gap-4">
                            <div>
                                <h3 className="font-black text-xl">מבצע הבזק פעיל!</h3>
                                <p className="text-sm font-bold opacity-80">הנחה 15% בזמן ריצה. הסל שלך בחיסכון משמעותי.</p>
                            </div>
                        </div>
                        <div className="text-4xl font-mono font-black">
                            {Math.floor(lotteryTimeLeft / 60)}:{(lotteryTimeLeft % 60).toString().padStart(2, '0')}
                        </div>
                    </div>
                )}

                {/* Shared Cart Banner */}
                {sharedCart && (
                    <div className="bg-blue-600 text-white p-4 rounded-xl mb-8 shadow-lg flex items-center justify-between animate-fade-in">
                        <div>
                            <h3 className="font-bold text-lg">קיבלת סל משותף! 🛍️</h3>
                            <p className="text-sm opacity-90">הסל מכיל {sharedCart.length} פריטים. רוצה לטעון ולהמשיך?</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { setSharedCart(null); router.replace('/cart'); }} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition">לבטל</button>
                            <button onClick={handleLoadSharedCart} className="px-4 py-2 bg-white text-blue-600 font-bold rounded-lg text-sm hover:scale-105 transition shadow">טען סל</button>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">העגלה שלי</h1>
                    {cartItems.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-black font-normal">שיתוף הסל</span>
                            <button
                                onClick={handleShareCart}
                                className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-full transition shadow-sm"
                                title="שתף סל"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M15.75 4.5a3 3 0 1 1 .825 2.066l-8.421 4.679a3.002 3.002 0 0 1 0 1.51l8.421 4.679a3 3 0 1 1-.729 1.31l-8.421-4.678a3 3 0 1 1 0-4.132l8.421-4.679a3 3 0 0 1-.096-.755Z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* Vendor Selector */}
                {cartItems.length > 0 && vendorBuckets.length > 1 && (
                    <div className="mb-6 flex flex-wrap gap-2 sticky top-20 z-40 bg-gray-50/80 backdrop-blur-md py-4">
                        {vendorBuckets.map(vendor => (
                            <button
                                key={vendor.id}
                                onClick={() => setActiveVendorId(vendor.id)}
                                className={`px-4 py-2 rounded-full transition-all duration-300 flex items-center gap-2 border ${activeVendorId === vendor.id ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                            >
                                <span className="font-bold text-xs whitespace-nowrap">{vendor.name}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeVendorId === vendor.id ? 'bg-white/20' : 'bg-gray-100'}`}>{vendor.items.reduce((s,i) => s + i.quantity, 0)}</span>
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
                                    {item.image_url ? (
                                        <Image src={item.image_url} alt={item.name} fill className="object-contain" sizes="80px" />
                                    ) : (
                                        <span>{item.isPrize ? '🎁' : '🧴'}</span>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold truncate">{item.name}</h3>
                                    <div className="text-sm text-gray-500">גודל: {item.size === 'set' ? 'סט' : `${String(item.size).replace(/ml$/i, '')} מ"ל`}</div>
                                    <div className={`text-sm font-bold mt-1 ${item.isPrize ? 'text-green-600' : 'text-primary'}`}>{item.price} ₪ {item.isPrize && '(פרס)'}</div>
                                </div>

                                {!item.isPrize && (
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => updateQuantity(item.id, item.size, item.quantity - 1, activeVendorId)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition">-</button>
                                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, item.size, item.quantity + 1, activeVendorId)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition">+</button>
                                    </div>
                                )}

                                <button onClick={() => removeFromCart(item.id, item.size, activeVendorId)} className="text-red-500 p-2 hover:bg-red-50 rounded-full transition" aria-label="Remove">
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

                            {/* Subtotal */}
                            <div className="flex justify-between items-center text-lg">
                                <span>סכום ביניים</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold whitespace-nowrap">{subtotal} ₪</span>
                                    <span className="text-sm text-gray-500 font-normal whitespace-nowrap" dir="rtl">({totalItemsCount} {totalItemsCount === 1 ? 'פריט' : 'פריטים'})</span>
                                </div>
                            </div>

                            {/* Lottery Discount */}
                            {isMainVendor && lotteryMode?.active && (
                                <div className="flex justify-between text-lg text-yellow-600 font-bold">
                                    <span>הנחת הבזק (15%)</span>
                                    <span>{discountAmount}- ₪</span>
                                </div>
                            )}

                            {/* Lucky Wheel Discount */}
                            {isMainVendor && luckyPrize?.type === 'discount' && !lotteryMode?.active && (
                                <div className="flex justify-between text-lg text-green-600 font-bold">
                                    <span>הנחת גלגל המזל ({luckyPrize.value * 100}%)</span>
                                    <span>{Math.round(subtotal * luckyPrize.value)}- ₪</span>
                                </div>
                            )}

                            {/* Coupon Discount */}
                            {isMainVendor && coupon && (
                                <div className="flex justify-between text-lg text-green-600 font-bold">
                                    <span>קופון {coupon.code} ({coupon.discountPercent}%)</span>
                                    <span>
                                        {(() => {
                                            if (!coupon) return 0;
                                            let limits = coupon.limitations || {};
                                            if (typeof limits === 'string') { try { limits = JSON.parse(limits); } catch (e) { limits = {}; } }
                                            let eligibleSum = 0;
                                            cartItems.forEach(item => {
                                                let isEligible = true;
                                                if (limits.allowed_sizes?.length > 0) {
                                                    const sizeStr = String(item.size).replace(/\D/g, '');
                                                    const sizeInt = sizeStr ? parseInt(sizeStr) : null;
                                                    if (sizeInt && !limits.allowed_sizes.some(s => parseInt(s) === sizeInt)) isEligible = false;
                                                }
                                                if (limits.allowed_brands?.length > 0) {
                                                    if (!item.brand || !limits.allowed_brands.some(b => b.trim().toLowerCase() === item.brand.trim().toLowerCase())) isEligible = false;
                                                }
                                                if (limits.allowed_categories?.length > 0) {
                                                    if (!item.category || !limits.allowed_categories.some(c => c.trim().toLowerCase() === item.category.trim().toLowerCase())) isEligible = false;
                                                }
                                                if (limits.allowed_products?.length > 0) {
                                                    if (!item.id || !limits.allowed_products.some(pid => String(pid).trim() === String(item.id).trim())) isEligible = false;
                                                }
                                                if (isEligible) eligibleSum += (item.price * item.quantity);
                                            });
                                            const base = subtotal;
                                            let currentNet = base;
                                            if (lotteryMode?.active) currentNet -= Math.round(base * 0.15);
                                            else if (luckyPrize?.type === 'discount') currentNet -= Math.round(base * luckyPrize.value);
                                            const ratio = base > 0 ? (eligibleSum / base) : 0;
                                            const eligibleNet = currentNet * ratio;
                                            return Math.round(eligibleNet * (coupon.discountPercent / 100));
                                        })()}- ₪
                                    </span>
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Coupon Section (Main Vendor Only) */}
                                {isMainVendor && (
                                    <div className="border-t border-b py-4">
                                        {coupon ? (
                                            <div className="flex justify-between items-center bg-green-50 p-3 rounded border border-green-200">
                                                <div>
                                                    <div className="font-bold text-green-700">קופון {coupon.code}</div>
                                                    <div className="text-xs text-green-600">הנחה של {coupon.discountPercent}%</div>
                                                </div>
                                                <button onClick={() => setCoupon(null)} className="text-red-500 hover:bg-red-50 p-1 rounded">✕</button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="קוד קופון"
                                                        className={`flex-1 p-2 border rounded ${couponError ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-500' : ''}`}
                                                        value={couponInput}
                                                        onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); if (couponError) setCouponError(''); }}
                                                    />
                                                    <button
                                                        onClick={handleApplyCoupon}
                                                        disabled={isValidatingCoupon || !couponInput}
                                                        className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-black disabled:opacity-50"
                                                    >
                                                        {isValidatingCoupon ? '...' : 'החל'}
                                                    </button>
                                                </div>
                                                {couponError && (
                                                    <div className="text-red-600 text-sm font-bold flex items-center gap-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                        </svg>
                                                        {couponError}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Delivery Method */}
                                {(isMainVendor || vendorConfig?.delivery_active || vendorConfig?.self_pickup_active) && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-right">שיטת אספקה</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {(isMainVendor || vendorConfig?.delivery_active) && (
                                                <button
                                                    onClick={() => setIsSelfPickup(false)}
                                                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-center ${!isSelfPickup ? 'border-black bg-black text-white shadow-md' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'}`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                                    </svg>
                                                    <span className="text-xs font-bold leading-tight">משלוח</span>
                                                    <span className={`text-xs font-bold ${!isSelfPickup ? 'text-gray-300' : 'text-gray-400'}`}>{isMainVendor ? 30 : (vendorConfig?.delivery_price || 0)} ₪</span>
                                                </button>
                                            )}
                                            {(isMainVendor || vendorConfig?.self_pickup_active) && (
                                                <button
                                                    onClick={() => setIsSelfPickup(true)}
                                                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-center ${isSelfPickup ? 'border-black bg-black text-white shadow-md' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'}`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                                    </svg>
                                                    <span className="text-xs font-bold leading-tight">איסוף עצמי</span>
                                                    <span className={`text-xs font-bold ${isSelfPickup ? 'text-green-400' : 'text-green-600'}`}>חינם</span>
                                                </button>
                                            )}
                                        </div>
                                        {isSelfPickup && (
                                            <p className="text-xs text-gray-500 text-center pt-1">כתובת איסוף — יצורף פרטים עם אישור ההזמנה</p>
                                        )}
                                    </div>
                                )}

                                {/* Free Samples Promo for Catalog */}
                                {!isMainVendor && freeSamplesCount > 0 && (
                                    <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-center gap-3 animate-bounce">
                                        <div className="bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl">🎁</div>
                                        <div>
                                            <p className="text-green-900 font-bold text-sm">הטבה מחכה לך!</p>
                                            <p className="text-green-700 text-xs font-medium">מגיע לך {freeSamplesCount} דוגמיות חינם בהזמנה זו!</p>
                                        </div>
                                    </div>
                                )}

                                {/* Free Samples Progress Bar */}
                                {isMainVendor ? (
                                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2 text-right justify-start">
                                            <span>🎁</span>
                                            {freeSamplesCount === 6 ? (
                                                <span className="text-green-600">קיבלת את כל הדוגמיות! (6)</span>
                                            ) : (
                                                <span>דוגמיות חינם</span>
                                            )}
                                        </h3>

                                        <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden mb-2">
                                            <div
                                                className="absolute top-0 right-0 h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-1000 ease-out rounded-full"
                                                style={{ width: `${Math.min(100, (subtotal / 1000) * 100)}%` }}
                                            ></div>
                                            <div className="absolute top-0 right-[30%] h-full w-0.5 bg-white/50 z-10" title="300₪ - 2 דוגמיות"></div>
                                            <div className="absolute top-0 right-[50%] h-full w-0.5 bg-white/50 z-10" title="500₪ - 4 דוגמיות"></div>
                                        </div>

                                        <div className="flex justify-between text-[10px] text-gray-400 font-medium px-1">
                                            <span className={subtotal >= 0 ? "text-gray-900 font-bold" : ""}>0</span>
                                            <span className={subtotal >= 300 ? "text-blue-600 font-bold" : ""}>300 (2)</span>
                                            <span className={subtotal >= 500 ? "text-purple-600 font-bold" : ""}>500 (4)</span>
                                            <span className={subtotal >= 1000 ? "text-green-600 font-bold" : ""}>1000 (6)</span>
                                        </div>

                                        <div className="mt-3 text-xs text-center font-bold">
                                            {freeSamplesCount === 0 && <span className="text-gray-500">עוד <span className="font-bold text-black">{300 - subtotal} ₪</span> ל-2 דוגמיות חינם!</span>}
                                            {freeSamplesCount === 2 && <span className="text-blue-600">יש לך 2 דוגמיות. עוד <span className="font-bold">{500 - subtotal} ₪</span> ל-4 דוגמיות!</span>}
                                            {freeSamplesCount === 4 && <span className="text-purple-600">וואו! 4 דוגמיות שלך. עוד <span className="font-bold">{1000 - subtotal} ₪</span> ל-6 דוגמיות!</span>}
                                            {freeSamplesCount === 6 && <span className="text-green-600 font-bold">פינקנו אותך ב-6 דוגמיות! תהנה! 🎉</span>}
                                        </div>
                                    </div>
                                ) : (vendorConfig?.sample_tiers) ? (() => {
                                    let tiers = [];
                                    try {
                                        tiers = typeof vendorConfig.sample_tiers === 'string' ? JSON.parse(vendorConfig.sample_tiers) : (vendorConfig.sample_tiers || []);
                                    } catch (e) { tiers = []; }

                                    if (tiers.length === 0) return null;

                                    const sortedTiers = [...tiers].sort((a, b) => a.minAmount - b.minAmount);
                                    const maxTierSum = sortedTiers[sortedTiers.length - 1].minAmount;
                                    const currentTier = sortedTiers.filter(t => subtotal >= t.minAmount).reverse()[0];
                                    const nextTierObj = sortedTiers.find(t => subtotal < t.minAmount);

                                    return (
                                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2 text-right justify-start">
                                                <span>🎁</span>
                                                {currentTier ? (
                                                    <span className="text-green-600">קיבלת {currentTier.samplesCount} דוגמיות חינם!</span>
                                                ) : (
                                                    <span>דוגמיות חינם</span>
                                                )}
                                            </h3>

                                            <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden mb-2">
                                                <div
                                                    className="absolute top-0 right-0 h-full bg-gradient-to-r from-green-400 to-emerald-600 transition-all duration-1000 ease-out rounded-full"
                                                    style={{ width: `${Math.min(100, (subtotal / maxTierSum) * 100)}%` }}
                                                ></div>
                                                {sortedTiers.map((t, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="absolute top-0 h-full w-0.5 bg-white/50 z-10"
                                                        style={{ right: `${(t.minAmount / maxTierSum) * 100}%` }}
                                                        title={`${t.minAmount}₪ - ${t.samplesCount} דוגמיות`}
                                                    ></div>
                                                ))}
                                            </div>

                                            <div className="flex justify-between text-[10px] text-gray-400 font-medium px-1">
                                                <span className="text-gray-900 font-bold">0</span>
                                                {sortedTiers.map((t, idx) => (
                                                    <span key={idx} className={subtotal >= t.minAmount ? "text-emerald-600 font-bold" : ""}>
                                                        {t.minAmount} ({t.samplesCount})
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="mt-3 text-xs text-center font-bold">
                                                {nextTierObj ? (
                                                    <span className="text-emerald-600">
                                                        {currentTier ? `יש לך ${currentTier.samplesCount} דוגמיות. ` : ""}
                                                        עוד <span className="font-bold text-black">{nextTierObj.minAmount - subtotal} ₪</span> ל-{nextTierObj.samplesCount} דוגמיות!
                                                    </span>
                                                ) : (
                                                    <span className="text-green-600 font-bold">פינקנו אותך ב-{currentTier?.samplesCount} דוגמיות! תהנה! 🎉</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })() : null}

                                {/* Recommendations / Upsell */}
                                 {recommendations.length > 0 && (
                                     <div className="space-y-3 pt-2">
                                         <h4 className="text-sm font-bold text-gray-700">השלם את החסר בקלות:</h4>
                                         <div className="space-y-2">
                                             {recommendations.map(rec => (
                                                 <div key={rec.id} className="flex items-center gap-3 bg-white border p-2 rounded-lg shadow-sm hover:shadow-md transition">
                                                     <div className="w-10 h-10 bg-gray-50 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                         {rec.image_url ? <img src={rec.image_url} alt="" className="w-full h-full object-contain p-1" /> : '🧴'}
                                                     </div>
                                                     <div className="flex-1 min-w-0">
                                                         <div className="font-bold text-xs truncate">{rec.name}</div>
                                                         <div className="text-xs text-gray-500">{rec.size} מ"ל • {rec.price} ₪</div>
                                                     </div>
                                                     <button
                                                         onClick={() => addToCart(rec, rec.size, rec.price)}
                                                         className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800 transition"
                                                         title="הוסף לעגלה"
                                                     >
                                                         +
                                                     </button>
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 )}
                             </div>

                            {/* Total */}
                            <div className="flex justify-between text-xl font-bold pt-4 border-t">
                                <span>סה״כ לתשלום</span>
                                <span>{effectiveTotal} ₪</span>
                            </div>

                            {/* Order Notes */}
                            <div className="py-2">
                                <label className="text-sm font-bold text-gray-700 mb-2 block">הערות להזמנה (אופציונלי):</label>
                                <textarea
                                    className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-gray-900 outline-none resize-none bg-white"
                                    rows="3"
                                    placeholder="בקשות מיוחדות לימי הולדת / אריזה / שליח..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                ></textarea>
                            </div>

                            {/* Phone Number */}
                            <div className="py-2 border-t pt-4">
                                <label className="text-sm font-bold text-gray-700 mb-2 block flex items-center gap-1">
                                    מספר טלפון (חובה)
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        maxLength="10"
                                        className={`w-full p-3 border rounded-lg text-lg font-mono focus:ring-2 outline-none bg-white transition-all ${phoneError ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'focus:ring-gray-900 border-gray-200'}`}
                                        placeholder="05XXXXXXXX"
                                        value={phoneNumber}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setPhoneNumber(val);
                                            if (phoneError) setPhoneError('');
                                        }}
                                    />
                                    {validatePhone(phoneNumber) === "" && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4.001-5.5Z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                {phoneError && <p className="text-red-600 text-xs font-bold mt-1 animate-shake">{phoneError}</p>}
                                <p className="text-[10px] text-gray-400 mt-1">נשתמש במספר זה רק לתיאום המשלוח והתשלום.</p>
                            </div>
                        </div>

                        {/* Sticky Checkout Button */}
                        <div className="pt-4 sticky top-[calc(6rem+400px)]">
                            {isSignedIn ? (
                                <button
                                    onClick={handleCheckout}
                                    disabled={isSubmitting}
                                    className="btn btn-primary w-full py-4 text-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5"
                                >
                                    {isSubmitting ? 'מעבד...' : 'יצירת הזמנה'}
                                </button>
                            ) : (
                                <SignInButton mode="modal">
                                    <button className="w-full py-4 text-xl font-bold text-white bg-black rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                                        התחבר כדי להזמין
                                    </button>
                                </SignInButton>
                            )}
                            <p className="text-xs text-center text-gray-500 mt-2">
                                * התשלום מתבצע מול נציג לאחר אישור ההזמנה
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {isMainVendor && showWheel && (
                <LuckyWheel
                    onWin={handleWin}
                    onClose={() => { setShowWheel(false); setHasSeenWheel(true); }}
                />
            )}
        </div>
    );
}
