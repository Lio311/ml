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

// Modular Components
import CartItem from "./components/CartItem";
import CouponSection from "./components/CouponSection";
import DeliverySection from "./components/DeliverySection";
import FreeSamplesProgress from "./components/FreeSamplesProgress";
import UpsellRecs from "./components/UpsellRecs";

export default function CartClient() {
    const { t } = useLanguage();
    const {
        cartItems, activeVendorId, setActiveVendorId, activeItems,
        removeFromCart, updateQuantity, addToCart, clearCart, clearActiveVendorCart,
        subtotal, total, freeSamplesCount, nextTier,
        luckyPrize, setLuckyPrize, discountAmount,
        lotteryMode, lotteryTimeLeft,
        coupon, setCoupon, isMainVendor, totalItemsCount, vendorConfig,
        isSelfPickup, setIsSelfPickup
    } = useCart();

    const { user } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [upsellProducts, setUpsellProducts] = useState([]);
    const prevSamplesCount = useRef(freeSamplesCount);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showWheel, setShowWheel] = useState(false);
    const [hasSeenWheel, setHasSeenWheel] = useState(false);
    const [sharedCart, setSharedCart] = useState(null);

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
        if (confirm(t('cart.load_shared_cart_confirm'))) {
            clearCart();
            sharedCart.forEach(item => {
                for (let k = 0; k < item.quantity; k++) {
                    addToCart(item, item.size, item.price, item.vendorId || 'main', item.vendorName || t('cart.official_site'));
                }
            });
            setSharedCart(null);
            router.replace('/cart');
        }
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
                const url = `${window.location.origin}/cart?share=${data.id}`;
                if (navigator.share) {
                    navigator.share({ title: `ml_tlv - ${t('cart.title')}`, url }).catch(console.error);
                } else {
                    navigator.clipboard.writeText(url).then(() => toast.success(t('cart.link_copied')));
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
        const fetchPersonalPhone = async () => {
            const res = await fetch('/api/user/phone');
            if (res.ok) {
                const data = await res.json();
                if (data.phone) setPhoneNumber(data.phone);
            }
        };
        fetchPersonalPhone();
    }, []);

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

    if (cartItems.length === 0) {
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
                        <p>{t('cart.shared_cart_received', { count: sharedCart.length })}</p>
                        <button onClick={handleLoadSharedCart} className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold">{t('cart.load_cart_btn')}</button>
                    </div>
                )}

                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">{t('cart.title')}</h1>
                    <button onClick={handleShareCart} className="p-2 bg-gray-100 rounded-full" title={t('cart.share_cart')}>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M15.75 4.5a3 3 0 1 1 .825 2.066l-8.421 4.679a3.002 3.002 0 0 1 0 1.51l8.421 4.679a3 3 0 1 1-.729 1.31l-8.421-4.678a3 3 0 1 1 0-4.132l8.421-4.679a3 3 0 0 1-.096-.755Z" /></svg>
                    </button>
                </div>

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

                            <div className="flex justify-between text-lg">
                                <span>{t('cart.subtotal')}</span>
                                <span className="font-bold">{subtotal} ₪</span>
                            </div>

                            {isMainVendor && luckyPrize?.type === 'discount' && !lotteryMode?.active && (
                                <div className="flex justify-between text-green-600 font-bold">
                                    <span>{t('cart.discount', { percent: luckyPrize.value * 100 })}</span>
                                    <span>{Math.round(subtotal * luckyPrize.value)}- ₪</span>
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

                            <div className="space-y-4 pt-4 border-t">
                                <input 
                                    type="tel" 
                                    placeholder={t('cart.phone_placeholder')}
                                    className={`w-full p-3 border rounded-xl ${phoneError ? 'border-red-500 bg-red-50' : ''}`}
                                    value={phoneNumber}
                                    onChange={(e) => { setPhoneNumber(e.target.value); setPhoneError(''); }}
                                />
                                {phoneError && <p className="text-red-600 text-xs font-bold">{phoneError}</p>}

                                <textarea 
                                    placeholder={t('cart.notes_placeholder')}
                                    className="w-full p-3 border rounded-xl h-24"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />

                                <div className="flex justify-between items-center text-2xl font-black pt-4">
                                    <span>{t('cart.total')}</span>
                                    <span>{total} ₪</span>
                                </div>

                                <button 
                                    onClick={handleCheckout}
                                    className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-900 transition-all shadow-lg active:scale-95"
                                >
                                    {t('cart.checkout_btn')}
                                </button>
                                <p className="text-[10px] text-gray-400 text-center">{t('cart.pickup_note')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <UpsellRecs 
                    isMainVendor={isMainVendor} 
                    nextTier={nextTier} 
                    upsellProducts={upsellProducts} 
                    cartItems={cartItems} 
                    addToCart={addToCart} 
                />
            </div>

            {showWheel && <LuckyWheel onWin={handleWin} onClose={() => setShowWheel(false)} />}
        </div>
    );
}
