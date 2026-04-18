"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import toast from 'react-hot-toast';
import { useLanguage } from "./LanguageContext";

const CartContext = createContext();

export function CartProvider({ children }) {
    const { t } = useLanguage();
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

    // Coupon Expiration (20 minutes)
    useEffect(() => {
        if (!coupon) return;
        
        let addedAt = coupon.addedAt;
        if (!addedAt) {
            addedAt = Date.now();
            setCoupon({ ...coupon, addedAt });
            return;
        }

        const expiresAt = addedAt + (20 * 60 * 1000); // 20 minutes in ms
        const timeRemaining = expiresAt - Date.now();

        if (timeRemaining <= 0) {
            setCoupon(null);
            toast.error("תוקף הקופון בעגלה פג (20 דקות). באפשרותך להזין אותו מחדש.");
            return;
        }

        const timeout = setTimeout(() => {
            setCoupon(null);
            toast.error("תוקף הקופון בעגלה פג (20 דקות). באפשרותך להזין אותו מחדש.");
        }, timeRemaining);

        return () => clearTimeout(timeout);
    }, [coupon]);

    // Re-validate coupon security when user state changes
    useEffect(() => {
        if (!coupon || !coupon.code) return;
        
        const revalidate = async () => {
            try {
                const res = await fetch("/api/coupons/validate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        code: coupon.code,
                        subtotal: activeItems.reduce((sum, i) => sum + (Number(i.price) * i.quantity), 0),
                        items: activeItems,
                        userEmail: user?.primaryEmailAddress?.emailAddress
                    }),
                });
                if (!res.ok) {
                    const data = await res.json();
                    if (data.error === 'הקופון הזה אינו זמין עבור משתמש זה' || res.status === 403) {
                        setCoupon(null);
                        localStorage.removeItem("coupon");
                    }
                }
            } catch (e) {
                console.error("Coupon re-validation failed", e);
            }
        };
        
        revalidate();
    }, [user?.id]);

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

    const hasSyncedRef = useRef(false);

    // Initial Cart Pull Strategy (Sync on Login)
    useEffect(() => {
        if (!user?.primaryEmailAddress?.emailAddress) {
            hasSyncedRef.current = false;
            return;
        }

        if (hasSyncedRef.current || isCartLocked) return;
        
        const email = user.primaryEmailAddress.emailAddress;
        hasSyncedRef.current = true;

        fetch(`/api/cart/sync?email=${encodeURIComponent(email)}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.items && Array.isArray(data.items) && data.items.length > 0) {
                    setCartItems(prev => {
                        let newCart = [...prev];
                        let changed = false;

                        data.items.forEach(serverItem => {
                            const existing = newCart.find(localItem => 
                                localItem.id === serverItem.id && String(localItem.size) === String(serverItem.size) && (localItem.vendorId || 'main') === (serverItem.vendorId || 'main')
                            );
                            if (!existing) {
                                newCart.push(serverItem);
                                changed = true;
                            } else if (serverItem.quantity > existing.quantity) {
                                const index = newCart.findIndex(localItem => 
                                    localItem.id === serverItem.id && String(localItem.size) === String(serverItem.size) && (localItem.vendorId || 'main') === (serverItem.vendorId || 'main')
                                );
                                if (index >= 0) newCart[index].quantity = serverItem.quantity;
                                changed = true;
                            }
                        });

                        if (changed) {
                            setTimeout(() => {
                                toast.success(t('cart.cart_restored'));
                            }, 500);
                            return newCart;
                        }
                        return prev;
                    });
                }
            })
            .catch(err => console.error("Failed to fetch cart:", err));
    }, [user, isCartLocked]);

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

    const addToCart = (product, size, price, vendorId = 'main', vendorName = 'האתר הרשמי', originalPrice = null) => {
        if (isCartLocked && vendorId === 'main') {
            toast.error(t('cart.cart_locked_lottery'));
            return;
        }

        setCartItems((prev) => {
            // helper: parse size that may be '10ml' or 10
            const parseSizeML = (s) => parseFloat(String(s)) || 0;

            // PREVENT STOCK CHECK FOR PRIZES (from Lucky Wheel)
            if (product.isPrize) {
                const existingPrize = prev.find(
                    (item) => item.id === product.id && item.size === size && (item.vendorId || 'main') === vendorId
                );
                if (existingPrize) return prev; // Don't add multiple prizes of same type
                return [...prev, { ...product, size, price, originalPrice, quantity: 1, vendorId, vendorName }];
            }

            // STOCK CHECK (ML-based for catalogs, ML-based for main too)
            if (vendorId !== 'main') {
                if (product.stock_ml !== undefined) {
                    const stockLimit = Number(product.stock_ml) || 0;
                    // Current ML volume for this perfume already in cart
                    const currentVolumeInCart = prev.reduce((sum, item) => {
                        if (item.vendorId === vendorId && (item.originalId === product.originalId || item.id === product.id)) {
                            return sum + (Number(item.quantity) * parseSizeML(item.size));
                        }
                        return sum;
                    }, 0);
                    const addedVolume = parseSizeML(size);
                    if (currentVolumeInCart + addedVolume > stockLimit) {
                        toast.error(t('cart.stock_limit_ml_reached', { limit: stockLimit }));
                        return prev;
                    }
                }
            } else {
                // Main vendor: stock is total ML available for this product
                const stockML = parseFloat(String(product.stock)) || 0;
                // Official site stock check (only if stock is defined)
                if (product.stock !== undefined && product.stock !== null) {
                    const stockVal = Number(product.stock) || 0;
                    if (stockVal > 0) {
                        const currentML = prev.reduce((sum, item) => {
                            if (item.id === product.id && (item.vendorId || 'main') === 'main') {
                                return sum + (Number(item.quantity) * parseSizeML(item.size));
                            }
                            return sum;
                        }, 0);
                        const addedML = parseSizeML(size);
                        if (currentML + addedML > stockVal) {
                            toast.error(t('cart.stock_limit_reached'));
                            return prev;
                        }
                    } else if (stockVal === 0) {
                        toast.error(t('cart.stock_limit_reached'));
                        return prev;
                    }
                }
            }

            const existing = prev.find(
                (item) => item.id === product.id && item.size === size && (item.vendorId || 'main') === vendorId
            );
            
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id && item.size === size && (item.vendorId || 'main') === vendorId
                        ? { ...item, ...product, quantity: item.quantity + 1, size, price, originalPrice, vendorId, vendorName }
                        : item
                );
            }
            return [...prev, { ...product, size, price, originalPrice, quantity: 1, vendorId, vendorName }];
        });

        // Track funnel event: add_to_cart
        try {
            const sid = sessionStorage.getItem('funnel_session_id');
            if (sid) {
                fetch('/api/analytics/funnel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: sid, eventType: 'add_to_cart', metadata: { productId: product.id, size, vendorId } })
                }).catch(() => {});
            }
        } catch(e) {}
    };

    const addMultipleToCart = (itemsToAdd, options = {}) => {
        if (isCartLocked) {
            toast.error(t('cart.cart_locked_lottery'));
            return;
        }

        // We calculate the new state based on current cartItems
        // Then we call setCartItems with the new array
        let currentItems = [...cartItems];
        let skippedCount = 0;
        let addedCount = 0;

        const parseSizeML = (s) => parseFloat(String(s)) || 0;

        itemsToAdd.forEach((item) => {
            const { product, size, price, originalPrice = null, vendorId = 'main', vendorName = 'האתר הרשמי' } = item;
            const addedML = parseSizeML(size) * (item.quantity || 1);

            // STOCK CHECK logic mirroring standard addToCart
            if (vendorId !== 'main') {
                // Vendor stock check
                if (product.stock_ml !== undefined) {
                    const stockLimit = Number(product.stock_ml) || 0;
                    const currentVolumeInCart = currentItems.reduce((sum, cartItem) => {
                        if (cartItem.vendorId === vendorId && (cartItem.originalId === product.originalId || cartItem.id === product.id)) {
                            return sum + (Number(cartItem.quantity) * parseSizeML(cartItem.size));
                        }
                        return sum;
                    }, 0);
                    if (currentVolumeInCart + addedML > stockLimit) {
                        skippedCount++;
                        return;
                    }
                }
            } else {
                // Official site stock check (only if stock is defined)
                if (product.stock !== undefined && product.stock !== null) {
                    const stockVal = Number(product.stock) || 0;
                    if (stockVal > 0) {
                        const currentML = currentItems.reduce((sum, cartItem) => {
                            if (cartItem.id === product.id && (cartItem.vendorId || 'main') === 'main') {
                                return sum + (Number(cartItem.quantity) * parseSizeML(cartItem.size));
                            }
                            return sum;
                        }, 0);
                        if (currentML + addedML > stockVal) {
                            skippedCount++;
                            return;
                        }
                    } else if (stockVal === 0) {
                        skippedCount++;
                        return;
                    }
                }
            }

            const existingIndex = currentItems.findIndex(
                (i) => i.id === product.id && String(i.size) === String(size) && (i.vendorId || 'main') === vendorId
            );

            if (existingIndex >= 0) {
                currentItems[existingIndex] = {
                    ...currentItems[existingIndex],
                    quantity: currentItems[existingIndex].quantity + (item.quantity || 1)
                };
            } else {
                currentItems.push({
                    ...product,
                    size,
                    price,
                    originalPrice,
                    quantity: item.quantity || 1,
                    vendorId,
                    vendorName
                });
            }
            addedCount++;
        });

        // Update state once
        setCartItems(currentItems);

        // Feedback toasts
        if (skippedCount > 0) {
            if (addedCount === 0) {
                toast.error(t(options.errorAllKey || 'cart.shared_cart_all_out_of_stock'));
            } else {
                toast.success(t(options.mixedKey || 'cart.shared_cart_mixed'));
            }
        } else if (addedCount > 0) {
            toast.success(t(options.successKey || 'cart.shared_cart_added'));
        }

        return { addedCount, skippedCount };
    };

    const removeFromCart = (id, size, vendorId = 'main') => {
        if (isCartLocked && vendorId === 'main') {
            toast.error(t('cart.cart_locked_lottery'));
            return;
        }
        setCartItems((prev) => prev.filter((item) => !(item.id === id && item.size === size && (item.vendorId || 'main') === vendorId)));
    };

    const updateQuantity = (id, size, quantity, vendorId = 'main') => {
        if (isCartLocked && vendorId === 'main') {
            toast.error(t('cart.cart_locked_lottery'));
            return;
        }
        if (quantity < 1) {
            removeFromCart(id, size, vendorId);
            return;
        }

        setCartItems((prev) => {
            const itemToUpdate = prev.find(item => item.id === id && item.size === size && (item.vendorId || 'main') === vendorId);
            if (!itemToUpdate) return prev;

            // STOCK CHECK
            const parseSizeML = (s) => parseFloat(String(s)) || 0;

            if (vendorId !== 'main') {
                if (itemToUpdate.stock_ml !== undefined) {
                    const stockLimit = Number(itemToUpdate.stock_ml) || 0;
                    const otherItemsVolume = prev.reduce((sum, item) => {
                        if (item.vendorId === vendorId &&
                            (item.originalId === itemToUpdate.originalId || item.id === itemToUpdate.id) &&
                            !(item.id === id && item.size === size)) {
                            return sum + (Number(item.quantity) * parseSizeML(item.size));
                        }
                        return sum;
                    }, 0);
                    const newVolume = otherItemsVolume + (Number(quantity) * parseSizeML(size));
                    if (newVolume > stockLimit) {
                        toast.error(t('cart.stock_limit_ml_reached', { limit: stockLimit }));
                        return prev;
                    }
                }
            } else {
                const stockML = parseFloat(String(itemToUpdate.stock)) || 0;
                if (stockML === 0) {
                    toast.error(t('cart.stock_limit_reached'));
                    return prev;
                }
                if (stockML > 0) {
                    const newML = Number(quantity) * parseSizeML(size);
                    const otherML = prev.reduce((sum, item) => {
                        if (item.id === id && item.size === size && (item.vendorId || 'main') === vendorId) return sum;
                        if (item.id === itemToUpdate.id && (item.vendorId || 'main') === 'main') {
                            return sum + (Number(item.quantity) * parseSizeML(item.size));
                        }
                        return sum;
                    }, 0);
                    if (otherML + newML > stockML) {
                        toast.error(t('cart.stock_limit_reached'));
                        return prev;
                    }
                }
            }

            return prev.map((item) => {
                if (item.id === id && item.size === size && (item.vendorId || 'main') === vendorId) {
                    return { ...item, quantity };
                }
                return item;
            });
        });
    };

    const clearActiveVendorCart = () => {
        const remaining = cartItems.filter(item => (item.vendorId || 'main') !== activeVendorId);
        setCartItems(remaining);
        if (activeVendorId === 'main') {
            setLotteryMode({ active: false, expiresAt: null });
            setLotteryTimeLeft(null);
            setCoupon(null);
            setLuckyPrize(null);
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
        
        // Immediate server sync if logged in
        if (user?.primaryEmailAddress?.emailAddress) {
            fetch('/api/cart/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.primaryEmailAddress.emailAddress,
                    items: []
                })
            }).catch(err => console.error("Failed to clear server cart:", err));
        }
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
    
    // 6. Lucky Wheel Prize Protection
    // Automatically removes prizes/discounts if main site subtotal falls below threshold after deletion
    const mainSiteSubtotal = cartItems
        .filter(item => (item.vendorId || 'main') === 'main')
        .reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);

    useEffect(() => {
        if (mainSiteSubtotal < 1200 && mainSiteSubtotal > 0) {
            if (luckyPrize) {
                setLuckyPrize(null);
            }
            const hasPrizeItem = cartItems.some(i => i.isPrize && (i.vendorId || 'main') === 'main');
            if (hasPrizeItem) {
                setCartItems(prev => prev.filter(i => !i.isPrize || (i.vendorId || 'main') !== 'main'));
            }
        }
    }, [mainSiteSubtotal, luckyPrize, cartItems]);

    // Calculations
    const activeItems = cartItems.filter(item => (item.vendorId || 'main') === activeVendorId);
    const subtotal = activeItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    const totalItemsCount = activeItems.reduce((sum, item) => sum + item.quantity, 0);
    const globalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const uniqueVendorsCount = new Set(cartItems.map(i => i.vendorId || 'main')).size;

    let priceAfterDiscounts = subtotal;
    let discountAmount = 0;
    let priceAfterGlobalDiscounts = subtotal;

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

        priceAfterGlobalDiscounts = priceAfterDiscounts;

        if (coupon) {
            const limitations = coupon.limitations || {};
            
            // Calculate subtotal of eligible items only
            const eligibleSubtotal = activeItems.reduce((sum, item) => {
                // 1. Prepare IDs and normalized values
                let cleanId = item.id;
                if (typeof cleanId === 'string' && cleanId.includes('-')) cleanId = cleanId.split('-')[0];
                if (typeof cleanId === 'string' && cleanId.includes('_')) cleanId = cleanId.split('_')[0];
                
                const productMatch = !limitations.allowed_products || limitations.allowed_products.length === 0 || 
                    limitations.allowed_products.includes(Number(cleanId)) || 
                    limitations.allowed_products.includes(String(cleanId));

                const sizeMatch = !limitations.allowed_sizes || limitations.allowed_sizes.length === 0 || 
                    limitations.allowed_sizes.includes(Number(item.size));

                const brandMatch = !limitations.allowed_brands || limitations.allowed_brands.length === 0 || 
                    limitations.allowed_brands.includes(item.brand);

                const categoryMatch = !limitations.allowed_categories || limitations.allowed_categories.length === 0 || 
                    limitations.allowed_categories.includes(item.category);

                if (productMatch && sizeMatch && brandMatch && categoryMatch) {
                    return sum + (Number(item.price) * item.quantity);
                }
                return sum;
            }, 0);

            // Important: If there was a previous global discount (lottery/lucky), 
            // the 'value' of these eligible items is also reduced proportionally.
            const ratio = subtotal > 0 ? (priceAfterDiscounts / subtotal) : 1;
            const adjustedEligibleSubtotal = eligibleSubtotal * ratio;

            const dv = coupon.discount_value || coupon.discountPercent || 0;
            const dt = coupon.discount_type || 'percent';
            
            let couponDiscount = 0;
            if (dt === 'percent') {
                couponDiscount = Math.round(adjustedEligibleSubtotal * (dv / 100));
            } else {
                // For fixed discount, we still limit it by the eligible subtotal
                couponDiscount = Math.min(adjustedEligibleSubtotal, dv);
            }
            
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
    const getItemFinalPrice = (item) => {
        if (!isMainVendor || !item) return Number(item?.price || 0);
        
        const basePrice = Number(item.price);
        // Important: use the local priceAfterGlobalDiscounts calculated above
        const ratio = subtotal > 0 ? (priceAfterGlobalDiscounts / subtotal) : 1;
        let discountedPrice = basePrice * ratio;

        if (coupon) {
            const limitations = coupon.limitations || {};
            let cleanId = item.id;
            if (typeof cleanId === 'string' && cleanId.includes('-')) cleanId = cleanId.split('-')[0];
            if (typeof cleanId === 'string' && cleanId.includes('_')) cleanId = cleanId.split('_')[0];
            
            const productMatch = !limitations.allowed_products || limitations.allowed_products.length === 0 || 
                limitations.allowed_products.includes(Number(cleanId)) || 
                limitations.allowed_products.includes(String(cleanId));
            const sizeMatch = !limitations.allowed_sizes || limitations.allowed_sizes.length === 0 || 
                limitations.allowed_sizes.includes(Number(item.size));
            const brandMatch = !limitations.allowed_brands || limitations.allowed_brands.length === 0 || 
                limitations.allowed_brands.includes(item.brand);
            const categoryMatch = !limitations.allowed_categories || limitations.allowed_categories.length === 0 || 
                limitations.allowed_categories.includes(item.category);

            if (productMatch && sizeMatch && brandMatch && categoryMatch) {
                const dv = coupon.discount_value || coupon.discountPercent || 0;
                const dt = coupon.discount_type || 'percent';
                if (dt === 'percent') {
                    discountedPrice *= (1 - dv / 100);
                } else {
                    const eligibleSubtotal = activeItems.reduce((sum, i) => {
                        let cId = i.id;
                        if (typeof cId === 'string' && cId.includes('-')) cId = cId.split('-')[0];
                        if (typeof cId === 'string' && cId.includes('_')) cId = cId.split('_')[0];
                        const pM = !limitations.allowed_products || limitations.allowed_products.includes(Number(cId)) || limitations.allowed_products.includes(String(cId));
                        const sM = !limitations.allowed_sizes || limitations.allowed_sizes.includes(Number(i.size));
                        const bM = !limitations.allowed_brands || limitations.allowed_brands.includes(i.brand);
                        const catM = !limitations.allowed_categories || limitations.allowed_categories.includes(i.category);
                        return (pM && sM && bM && catM) ? sum + (Number(i.price) * i.quantity) : sum;
                    }, 0);
                    
                    if (eligibleSubtotal > 0) {
                        const couponFixRatio = Math.max(0, (eligibleSubtotal * ratio - dv) / (eligibleSubtotal * ratio));
                        discountedPrice *= couponFixRatio;
                    }
                }
            }
        }

        return Math.round(discountedPrice);
    };

    return (
        <CartContext.Provider value={{
            cartItems, activeVendorId, setActiveVendorId, activeItems,
             addToCart, addMultipleToCart, removeFromCart, updateQuantity, clearCart, clearActiveVendorCart,
            subtotal, totalItemsCount, globalItemsCount, uniqueVendorsCount, freeSamplesCount, nextTier, shippingCost, total,
            luckyPrize, setLuckyPrize, discountAmount, coupon, setCoupon,
            startLottery, cancelLottery, isCartLocked, lotteryTimeLeft, lotteryMode, 
            isMainVendor, vendorConfig, isSelfPickup, setIsSelfPickup, getItemFinalPrice
        }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
