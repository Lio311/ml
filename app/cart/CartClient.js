"use client";

import { useCart } from "../context/CartContext";
import Link from "next/link";
import { useUser, SignInButton } from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";
import confetti from 'canvas-confetti';
import { useRouter, useSearchParams } from 'next/navigation';
import LuckyWheel from "../components/LuckyWheel";

export default function CartClient() {
    const { cartItems, removeFromCart, updateQuantity, addToCart, clearCart, addMultipleToCart, subtotal, total, shippingCost, freeSamplesCount, nextTier, luckyPrize, setLuckyPrize, discountAmount, lotteryMode, lotteryTimeLeft, coupon, setCoupon } = useCart();
    const { isSignedIn, user } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [upsellProducts, setUpsellProducts] = useState([]);
    const prevSamplesCount = useRef(freeSamplesCount);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showWheel, setShowWheel] = useState(false);
    const [hasSeenWheel, setHasSeenWheel] = useState(false);
    const [sharedCart, setSharedCart] = useState(null);

    // Check for shared cart in URL (Short ID now)
    useEffect(() => {
        const shareId = searchParams.get('share');
        if (shareId) {
            // Fetch from DB
            fetch(`/api/cart/load?id=${shareId}`)
                .then(res => res.json())
                .then(data => {
                    if (data && Array.isArray(data)) {
                        setSharedCart(data);
                    }
                })
                .catch(err => console.error("Failed to load shared cart", err));
        }
    }, [searchParams]);

    const handleLoadSharedCart = () => {
        if (!sharedCart) return;
        if (confirm("פעולה זו תחליף את הסל הנוכחי שלך בסל המשותף. האם להמשיך?")) {
            clearCart();

            // Re-add items. Logic assumes payload has ample info, or we rely on backend data being robust.
            // Shared cart items structure: {id, size, quantity, ...}
            sharedCart.forEach(item => {
                for (let k = 0; k < item.quantity; k++) {
                    addToCart(item, item.size, item.price);
                }
            });

            setSharedCart(null);
            router.replace('/cart'); // Clear URL
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

                navigator.clipboard.writeText(url).then(() => {
                    alert("הקישור הועתק, מוזמנים לשתף!");
                });
            } else {
                alert("שגיאה ביצירת קישור לשיתוף");
            }
        } catch (e) {
            console.error(e);
            alert("שגיאה ביצירת קישור לשיתוף");
        }
    };

    // Coupon State
    const [couponInput, setCouponInput] = useState('');
    const [couponError, setCouponError] = useState('');
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

    // Order Notes State
    const [notes, setNotes] = useState('');

    const handleApplyCoupon = async () => {
        if (!couponInput) return;
        setIsValidatingCoupon(true);
        setCouponError(''); // Clear prev error

        try {
            const res = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponInput })
            });
            const data = await res.json();
            if (res.ok) {
                setCoupon({ code: data.code, discountPercent: data.discountPercent });
                setCouponInput('');
                // Success feedback handled by UI showing the applied coupon
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

    useEffect(() => {
        if (freeSamplesCount > prevSamplesCount.current) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                zIndex: 1000
            });
        }
        prevSamplesCount.current = freeSamplesCount;
    }, [freeSamplesCount]);

    useEffect(() => {
        const fetchUpsell = async () => {
            try {
                // Pass current cart IDs to exclude them from suggestions
                const excludedIds = cartItems.map(item => item.id);

                const res = await fetch('/api/products/upsell', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ excludedIds })
                });

                if (res.ok) {
                    const products = await res.json();
                    setUpsellProducts(products);
                }
            } catch (err) {
                console.error("Failed to fetch upsell products", err);
            }
        };
        if (cartItems.length > 0) {
            fetchUpsell();
        }
    }, [cartItems.length]);

    // Trigger Wheel if > 1200
    useEffect(() => {
        const lastSpin = localStorage.getItem('lastLuckySpin');
        const now = Date.now();
        const cooldown = 24 * 60 * 60 * 1000; // 24 hours

        const canSpin = !lastSpin || (now - parseInt(lastSpin) > cooldown);

        if (subtotal >= 1200 && !luckyPrize && !hasSeenWheel && canSpin) {
            setShowWheel(true);
        }
    }, [subtotal, luckyPrize, hasSeenWheel]);

    const handleWin = (prize) => {
        setLuckyPrize(prize);

        // Save spin time
        localStorage.setItem('lastLuckySpin', Date.now().toString());

        // If it's an item, add to cart
        if (prize.type === 'item') {
            const prizeProduct = {
                id: `prize-${prize.size}`,
                name: prize.name,
                image_url: prize.image_url || null,
                price: 0,
                stock: 999, // Always available
                isPrize: true // Flag to identify and maybe prevent quantity update
            };
            addToCart(prizeProduct, prize.size, 0);
        }

        setTimeout(() => {
            setShowWheel(false);
            setHasSeenWheel(true);
        }, 1000);
    };

    const handleCheckout = async () => {
        setIsSubmitting(true);
        // Create Order via API
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cartItems,
                    total: total,
                    freeSamples: freeSamplesCount,
                    notes: notes
                })
            });

            if (res.ok) {
                clearCart();
                router.push('/checkout/success');
            } else {
                const data = await res.json();
                alert(`אירעה שגיאה לצערי: ${data.error}`);
                setIsSubmitting(false);
            }
        } catch (e) {
            console.error(e);
            alert('אירעה שגיאה. בדוק חיבור לרשת.');
            setIsSubmitting(false);
        }
    };

    // Smart Upsell Logic
    const getRecommendations = () => {
        if (nextTier <= 0) return []; // Already maxed out

        // Find best fit for the gap
        const recommendations = upsellProducts
            .filter(p => !cartItems.some(item => item.id === p.id))
            .map(p => {
                const sizes = [
                    { size: '2', price: Number(p.price_2ml) },
                    { size: '5', price: Number(p.price_5ml) },
                    { size: '10', price: Number(p.price_10ml) }
                ].filter(s => s.price > 0);

                let bestMatch = sizes.find(s => s.price >= nextTier);
                if (!bestMatch) {
                    bestMatch = sizes[sizes.length - 1];
                }
                return { ...p, ...bestMatch };
            })
            .slice(0, 3); // Take top 3

        return recommendations;
    };

    const recommendations = getRecommendations();

    if (cartItems.length === 0) {
        return (
            <div className="container py-20 text-center">
                <h1 className="text-3xl font-bold mb-4">העגלה שלך ריקה</h1>
                <p className="text-gray-500 mb-8">נראה שעדיין לא בחרת ריחות שווים...</p>
                <Link href="/catalog" className="btn btn-primary">
                    חזרה לקטלוג
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container py-12">
                {lotteryMode.active && (
                    <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-xl mb-8 shadow-lg flex items-center justify-between animate-pulse">
                        <div className="flex items-center gap-4">
                            <div>
                                <h3 className="font-black text-xl">מחיר ההגרלה בתוקף!</h3>
                                <p className="text-sm font-bold opacity-80">הנחת 15% פעילה. הסל נעול לשינויים.</p>
                            </div>
                        </div>
                        <div className="text-4xl font-mono font-black">
                            {Math.floor(lotteryTimeLeft / 60)}:{(lotteryTimeLeft % 60).toString().padStart(2, '0')}
                        </div>
                    </div>
                )}
                {sharedCart && (
                    <div className="bg-blue-600 text-white p-4 rounded-xl mb-8 shadow-lg flex items-center justify-between animate-fade-in">
                        <div>
                            <h3 className="font-bold text-lg">קיבלת סל משותף! 🛍️</h3>
                            <p className="text-sm opacity-90">הסל מכיל {sharedCart.length} פריטים. האם תרצה לטעון אותם?</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setSharedCart(null); router.replace('/cart'); }}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition"
                            >
                                התעלם
                            </button>
                            <button
                                onClick={handleLoadSharedCart}
                                className="px-4 py-2 bg-white text-blue-600 font-bold rounded-lg text-sm hover:scale-105 transition shadow"
                            >
                                טען סל
                            </button>
                        </div>
                    </div>
                )}

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

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Items List */}
                    <div className="flex-1 space-y-6">
                        {cartItems.map((item) => (
                            <div key={`${item.id}-${item.size}`} className={`flex items-center gap-4 border p-4 rounded-lg bg-white shadow-sm relative ${item.isPrize ? 'border-amber-300 bg-amber-50' : ''}`}>
                                <div className="w-20 h-20 bg-white flex items-center justify-center text-2xl rounded overflow-hidden relative border border-gray-100 flex-shrink-0">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                                    ) : (
                                        <span>{item.isPrize ? '🎁' : '🧴'}</span>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold truncate">{item.name}</h3>
                                    <div className="text-sm text-gray-500">גודל: {item.size === 'set' ? 'סט' : `${item.size} מ"ל`}</div>
                                    <div className={`text-sm font-bold mt-1 ${item.isPrize ? 'text-green-600' : 'text-primary'}`}>{item.price} ₪ {item.isPrize && '(מתנה)'}</div>
                                </div>

                                {!item.isPrize && (
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition">-</button>
                                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition">+</button>
                                    </div>
                                )}

                                <button onClick={() => removeFromCart(item.id, item.size)} className="text-red-500 p-2 hover:bg-red-50 rounded-full transition" aria-label="Remove">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Summary & Checkout */}
                    <div className="w-full lg:w-96 space-y-6">
                        <div className="bg-white p-6 rounded-xl border shadow-xl space-y-6 sticky top-24">
                            <h2 className="text-xl font-bold border-b pb-4">סיכום הזמנה</h2>

                            <div className="flex justify-between items-center text-lg">
                                <span>סכום ביניים</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold whitespace-nowrap">{subtotal} ₪</span>
                                    <span className="text-sm text-gray-500 font-normal whitespace-nowrap" dir="rtl">(סה״כ: {cartItems.reduce((acc, item) => acc + item.quantity, 0)} פריטים)</span>
                                </div>
                            </div>

                            {lotteryMode.active && (
                                <div className="flex justify-between text-lg text-yellow-600 font-bold">
                                    <span>הנחת הגרלה (15%)</span>
                                    <span>{discountAmount}- ₪</span>
                                </div>
                            )}

                            {luckyPrize?.type === 'discount' && !lotteryMode.active && (
                                <div className="flex justify-between text-lg text-green-600 font-bold">
                                    <span>הנחת גלגל המזל ({luckyPrize.value * 100}%)</span>
                                    <span>{Math.round(subtotal * luckyPrize.value)}- ₪</span>
                                </div>
                            )}

                            {coupon && (
                                <div className="flex justify-between text-lg text-green-600 font-bold">
                                    <span>קופון {coupon.code} ({coupon.discountPercent}%)</span>
                                    <span>
                                        {(() => {
                                            // Calculate coupon discount amount locally to match Context logic
                                            let base = subtotal;
                                            if (lotteryMode.active) base -= Math.round(base * 0.15);
                                            else if (luckyPrize?.type === 'discount') base -= Math.round(base * luckyPrize.value);

                                            const val = Math.round(base * (coupon.discountPercent / 100));
                                            return val;
                                        })()}- ₪
                                    </span>
                                </div>
                            )}

                            {/* Coupon Section */}
                            <div className="border-t border-b py-4">
                                {coupon ? (
                                    <div className="flex justify-between items-center bg-green-50 p-3 rounded border border-green-200">
                                        <div>
                                            <div className="font-bold text-green-700">קופון {coupon.code}</div>
                                            <div className="text-xs text-green-600">הנחה של {coupon.discountPercent}%</div>
                                        </div>
                                        <button
                                            onClick={() => setCoupon(null)}
                                            className="text-red-500 hover:bg-red-50 p-1 rounded"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="קוד קופון"
                                                className={`input input-bordered flex-1 p-2 border rounded ${couponError ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-500' : ''}`}
                                                value={couponInput}
                                                onChange={(e) => {
                                                    setCouponInput(e.target.value.toUpperCase());
                                                    if (couponError) setCouponError(''); // clear error while typing
                                                }}
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



                            <div className="flex justify-between text-lg">
                                <span>משלוח</span>
                                <span>{shippingCost} ₪</span>
                            </div>

                            {/* Free Samples Logic */}
                            <div className={`p-4 rounded border text-sm ${freeSamplesCount > 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
                                {freeSamplesCount > 0 ? (
                                    <div className="text-blue-800 font-bold mb-1">
                                        מגיע לך {freeSamplesCount} דוגמיות מתנה! 🎉
                                        <br />
                                        <span className="font-normal text-xs text-blue-600">
                                            (הצוות יבחר אותן בקפידה עבורך)
                                        </span>
                                    </div>
                                ) : (
                                    <div className="text-gray-800 font-medium">
                                        חסר לך עוד <span className="font-bold text-orange-600">{nextTier} ₪</span> כדי לקבל <span className="font-bold">2 דוגמיות מתנה</span> 🎁
                                    </div>
                                )}

                                {nextTier > 0 && freeSamplesCount > 0 && freeSamplesCount < 6 && (
                                    <div className="mt-2 text-xs text-blue-600 border-t border-blue-200 pt-2 font-medium">
                                        הוסף עוד {nextTier} ₪ וקבל עוד 2 דוגמיות!
                                    </div>
                                )}
                            </div>

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

                            <div className="flex justify-between text-xl font-bold pt-4 border-t">
                                <span>סה״כ לתשלום</span>
                                <span>{total} ₪</span>
                            </div>

                            {/* Order Notes (Moved) */}
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
                        </div>

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
            {showWheel && (
                <LuckyWheel
                    onWin={handleWin}
                    onClose={() => { setShowWheel(false); setHasSeenWheel(true); }}
                />
            )}
        </div>
    );
}
```
