"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import toast from 'react-hot-toast';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);
    const [activeVendorId, setActiveVendorId] = useState('main');
    const [lotteryMode, setLotteryMode] = useState({ active: false, expiresAt: null });
    const [lotteryTimeLeft, setLotteryTimeLeft] = useState(null);
    const [luckyPrize, setLuckyPrize] = useState(null);
    const [coupon, setCoupon] = useState(null);
    const [vendorConfig, setVendorConfig] = useState(null);
    const [isSelfPickup, setIsSelfPickup] = useState(false);

    const { user } = useUser();

    // 1. Initial Load from LocalStorage
    useEffect(() => {
        const savedCart = localStorage.getItem("cart");
        if (savedCart) {
            try { setCartItems(JSON.parse(savedCart)); } catch (e) { console.error(e); }
        }

        const savedLottery = localStorage.getItem("lotteryMode");
        if (savedLottery) {
            try {
                const parsed = JSON.parse(savedLottery);
                if (parsed.active && parsed.expiresAt > Date.now()) setLotteryMode(parsed);
                else localStorage.removeItem("lotteryMode");
            } catch (e) { console.error(e); }
        }

        const savedActiveVendor = localStorage.getItem("activeVendorId");
        if (savedActiveVendor) setActiveVendorId(savedActiveVendor);

        const savedCoupon = localStorage.getItem("coupon");
        if (savedCoupon) {
            try { setCoupon(JSON.parse(savedCoupon)); } catch (e) { console.error(e); }
        }
    }, []);

    // 2. Persistence
    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cartItems));
    }, [cartItems]);

    useEffect(() => {
        localStorage.setItem("activeVendorId", activeVendorId);
    }, [activeVendorId]);

    useEffect(() => {
        if (lotteryMode.active) localStorage.setItem("lotteryMode", JSON.stringify(lotteryMode));
        else localStorage.removeItem("lotteryMode");
    }, [lotteryMode]);

    useEffect(() => {
        if (coupon) localStorage.setItem("coupon", JSON.stringify(coupon));
        else localStorage.removeItem("coupon");
    }, [coupon]);

    // Derived State
    const isCartLocked = lotteryMode.active;
    const isMainVendor = activeVendorId === 'main';

    // Fetch Custom Vendor Config securely
    useEffect(() => {
        if (!isMainVendor && activeVendorId) {
            // console.log("Fetching config for vendor:", activeVendorId);
            fetch(`/api/user-catalogs/public-by-slug/${activeVendorId}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.catalog) {
                        setVendorConfig(data.catalog);
                    } else {
                        setVendorConfig(null);
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch vendor config:", err);
                    setVendorConfig(null);
                });
        } else {
            setVendorConfig(null);
        }
    }, [activeVendorId, isMainVendor]);

    // Initialize isSelfPickup based on config
    useEffect(() => {
        if (!isMainVendor && vendorConfig) {
            if (vendorConfig.delivery_active && !vendorConfig.self_pickup_active) {
                setIsSelfPickup(false);
            } else if (!vendorConfig.delivery_active && vendorConfig.self_pickup_active) {
                setIsSelfPickup(true);
            }
        } else if (isMainVendor) {
            // Main vendor doesn't really use this shared state for buttons yet, but let's default it
            // Actually, keep it false as default for main
        }
    }, [isMainVendor, vendorConfig]);

    // Timer Interval for Lottery
    useEffect(() => {
        let interval;
        if (lotteryMode.active && lotteryMode.expiresAt) {
            interval = setInterval(() => {
                const now = Date.now();
                const diff = lotteryMode.expiresAt - now;
                if (diff <= 0) {
                    localStorage.removeItem("lotteryMode");
                    setLotteryMode({ active: false, expiresAt: null });
                    setLotteryTimeLeft(null);
                } else {
                    setLotteryTimeLeft(Math.floor(diff / 1000));
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [lotteryMode]);

    // Safety: Auto-unlock if cart is empty
    useEffect(() => {
        if (lotteryMode.active && cartItems.filter(i => i.vendorId === 'main').length === 0) {
            setLotteryMode({ active: false, expiresAt: null });
            setLotteryTimeLeft(null);
            localStorage.removeItem("lotteryMode");
        }
    }, [cartItems, lotteryMode.active]);

    // Sync to Site Server (Abandoned Cart) - Only for 'main' items
    useEffect(() => {
        if (!user?.primaryEmailAddress?.emailAddress) return;
        const syncCart = setTimeout(() => {
            const mainItems = cartItems.filter(i => !i.vendorId || i.vendorId === 'main');
            fetch('/api/cart/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.primaryEmailAddress.emailAddress,
                    items: mainItems
                })
            }).catch(err => console.error(err));
        }, 2000);
        return () => clearTimeout(syncCart);
    }, [cartItems, user]);

    const addToCart = (product, size, price, vendorId = 'main', vendorName = 'האתר הרשמי') => {
        if (isCartLocked && vendorId === 'main') {
            toast.error("העגלה נעולה בזמן שהגרלת הבשמים פעילה!");
            return;
        }
        setCartItems((prev) => {
            const existing = prev.find(
                (item) => item.id === product.id && item.size === size && (item.vendorId || 'main') === vendorId
            );
            if (existing) {
                // Stock check for main vendor
                if (vendorId === 'main') {
                    const stock = parseInt(product.stock) || 0;
                    if (stock > 0 && existing.quantity + 1 > stock) {
                        toast.error("לא ניתן להוסיף יותר — אזל המלאי!");
                        return prev;
                    }
                }
                return prev.map((item) =>
                    item.id === product.id && item.size === size && (item.vendorId || 'main') === vendorId
                        ? { ...item, ...product, quantity: item.quantity + 1, size, price, vendorId, vendorName }
                        : item
                );
            }
            // Stock check for new item
            if (vendorId === 'main') {
                const stock = parseInt(product.stock) || 0;
                if (stock > 0 && 1 > stock) {
                    toast.error("המוצר אזל מהמלאי!");
                    return prev;
                }
            }
            return [...prev, { ...product, size, price, quantity: 1, vendorId, vendorName }];
        });
    };

    const removeFromCart = (id, size, vendorId = 'main') => {
        if (isCartLocked && vendorId === 'main') {
            toast.error("העגלה נעולה בזמן שהגרלת הבשמים פעילה!");
            return;
        }
        setCartItems((prev) => prev.filter((item) => !(item.id === id && item.size === size && (item.vendorId || 'main') === vendorId)));
    };

    const updateQuantity = (id, size, quantity, vendorId = 'main') => {
        if (isCartLocked && vendorId === 'main') {
            toast.error("העגלה נעולה בזמן שהגרלת הבשמים פעילה!");
            return;
        }
        if (quantity < 1) {
            removeFromCart(id, size, vendorId);
            return;
        }

        setCartItems((prev) =>
            prev.map((item) => {
                if (item.id === id && item.size === size && (item.vendorId || 'main') === vendorId) {
                    if (vendorId === 'main') {
                        const stock = parseInt(item.stock) || 0;
                        if (stock > 0 && quantity > stock) {
                            toast.error("לא ניתן להוסיף את המוצר, אזל המלאי!");
                            return item;
                        }
                    }
                    return { ...item, quantity };
                }
                return item;
            })
        );
    };

    const clearActiveVendorCart = () => {
        const remaining = cartItems.filter(item => (item.vendorId || 'main') !== activeVendorId);
        setCartItems(remaining);
        if (activeVendorId === 'main') {
            setLotteryMode({ active: false, expiresAt: null });
            setLotteryTimeLeft(null);
            localStorage.removeItem("lotteryMode");
        }
        if (remaining.length > 0) setActiveVendorId(remaining[0].vendorId || 'main');
        else setActiveVendorId('main');
    };

    const clearCart = () => {
        setCartItems([]);
        setLotteryMode({ active: false, expiresAt: null });
        setLotteryTimeLeft(null);
        localStorage.removeItem("lotteryMode");
        setActiveVendorId('main');
        setCoupon(null);
        setLuckyPrize(null);
    };

    const startLottery = (items) => {
        const newCart = items.map(p => ({ ...p, quantity: 1, isLotteryItem: true, vendorId: 'main' }));
        setCartItems(newCart);
        const duration = 10 * 60 * 1000;
        setLotteryMode({ active: true, expiresAt: Date.now() + duration });
        setActiveVendorId('main');
    };

    const cancelLottery = () => {
        setLotteryMode({ active: false, expiresAt: null });
        setLotteryTimeLeft(null);
        setCartItems([]);
    };

    // Calculations
    const activeItems = cartItems.filter(item => (item.vendorId || 'main') === activeVendorId);
    const subtotal = activeItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    const totalItemsCount = activeItems.reduce((sum, item) => sum + item.quantity, 0);

    let priceAfterDiscounts = subtotal;
    let discountAmount = 0;

    if (isMainVendor) {
        if (lotteryMode.active) {
            const d = Math.round(priceAfterDiscounts * 0.15);
            discountAmount += d;
            priceAfterDiscounts -= d;
        } else if (luckyPrize?.type === 'discount') {
            const d = Math.round(priceAfterDiscounts * luckyPrize.value);
            discountAmount += d;
            priceAfterDiscounts -= d;
        }

        if (coupon) {
            let limits = coupon.limitations || {};
            // Simplified coupon logic for this step, keeping structure
            const ratio = 1; // All main items eligible for this logic
            const couponDiscount = Math.round(priceAfterDiscounts * (coupon.discountPercent / 100));
            discountAmount += couponDiscount;
            priceAfterDiscounts -= couponDiscount;
        }
    }

    const shippingCost = Number(isMainVendor 
        ? (isSelfPickup ? 0 : 30) 
        : (vendorConfig?.delivery_active ? (isSelfPickup ? 0 : (vendorConfig.delivery_price || 0)) : 0)
    );
    const total = Number(priceAfterDiscounts) + shippingCost;

    let freeSamplesCount = 0;
    let nextTier = 0;
    if (isMainVendor) {
        if (subtotal >= 1000) freeSamplesCount = 6;
        else if (subtotal >= 500) { freeSamplesCount = 4; nextTier = 1000 - subtotal; }
        else if (subtotal >= 300) { freeSamplesCount = 2; nextTier = 500 - subtotal; }
        else { nextTier = 300 - subtotal; }
    } else if (vendorConfig && vendorConfig.sample_tiers) {
        let tiers = vendorConfig.sample_tiers;
        if (typeof tiers === 'string') {
            try { tiers = JSON.parse(tiers); } catch (e) { tiers = []; }
        }
        if (Array.isArray(tiers) && tiers.length > 0) {
            // Find applicable tier
            const sortedTiers = [...tiers].sort((a,b) => b.minAmount - a.minAmount);
            const activeTier = sortedTiers.find(t => subtotal >= Number(t.minAmount));
            if (activeTier) freeSamplesCount = Number(activeTier.samplesCount);
            
            // Find next tier limit
            const nextT = [...tiers].sort((a,b) => a.minAmount - b.minAmount).find(t => Number(t.minAmount) > subtotal);
            if (nextT) nextTier = Number(nextT.minAmount) - subtotal;
        }
    }

    return (
        <CartContext.Provider value={{
            cartItems, activeVendorId, setActiveVendorId, activeItems,
             addToCart, removeFromCart, updateQuantity, clearCart, clearActiveVendorCart,
            subtotal, totalItemsCount, freeSamplesCount, nextTier, shippingCost, total,
            luckyPrize, setLuckyPrize, discountAmount, coupon, setCoupon,
            startLottery, cancelLottery, isCartLocked, lotteryTimeLeft, lotteryMode, 
            isMainVendor, vendorConfig, isSelfPickup, setIsSelfPickup
        }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
