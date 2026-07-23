"use client";

import { useCart } from "../context/CartContext";
import Link from "next/link";
import { useUser, useClerk } from "@clerk/nextjs";
import { useState, useEffect, useRef, useMemo } from "react";
import confetti from 'canvas-confetti';
import { useRouter, useSearchParams } from 'next/navigation';
import LuckyWheel from "../components/LuckyWheel";
import toast from 'react-hot-toast';
import { useLanguage } from "../context/LanguageContext";
import Image from "@/app/components/CImage";
import { Check } from "lucide-react";

// Modular Components
import CartItem from "./components/CartItem";
import CouponSection from "./components/CouponSection";

import DeliverySection from "./components/DeliverySection";
import FreeSamplesProgress from "./components/FreeSamplesProgress";
import AutocompleteInput from "./components/AutocompleteInput";

export default function CartClient() {
    const { t } = useLanguage();
    const {
        cartItems, activeVendorId, setActiveVendorId, activeItems,
        removeFromCart, updateQuantity, addToCart, addMultipleToCart, clearCart, clearActiveVendorCart,
        subtotal, total, freeSamplesCount, nextTier,
        luckyPrize, setLuckyPrize, discountAmount, promoDiscountAmount,
        lotteryMode, lotteryTimeLeft,
        coupon, setCoupon, isMainVendor, totalItemsCount, vendorConfig,
        deliveryMethod, setDeliveryMethod, isSelfPickup, setIsSelfPickup
    } = useCart();

    const { user, isLoaded } = useUser();
    const { openSignIn } = useClerk();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [upsellProducts, setUpsellProducts] = useState([]);
    const [isUpsellLoading, setIsUpsellLoading] = useState(false);
    const prevSamplesCount = useRef(freeSamplesCount);
    const router = useRouter();
    const searchParams = useSearchParams();
    // Cache cities and streets to avoid full text search issues
    const cachedCities = useRef(null);
    const cachedStreets = useRef({});
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

    const [outOfStockErrorItems, setOutOfStockErrorItems] = useState([]);

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
    
    // Address Logic
    const [address, setAddress] = useState({ street: '', houseNumber: '', apartment: '', city: '' });
    const [addressError, setAddressError] = useState('');
    const [lastAddress, setLastAddress] = useState(null);
    const [shipToNewAddress, setShipToNewAddress] = useState(false);

    useEffect(() => {
        if (isLoaded && user) {
            const fetchPersonalData = async () => {
                // Fetch Phone
                const resPhone = await fetch('/api/user/phone');
                if (resPhone.ok) {
                    const data = await resPhone.json();
                    if (data.phone) setPhoneNumber(data.phone);
                }

                // Fetch Last Address
                const resAddress = await fetch('/api/user/last-order');
                if (resAddress.ok) {
                    const data = await resAddress.json();
                    if (data.address) {
                        setLastAddress(data.address);
                        setAddress(data.address);
                    }
                }
            };
            fetchPersonalData();
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        if (!user) {
            openSignIn({ mode: 'modal' });
            return;
        }

        const cleanPhone = phoneNumber.replace(/\D/g, '');
        if (cleanPhone.length < 9 || cleanPhone.length > 10 || !cleanPhone.startsWith('0')) {
            setPhoneError("מספר טלפון לא תקין");
            toast.error("אנא הזן מספר טלפון תקין");
            return;
        }

        if (deliveryMethod !== 'self_pickup') {
            if (!address.street || !address.city || !address.apartment || !address.houseNumber) {
                setAddressError("אנא מלא רחוב, מספר בית, מספר דירה (0 אם פרטי), ועיר למשלוח");
                toast.error("אנא מלא את כל שדות החובה למשלוח");
                return;
            }

            try {
                if (!cachedCities.current) {
                    const res = await fetch(`https://data.gov.il/api/3/action/datastore_search?resource_id=5c78e9fa-c2e2-4771-93ff-7f400a12f7ba&limit=3000`);
                    const data = await res.json();
                    cachedCities.current = data.result.records.map(r => r['שם_ישוב'].trim()).filter(c => c !== 'לא רשום');
                }
                if (!cachedCities.current.includes(address.city)) {
                    setAddressError("אנא בחר עיר מתוך הרשימה המופיעה");
                    toast.error("העיר שהזנת לא נמצאה. אנא בחר מהרשימה.");
                    return;
                }

                if (!cachedStreets.current[address.city]) {
                    const res = await fetch(`https://data.gov.il/api/3/action/datastore_search?resource_id=9ad3862c-8391-4b2f-84a4-2d4c68625f4b&q=${encodeURIComponent(address.city)}&limit=5000`);
                    const data = await res.json();
                    cachedStreets.current[address.city] = data.result.records
                        .filter(r => r['שם_ישוב'].trim() === address.city)
                        .map(r => r['שם_רחוב'].trim());
                }
                if (!cachedStreets.current[address.city].includes(address.street)) {
                    setAddressError("אנא בחר רחוב מתוך הרשימה המופיעה");
                    toast.error("הרחוב שהזנת לא נמצא בעיר זו. אנא בחר מהרשימה.");
                    return;
                }
            } catch(e) {}
        }

        setIsSubmitting(true);

        // Track funnel event: checkout_started
        try {
            const sid = sessionStorage.getItem('funnel_session_id');
            if (sid) {
                fetch('/api/analytics/funnel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: sid, eventType: 'checkout_started', metadata: { itemCount: activeItems.length, total } })
                }).catch(() => {});
            }
        } catch(e) {}

        try {
            const body = {
                items: activeItems,
                total,
                notes: notes,
                phoneNumber: cleanPhone,
                activeVendorId,
                freeSamples: freeSamplesCount,
                deliveryMethod: deliveryMethod,
                address: deliveryMethod !== 'self_pickup' ? address : null,
                couponCode: coupon?.code
            };

            const endpoint = isMainVendor ? '/api/orders' : `/api/user-catalogs/${activeVendorId}/orders`;
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                // Track funnel event: order_completed
                try {
                    const sid = sessionStorage.getItem('funnel_session_id');
                    if (sid) {
                        fetch('/api/analytics/funnel', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ sessionId: sid, eventType: 'order_completed', metadata: { total } })
                        }).catch(() => {});
                    }
                } catch(e) {}

                clearActiveVendorCart();
                router.push('/checkout/success');
            } else {
                const data = await res.json();
                if (data.error === 'OUT_OF_STOCK') {
                    setOutOfStockErrorItems(data.items || []);
                    toast.error('אחד או יותר מהפריטים בעגלה אזל במלאי. אנא הסר אותם בכדי להמשיך.', { duration: 6000 });
                } else {
                    toast.error(data.error || data.message || 'שגיאה בעת ביצוע ההזמנה');
                }
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
            setIsUpsellLoading(true);
            try {
                const res = await fetch('/api/products/upsell', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ excludedIds: cartItems.map(i => i.id) })
                });
                if (res.ok) setUpsellProducts(await res.json());
            } catch (err) {
                console.error("Failed to fetch upsell", err);
            } finally {
                setIsUpsellLoading(false);
            }
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

    const fetchCitySuggestions = async (val) => {
        try {
            if (!cachedCities.current) {
                const res = await fetch(`https://data.gov.il/api/3/action/datastore_search?resource_id=5c78e9fa-c2e2-4771-93ff-7f400a12f7ba&limit=3000`);
                const data = await res.json();
                cachedCities.current = data.result.records.map(r => r['שם_ישוב'].trim()).filter(c => c !== 'לא רשום');
            }
            let records = cachedCities.current.filter(c => c.includes(val));
            
            records.sort((a, b) => {
                const aStarts = a.startsWith(val);
                const bStarts = b.startsWith(val);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                return a.localeCompare(b);
            });
            
            return [...new Set(records)].slice(0, 5);
        } catch (e) {
            return [];
        }
    };

    const fetchStreetSuggestions = async (val) => {
        try {
            if (!address.city) return []; // Require city first
            
            if (!cachedStreets.current[address.city]) {
                const res = await fetch(`https://data.gov.il/api/3/action/datastore_search?resource_id=9ad3862c-8391-4b2f-84a4-2d4c68625f4b&q=${encodeURIComponent(address.city)}&limit=5000`);
                const data = await res.json();
                cachedStreets.current[address.city] = data.result.records
                    .filter(r => r['שם_ישוב'].trim() === address.city)
                    .map(r => r['שם_רחוב'].trim());
            }

            let records = cachedStreets.current[address.city].filter(c => c.includes(val));
            
            records.sort((a, b) => {
                const aStarts = a.startsWith(val);
                const bStarts = b.startsWith(val);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                return a.localeCompare(b);
            });
            
            return [...new Set(records)].slice(0, 5);
        } catch (e) {
            return [];
        }
    };

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

                <div className="flex flex-row lg:flex-row gap-4 lg:gap-12 mb-8 items-center justify-between">
                    <div className="flex-1 flex items-center justify-between">
                        <h1 className="text-2xl md:text-3xl font-bold">{t('cart.title')}</h1>
                        <button 
                            onClick={() => setShowClearConfirm(true)}
                            className="hidden lg:flex p-2.5 bg-white border border-gray-100 shadow-sm rounded-full hover:bg-gray-50 transition-all hover:scale-110 active:scale-95 text-gray-500" 
                            title={t('cart.clear_cart_btn')}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>

                    <div className="lg:w-96 flex justify-end">
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
                                isOutOfStockError={outOfStockErrorItems.some(i => String(i.id) === String(item.id) && String(i.size) === String(item.size))}
                            />
                        ))}
                    </div>

                    <div className="w-full lg:w-96 space-y-6">
                        <div className="bg-white p-6 rounded-xl border shadow-xl space-y-6 sticky top-24 relative overflow-hidden">
                            {/* Auth Overlay for Guests */}
                            {isLoaded && !user && (
                                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center bg-white/60 backdrop-blur-md animate-in fade-in duration-300">
                                    <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mb-4 shadow-xl">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                                            <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-black mb-2 text-black">{t('cart.auth_overlay_title')}</h3>
                                    <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                                        {t('cart.auth_overlay_desc')}
                                    </p>
                                    <button 
                                        onClick={() => openSignIn({ mode: 'modal' })}
                                        className="w-full bg-black text-white py-4 rounded-xl font-bold shadow-lg hover:bg-gray-900 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <span>{t('cart.auth_overlay_cta')}</span>
                                    </button>
                                </div>
                            )}

                            <h2 className="text-xl font-bold border-b pb-4">{t('cart.order_summary')}</h2>

                            <div className="flex justify-between text-lg items-center">
                                <span>{t('cart.subtotal')}</span>
                                <div className="flex items-center gap-2">
                                    {(coupon || promoDiscountAmount > 0) && (
                                        <span className="line-through text-gray-400 text-sm">
                                            {t('cart.price_format', { price: subtotal })}
                                        </span>
                                    )}
                                    <span className="font-bold">
                                        {t('cart.price_format', { price: subtotal - discountAmount })}
                                    </span>
                                </div>
                            </div>

                            {promoDiscountAmount > 0 && (
                                <div className="flex justify-between text-blue-600 font-bold bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <span>{t('cart.promo_discount')}</span>
                                    <span className="font-bold">-{promoDiscountAmount} ₪</span>
                                </div>
                            )}

                            {isMainVendor && luckyPrize?.type === 'discount' && !lotteryMode?.active && (
                                <div className="flex justify-between text-green-600 font-bold">
                                    <span>{t('cart.discount', { percent: luckyPrize.value * 100 })}</span>
                                    <span className="font-bold">{Math.round(subtotal * luckyPrize.value)} - ₪</span>
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
                                deliveryMethod={deliveryMethod} 
                                setDeliveryMethod={setDeliveryMethod} 
                            />

                            <FreeSamplesProgress 
                                isMainVendor={isMainVendor} 
                                subtotal={subtotal} 
                                freeSamplesCount={freeSamplesCount} 
                                vendorConfig={vendorConfig} 
                            />

                            {/* Recommendations / Upsell */}
                            {(recommendations.length > 0 || isUpsellLoading) && isMainVendor && nextTier > 0 && (
                                <div className="space-y-3 pt-2">
                                    <h4 className="text-sm font-bold text-gray-700">{t('cart.upsell_title')}</h4>
                                    
                                    {isUpsellLoading && recommendations.length === 0 ? (
                                        <div className="space-y-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={`skel-${i}`} className="flex items-center gap-3 bg-white border p-2 rounded-lg shadow-sm animate-pulse">
                                                    <div className="w-10 h-10 bg-gray-200 rounded flex-shrink-0"></div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                                        <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                                                    </div>
                                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
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
                                    )}
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

                            {/* Delivery Address */}
                            {!isSelfPickup && (
                                <div className="py-2 border-t pt-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-bold text-gray-700 block flex items-center gap-1">
                                            כתובת למשלוח
                                            <span className="text-red-500">*</span>
                                        </label>
                                        {lastAddress && (
                                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-600 hover:text-black transition">
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 rounded text-black focus:ring-black accent-black"
                                                    checked={shipToNewAddress}
                                                    onChange={(e) => {
                                                        const isNew = e.target.checked;
                                                        setShipToNewAddress(isNew);
                                                        if (isNew) {
                                                            setAddress({ street: '', houseNumber: '', apartment: '', city: '' });
                                                        } else {
                                                            setAddress(lastAddress);
                                                        }
                                                    }}
                                                />
                                                משלוח לכתובת חדשה
                                            </label>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <div className="relative z-20">
                                            <AutocompleteInput
                                                disabled={!!lastAddress && !shipToNewAddress}
                                                placeholder="עיר *"
                                                value={address.city}
                                                onChange={(val) => {
                                                    setAddress(prev => ({ ...prev, city: val, street: '' }));
                                                    if (addressError) setAddressError('');
                                                }}
                                                fetchSuggestions={fetchCitySuggestions}
                                            />
                                        </div>
                                        <div className="grid grid-cols-5 gap-3 relative z-10">
                                            <div className="col-span-5 relative">
                                                <AutocompleteInput
                                                    disabled={(!!lastAddress && !shipToNewAddress) || !address.city}
                                                    placeholder={address.city ? "רחוב *" : "יש לבחור עיר תחילה"}
                                                    value={address.street}
                                                    onChange={(val) => {
                                                        setAddress(prev => ({ ...prev, street: val }));
                                                        if (addressError) setAddressError('');
                                                    }}
                                                    fetchSuggestions={fetchStreetSuggestions}
                                                />
                                            </div>
                                            <div className="col-span-2 relative">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    disabled={!!lastAddress && !shipToNewAddress}
                                                    className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-gray-900 outline-none bg-white transition-all disabled:bg-gray-50 disabled:text-gray-500 pl-10"
                                                    placeholder="מס' בית *"
                                                    value={address.houseNumber || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        setAddress(prev => ({ ...prev, houseNumber: val }));
                                                    }}
                                                />
                                                {address.houseNumber && (
                                                    <Check className="w-5 h-5 text-green-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                                )}
                                            </div>
                                            <div className="col-span-3 relative">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    disabled={!!lastAddress && !shipToNewAddress}
                                                    className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-gray-900 outline-none bg-white transition-all disabled:bg-gray-50 disabled:text-gray-500 pl-10"
                                                    placeholder="מס' דירה (0 לבית פרטי) *"
                                                    value={address.apartment || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        setAddress(prev => ({ ...prev, apartment: val }));
                                                    }}
                                                />
                                                {address.apartment && (
                                                    <Check className="w-5 h-5 text-green-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {addressError && <p className="text-red-600 text-xs font-bold mt-1 animate-shake">{addressError}</p>}
                                </div>
                            )}

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
                                        onClick={() => handleCheckout()}
                                        className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-900 transition-all shadow-lg active:scale-95"
                                    >
                                        {t('cart.checkout_btn')}
                                    </button>
                                    <div className="mt-4 text-center">
                                        <p className="text-sm text-gray-600">
                                            צריכים עזרה עם ההזמנה? 
                                        </p>
                                        <div className="flex items-center justify-center gap-1.5 mt-1">
                                            <span className="text-gray-600">אנחנו כאן:</span>
                                            <a href="https://wa.me/972502266071" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-green-600 font-bold hover:underline">
                                                <span dir="ltr">050-2266071</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg> 
                                            </a>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 text-center mt-3">{t('cart.pickup_note')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
            </div>

            {showWheel && <LuckyWheel onWin={handleWin} onClose={() => setShowWheel(false)} />}
        </div>
    );
}
