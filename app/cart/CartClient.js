"use client";

import { useCart } from "../context/CartContext";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect, useRef, useMemo } from "react";
import confetti from 'canvas-confetti';
import { useRouter, useSearchParams } from 'next/navigation';
import LuckyWheel from "../components/LuckyWheel";
import toast from 'react-hot-toast';
import { useLanguage } from "../context/LanguageContext";
import Image from "next/image";

// Modular Components
import CartItem from "./components/CartItem";
import CouponSection from "./components/CouponSection";
import DeliverySection from "./components/DeliverySection";
import FreeSamplesProgress from "./components/FreeSamplesProgress";

export default function CartClient() {
    const { t } = useLanguage();
    const {
        cartItems, activeVendorId, setActiveVendorId, activeItems,
        removeFromCart, updateQuantity, addToCart, addMultipleToCart, clearCart, clearActiveVendorCart,
        subtotal, total, freeSamplesCount, nextTier,
        luckyPrize, setLuckyPrize, discountAmount,
        lotteryMode, lotteryTimeLeft,
        coupon, setCoupon, isMainVendor, totalItemsCount, vendorConfig,
        isSelfPickup, setIsSelfPickup
    } = useCart();

    const { user, isLoaded } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [upsellProducts, setUpsellProducts] = useState([]);
    const prevSamplesCount = useRef(freeSamplesCount);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showWheel, setShowWheel] = useState(false);
    const [hasSeenWheel, setHasSeenWheel] = useState(false);
    const [sharedCart, setSharedCart] = useState(null);
    const [isConfirmingLoad, setIsConfirmingLoad] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Grouping items by vendor
    const vendorBuckets = useMemo(() => {
        const buckets = {};
        cartItems.forEach(item => {
            const vId = item.vendorId || 'main';
            if (!buckets[vId]) {
                buckets[vId] = {
                    id: vId,
                    name: item.vendorName || (vId === 'main' ? t('cart.official_site') : t('cart.external_supplier')),
                    items: [],
                    totalQuantity: 0
                };
            }
            buckets[vId].items.push(item);
            buckets[vId].totalQuantity += (item.quantity || 1);
        });
        return Object.values(buckets);
    }, [cartItems, t]);

    // Safety Vendor Switch
    useEffect(() => {
        if (cartItems.length > 0 && activeItems.length === 0) {
            const firstVendorWithItems = vendorBuckets?.find(v => v.items.length > 0);
            if (firstVendorWithItems) {
                setActiveVendorId(firstVendorWithItems.id);
            }
        }
    }, [cartItems.length, activeItems.length, vendorBuckets, setActiveVendorId]);

    // Shared Cart Loading
    useEffect(() => {
        const shareId = searchParams.get('share');
        if (shareId) {
            fetch(`/api/cart/load?id=${shareId}`)
                .then(res => res.json())
                .then(data => { if (data && Array.isArray(data)) setSharedCart(data); })
                .catch(err => console.error("Failed to load shared cart", err));
        }
    }, [searchParams]);

    const handleLoadSharedCart = () => {
        if (!sharedCart) return;
        
        // Convert simple items to the format addMultipleToCart expects
        const itemsToAdd = sharedCart.map(item => ({
            product: item, 
            size: item.size,
            price: item.price,
            quantity: item.quantity || 1,
            vendorId: item.vendorId || 'main',
            vendorName: item.vendorName || (item.vendorId === 'main' ? t('cart.official_site') : t('cart.external_supplier'))
        }));

        clearCart();
        addMultipleToCart(itemsToAdd);
        setSharedCart(null);
        setIsConfirmingLoad(false);
        router.replace('/cart');
    };

    const handleShareCart = async () => {
        if (activeItems.length === 0) {
            toast.error(t('cart.empty'));
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
                const shareId = data.id;
                const url = `${window.location.origin}/cart?share=${shareId}`;
                const shareText = t('cart.share_message');

                if (navigator.share) {
                    navigator.share({ 
                        title: `ml_tlv - ${t('cart.title')}`, 
                        text: shareText,
                        url 
                    }).catch(console.error);
                } else {
                    navigator.clipboard.writeText(`${shareText}\n${url}`).then(() => {
                        toast.success(t('cart.link_copied'));
                    });
                }
            }
        } catch (e) { console.error(e); }
    };

    // Checkout Logic
    const [notes, setNotes] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [couponError, setCouponError] = useState('');

    useEffect(() => {
        if (isLoaded && user) {
            const fetchPersonalPhone = async () => {
                const res = await fetch('/api/user/phone');
                if (res.ok) {
                    const data = await res.json();
                    if (data.phone) setPhoneNumber(data.phone);
                }
            };
            fetchPersonalPhone();
        }
    }, [isLoaded, user]);

    // Tier Celebration (Confetti)
    useEffect(() => {
        if (freeSamplesCount > prevSamplesCount.current && freeSamplesCount > 0) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                zIndex: 2000
            });
        }
        prevSamplesCount.current = freeSamplesCount;
    }, [freeSamplesCount]);

    const handleCheckout = async () => {
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        if (cleanPhone.length !== 10 || !cleanPhone.startsWith('05')) {
            setPhoneError("מספר טלפון לא תקין");
            return;
        }

        setIsSubmitting(true);
        try {
            const body = {
                items: activeItems,
                total,
                notes,
                phoneNumber: cleanPhone,
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
                toast.error(data.error);
                setIsSubmitting(false);
            }
        } catch (e) {
            setIsSubmitting(false);
            toast.error('אירעה שגיאה בביצוע ההזמנה');
        }
    };

    // Upsell Fetch
    useEffect(() => {
        const fetchUpsell = async () => {
            const res = await fetch('/api/products/upsell', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ excludedIds: cartItems.map(i => i.id) })
            });
            if (res.ok) setUpsellProducts(await res.json());
        };
        if (isMainVendor && activeItems.length > 0) fetchUpsell();
    }, [isMainVendor, activeItems.length, cartItems]);

    const recommendations = useMemo(() => {
        if (!isMainVendor || nextTier <= 0) return [];
        
        const getDiscountedPrice = (product, size, originalPrice) => {
            const hasDiscount = product.discount_percentage > 0 && product.discount_sizes?.includes(`${size}ml`);
            if (!hasDiscount) return originalPrice;
            return Math.round((originalPrice * (1 - product.discount_percentage / 100)) / 5) * 5;
        };

        return upsellProducts
            .filter(p => !cartItems.some(item => item.id === p.id))
            .map(p => {
                const sizes = [
                    { size: '2', price: Number(p.price_2ml) },
                    { size: '5', price: Number(p.price_5ml) },
                    { size: '10', price: Number(p.price_10ml) }
                ].filter(s => s.price > 0);
                
                let bestMatch = sizes.find(s => s.price >= nextTier) || sizes[sizes.length - 1];
                if (!bestMatch) return null;

                const originalPrice = bestMatch.price;
                const discountedPrice = getDiscountedPrice(p, bestMatch.size, originalPrice);

                return { 
                    ...p, 
                    size: bestMatch.size, 
                    price: discountedPrice, 
                    originalPrice: originalPrice 
                };
            })
            .filter(Boolean)
            .slice(0, 3);
    }, [isMainVendor, nextTier, upsellProducts, cartItems]);

    // Lucky Wheel
    useEffect(() => {
        const lastSpin = localStorage.getItem('lastLuckySpin');
        const canSpin = !lastSpin || (Date.now() - parseInt(lastSpin) > 24 * 60 * 60 * 1000);
        if (subtotal >= 1200 && !luckyPrize && !hasSeenWheel && canSpin) setShowWheel(true);
    }, [subtotal, luckyPrize, hasSeenWheel]);

    const handleWin = (prize) => {
        setLuckyPrize(prize);
        localStorage.setItem('lastLuckySpin', Date.now().toString());
        if (prize.type === 'item') {
            addToCart({ id: `prize-${prize.size}`, name: prize.name, image_url: prize.image_url, price: 0, isPrize: true }, prize.size, 0);
        }
        setTimeout(() => { setShowWheel(false); setHasSeenWheel(true); }, 1000);
    };

    if (isSubmitting) {
        return (
            <div className="container py-20 text-center flex flex-col items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-black mb-4"></div>
                <h2 className="text-2xl font-bold">{t('cart.processing')}</h2>
            </div>
        );
    }

    if (cartItems.length === 0 && !sharedCart) {
        return (
            <div className="container py-20 text-center">
                <h1 className="text-3xl font-bold mb-4">{t('cart.empty')}</h1>
                <Link href="/catalog" className="btn btn-primary">{t('cart.back_to_catalog')}</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container py-12">
                
                {/* Banners */}
                {lotteryMode?.active && (
                    <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-xl mb-8 shadow-lg flex items-center justify-between">
                        <div className="text-xl font-black">{t('cart.flash_sale')}</div>
                        <div className="text-4xl font-mono">{Math.floor(lotteryTimeLeft / 60)}:{(lotteryTimeLeft % 60).toString().padStart(2, '0')}</div>
                    </div>
                )}

                {sharedCart && (
                    <div className="bg-blue-600 text-white p-4 rounded-xl mb-8 shadow-lg flex items-center justify-between">
                        {!isConfirmingLoad ? (
                            <>
                                <p>{t('cart.shared_cart_received', { count: sharedCart.length })}</p>
                                <button 
                                    onClick={() => setIsConfirmingLoad(true)} 
                                    className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-opacity-90 transition"
                                >
                                    {t('cart.load_cart_btn')}
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="font-bold">{t('cart.shared_cart_confirm_prompt')}</p>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleLoadSharedCart} 
                                        className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-green-50 transition"
                                    >
                                        {t('cart.confirm_load')}
                                    </button>
                                    <button 
                                        onClick={() => setIsConfirmingLoad(false)} 
                                        className="bg-blue-800 text-white px-4 py-2 rounded-lg border border-blue-400 hover:bg-blue-700 transition"
                                    >
                                        {t('cart.cancel')}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-12 mb-8 items-center">
                    <div className="flex-1 flex items-center justify-between w-full">
                        <h1 className="text-3xl font-bold">{t('cart.title')}</h1>
                        <button 
                            onClick={() => setShowClearConfirm(true)}
                            className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-red-500 transition-all duration-300 px-3 py-1.5 rounded-lg hover:bg-red-50 group"
                        >
                            <div className="p-1.5 bg-gray-100 rounded-lg group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <span>{t('cart.clear_cart_btn')}</span>
                        </button>
                    </div>

                    <div className="w-full lg:w-96 flex justify-start">
                        <button 
                            onClick={handleShareCart} 
                            className="p-2.5 bg-white border border-gray-100 shadow-sm rounded-full hover:bg-gray-50 transition-all hover:scale-110 active:scale-95" 
                            title={t('cart.share_cart')}
                        >
                            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M15.75 4.5a3 3 0 1 1 .825 2.066l-8.421 4.679a3.002 3.002 0 0 1 0 1.51l8.421 4.679a3 3 0 1 1-.729 1.31l-8.421-4.678a3 3 0 1 1 0-4.132l8.421-4.679a3 3 0 0 1-.096-.755Z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Custom Clear Cart Confirmation Modal */}

                {/* Custom Clear Cart Confirmation Modal */}
                {showClearConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowClearConfirm(false)} />
                        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative z-10 scale-in-center animate-in zoom-in-95 duration-200 text-center">
                            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-black mb-3">{t('cart.clear_cart_btn')}?</h3>
                            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                                {t('cart.confirm_clear_cart_full')}
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setShowClearConfirm(false)}
                                    className="py-4 px-6 rounded-2xl bg-gray-100 font-bold hover:bg-gray-200 transition-colors"
                                >
                                    {t('cart.cancel')}
                                </button>
                                <button 
                                    onClick={() => {
                                        clearCart();
                                        setShowClearConfirm(false);
                                        toast.success(t('cart.cart_cleared_toast'));
                                    }}
                                    className="py-4 px-6 rounded-2xl bg-black text-white font-bold hover:bg-gray-900 transition-colors shadow-lg active:scale-95"
                                >
                                    {t('cart.confirm_clear_cart_btn')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Vendor Selector */}
                {vendorBuckets.length > 1 && (
                    <div className="mb-6 flex gap-2 sticky top-20 z-40 bg-gray-50/80 backdrop-blur-md py-4">
                        {vendorBuckets.map(v => (
                            <button 
                                key={v.id} 
                                onClick={() => setActiveVendorId(v.id)}
                                className={`px-4 py-2 rounded-full border transition ${activeVendorId === v.id ? 'bg-black text-white' : 'bg-white text-gray-500'}`}
                            >
                                {v.name} ({v.totalQuantity})
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-12">
                    <div className="flex-1 space-y-6">
                        {activeItems.map(item => (
                            <CartItem 
                                key={`${item.id}-${item.size}`} 
                                item={item} 
                                updateQuantity={updateQuantity} 
                                removeFromCart={removeFromCart} 
                                activeVendorId={activeVendorId} 
                            />
                        ))}
                    </div>

                    <div className="w-full lg:w-96 space-y-6">
                        <div className="bg-white p-6 rounded-xl border shadow-xl space-y-6 sticky top-24">
                            <h2 className="text-xl font-bold border-b pb-4">{t('cart.order_summary')}</h2>

                            <div className="flex justify-between text-lg items-center">
                                <span>{t('cart.subtotal')}</span>
                                <div className="flex items-center gap-2">
                                    {coupon && (
                                        <span className="line-through text-gray-400 text-sm">
                                            {t('cart.price_format', { price: subtotal })}
                                        </span>
                                    )}
                                    <span className="font-bold">
                                        {t('cart.price_format', { price: coupon ? subtotal - discountAmount : subtotal })}
                                    </span>
                                </div>
                            </div>

                            {isMainVendor && luckyPrize?.type === 'discount' && !lotteryMode?.active && (
                                <div className="flex justify-between text-green-600 font-bold">
                                    <span>{t('cart.discount', { percent: luckyPrize.value * 100 })}</span>
                                    <span dir="ltr">₪ -{Math.round(subtotal * luckyPrize.value)}</span>
                                </div>
                            )}

                            <CouponSection 
                                coupon={coupon} 
                                setCoupon={setCoupon} 
                                subtotal={subtotal} 
                                cartItems={cartItems} 
                                user={user} 
                                couponError={couponError}
                                setCouponError={setCouponError}
                            />

                            <DeliverySection 
                                isMainVendor={isMainVendor} 
                                vendorConfig={vendorConfig} 
                                isSelfPickup={isSelfPickup} 
                                setIsSelfPickup={setIsSelfPickup} 
                            />

                            <FreeSamplesProgress 
                                isMainVendor={isMainVendor} 
                                subtotal={subtotal} 
                                freeSamplesCount={freeSamplesCount} 
                                vendorConfig={vendorConfig} 
                            />

                            {/* Recommendations / Upsell */}
                            {recommendations.length > 0 && (
                                <div className="space-y-3 pt-2">
                                    <h4 className="text-sm font-bold text-gray-700">{t('cart.upsell_title')}</h4>
                                    <div className="space-y-2">
                                        {recommendations.map(rec => (
                                            <div key={rec.id} className="flex items-center gap-3 bg-white border p-2 rounded-lg shadow-sm hover:shadow-md transition">
                                                <div className="w-10 h-10 bg-gray-50 rounded flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                                                    {rec.image_url ? <Image src={rec.image_url} alt={rec.name || "Product"} fill sizes="40px" className="object-contain p-1" /> : '🧴'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-xs truncate">{rec.name}</div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                                        <span>{rec.size} {t('common.ml_unit')}</span>
                                                        <span className="text-gray-300">•</span>
                                                        {rec.originalPrice && rec.originalPrice !== rec.price ? (
                                                            <span className="flex items-center gap-1.5">
                                                                <span className="line-through text-gray-400 opacity-70">{rec.originalPrice} ₪</span>
                                                                <span className="text-green-600 font-bold">{rec.price} ₪</span>
                                                            </span>
                                                        ) : (
                                                            <span>{rec.price} ₪</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => addToCart(rec, rec.size, rec.price, 'main', 'האתר הרשמי', rec.originalPrice)}
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

                            {/* Phone Number */}
                            <div className="py-2 border-t pt-4">
                                <label className="text-sm font-bold text-gray-700 mb-2 block flex items-center gap-1">
                                    {t('cart.phone_label')}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        maxLength="10"
                                        className={`w-full p-3 border rounded-lg text-lg font-mono focus:ring-2 outline-none bg-white transition-all ${phoneError ? 'border-red-500 bg-red-50' : 'focus:ring-gray-900 border-gray-200'}`}
                                        placeholder="05XXXXXXXX"
                                        value={phoneNumber}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setPhoneNumber(val);
                                            if (phoneError) setPhoneError('');
                                        }}
                                    />
                                    {phoneNumber.length === 10 && phoneNumber.startsWith('05') && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4.001-5.5Z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                {phoneError && <p className="text-red-600 text-xs font-bold mt-1 animate-shake">{phoneError}</p>}
                                <p className="text-[10px] text-gray-400 mt-1">{t('cart.phone_disclaimer')}</p>
                            </div>

                            {/* Order Notes */}
                            <div className="py-2">
                                <label className="text-sm font-bold text-gray-700 mb-2 block">{t('cart.order_notes_label')}</label>
                                <textarea
                                    className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-gray-900 outline-none resize-none bg-white"
                                    rows="3"
                                    placeholder={t('cart.order_notes_placeholder')}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                ></textarea>
                            </div>

                                <div className="flex justify-between items-center text-2xl font-black pt-4 border-t mt-4">
                                    <span>{t('cart.total')}</span>
                                    <span>{t('cart.price_format', { price: total })}</span>
                                </div>

                                <div className="pt-6">
                                    <button 
                                        onClick={handleCheckout}
                                        className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-900 transition-all shadow-lg active:scale-95"
                                    >
                                        {t('cart.checkout_btn')}
                                    </button>
                                    <p className="text-[10px] text-gray-400 text-center mt-2">{t('cart.pickup_note')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
            </div>

            {showWheel && <LuckyWheel onWin={handleWin} onClose={() => setShowWheel(false)} />}
        </div>
    );
}
