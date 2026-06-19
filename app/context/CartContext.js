"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import toast from 'react-hot-toast';
import { usePathname } from 'next/navigation';
import { useLanguage } from "./LanguageContext";
import { getDiscountedPrice, isDiscountActive } from "../lib/productUtils";
import { useLotteryState } from "../hooks/useLotteryState";
import { useCoupons } from "../hooks/useCoupons";

const CartContext = createContext();

export function CartProvider({ children }) {
    const { t } = useLanguage();
    const [cartItems, setCartItems] = useState([]);
    const [activeVendorId, setActiveVendorId] = useState('main');
    const [vendorConfig, setVendorConfig] = useState(null);
    const [isSelfPickup, setIsSelfPickup] = useState(false);
    const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);

    const { user } = useUser();
    const pathname = usePathname();

    const { 
        lotteryMode, setLotteryMode, 
        lotteryTimeLeft, setLotteryTimeLeft, 
        luckyPrize, setLuckyPrize, 
        isCartLocked, 
        startLottery: hookStartLottery, 
        cancelLottery: hookCancelLottery, 
        clearLottery 
    } = useLotteryState(cartItems);

    const { coupon, setCoupon, clearCoupon } = useCoupons(cartItems, activeVendorId, user);

    // 1. Initial Load from LocalStorage
    useEffect(() => {
        const savedCart = localStorage.getItem("cart");
        if (savedCart) {
            try { setCartItems(JSON.parse(savedCart)); } catch (e) { console.error(e); }
        }

        const savedActiveVendor = localStorage.getItem("activeVendorId");
        if (savedActiveVendor) setActiveVendorId(savedActiveVendor);
    }, []);

    // 2. Persistence
    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cartItems));
    }, [cartItems]);

    useEffect(() => {
        localStorage.setItem("activeVendorId", activeVendorId);
    }, [activeVendorId]);
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

    // Lottery timers and safety moved to useLotteryState hook

    const hasSyncedRef = useRef(false);

    // Initial Cart Pull Strategy (Sync on Login)
    useEffect(() => {
        if (!user?.primaryEmailAddress?.emailAddress) {
            hasSyncedRef.current = false;
            return;
        }

        if (hasSyncedRef.current || isCartLocked) return;
        
        const email = user.primaryEmailAddress.emailAddress;

        fetch(`/api/cart/sync?email=${encodeURIComponent(email)}`)
            .then(res => res.json())
            .then(data => {
                const isUnsynced = localStorage.getItem("cartUnsynced") === "true";
                
                if (data && data.items && Array.isArray(data.items)) {
                    if (isUnsynced) {
                        // Merge local and server carts
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
                                if (!pathname?.startsWith('/admin')) {
                                    setTimeout(() => {
                                        toast.success(t('cart.cart_restored'));
                                    }, 500);
                                }
                                return newCart;
                            }
                            return prev;
                        });
                    } else {
                        // Not unsynced (stale local cart) -> Overwrite with server truth
                        setCartItems(data.items);
                        if (data.items.length > 0 && !pathname?.startsWith('/admin')) {
                            setTimeout(() => {
                                toast.success(t('cart.cart_restored'));
                            }, 500);
                        }
                    }
                }
                hasSyncedRef.current = true;
            })
            .catch(err => {
                console.error("Failed to fetch cart:", err);
                hasSyncedRef.current = true;
            });
    }, [user, isCartLocked, pathname, t]);

    // Sync to Site Server (Abandoned Cart) - Only for 'main' items
    useEffect(() => {
        if (!user?.primaryEmailAddress?.emailAddress) return;
        if (!hasSyncedRef.current) return; // Prevent uploading zombie cart before GET finishes
        
        const syncCart = setTimeout(() => {
            const mainItems = cartItems.filter(i => !i.vendorId || i.vendorId === 'main');
            fetch('/api/cart/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.primaryEmailAddress.emailAddress,
                    items: mainItems
                })
            }).then(() => {
                localStorage.removeItem("cartUnsynced");
            }).catch(err => console.error(err));
        }, 2000);
        return () => clearTimeout(syncCart);
    }, [cartItems, user]);

    const markCartUnsynced = () => {
        localStorage.setItem("cartUnsynced", "true");
    };

    const addToCart = (product, size, price, vendorId = 'main', vendorName = 'האתר הרשמי', originalPrice = null) => {
        markCartUnsynced();
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

        if (pathname !== '/cart') setIsMiniCartOpen(true);

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
        markCartUnsynced();
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
                if (pathname !== '/cart') setIsMiniCartOpen(true);
            }
        } else if (addedCount > 0) {
            if (pathname !== '/cart') setIsMiniCartOpen(true);
        }

        return { addedCount, skippedCount };
    };

    const addBundleToCart = (bundle) => {
        markCartUnsynced();
        if (isCartLocked) {
            toast.error(t('cart.cart_locked_lottery'));
            return;
        }

        // Calculate bundle price
        let bundlePrice = 0;
        const sizeKey = `price_${bundle.size}ml`;
        
        bundle.items.forEach(item => {
            const originalPrice = Number(item[sizeKey] || 0);
            // Apply individual item discount if active
            const itemFinalPrice = getDiscountedPrice(item, bundle.size, originalPrice);
            bundlePrice += itemFinalPrice;
        });

        // Apply 10% bundle discount on top of (potentially discounted) items
        const discountedPrice = Math.round(bundlePrice * 0.9);

        const bundleToAdd = {
            ...bundle,
            price: discountedPrice,
            originalPrice: bundlePrice,
            vendorId: 'main',
            vendorName: 'האתר הרשמי'
        };

        setCartItems(prev => [...prev, bundleToAdd]);
        if (pathname !== '/cart') setIsMiniCartOpen(true);
        
        // Track analytics
        try {
            const sid = sessionStorage.getItem('funnel_session_id');
            if (sid) {
                fetch('/api/analytics/funnel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: sid, eventType: 'add_to_cart', metadata: { type: 'bundle', bundleType: bundle.bundleType, size: bundle.size } })
                }).catch(() => {});
            }
        } catch(e) {}
    };

    const removeFromCart = (id, size, vendorId = 'main') => {
        markCartUnsynced();
        if (isCartLocked && vendorId === 'main') {
            toast.error(t('cart.cart_locked_lottery'));
            return;
        }
        setCartItems((prev) => prev.filter((item) => !(item.id === id && item.size === size && (item.vendorId || 'main') === vendorId)));
    };

    const updateQuantity = (id, size, quantity, vendorId = 'main') => {
        markCartUnsynced();
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
        markCartUnsynced();
        const remaining = cartItems.filter(item => (item.vendorId || 'main') !== activeVendorId);
        setCartItems(remaining);
        if (activeVendorId === 'main') {
            clearLottery();
            clearCoupon();
        }
        if (remaining.length > 0) setActiveVendorId(remaining[0].vendorId || 'main');
        else setActiveVendorId('main');
    };

    const clearCart = () => {
        markCartUnsynced();
        setCartItems([]);
        clearLottery();
        setActiveVendorId('main');
        clearCoupon();
        
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

    const startLottery = (items) => hookStartLottery(items, setCartItems, setActiveVendorId);
    const cancelLottery = () => hookCancelLottery(setCartItems);
    
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
    }, [mainSiteSubtotal, luckyPrize, cartItems, setLuckyPrize]);

    // Calculations
    const activeItems = cartItems.filter(item => (item.vendorId || 'main') === activeVendorId);
    const subtotal = activeItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    const totalItemsCount = activeItems.reduce((sum, item) => sum + item.quantity, 0);
    const globalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const uniqueVendorsCount = new Set(cartItems.map(i => i.vendorId || 'main')).size;

    let priceAfterDiscounts = subtotal;
    let discountAmount = 0;
    let promoDiscountAmount = 0;
    let priceAfterGlobalDiscounts = subtotal;

    if (isMainVendor) {
        // Limited Time Promo Logic
        const now = new Date();
        const dayOfWeek = now.getDay();
        const currentHour = now.getHours();
        const isActivePromo = (dayOfWeek === 4) || (dayOfWeek === 5 && currentHour < 18);
        
        if (isActivePromo) {
            const discoverySets = [];
            const officialSamples = [];
            
            activeItems.forEach(item => {
                if (item.is_discovery_set) {
                    for(let i = 0; i < item.quantity; i++) {
                        if (item.discovery_type === 'official_sample') officialSamples.push(Number(item.price));
                        else discoverySets.push(Number(item.price));
                    }
                }
            });
            
            // 3+1 logic for discovery sets: 1 free for every 4 items
            discoverySets.sort((a,b) => a - b);
            const freeDiscoveryCount = Math.floor(discoverySets.length / 4);
            for(let i = 0; i < freeDiscoveryCount; i++) {
                promoDiscountAmount += discoverySets[i];
            }
            
            // 8+2 logic for official samples: 2 free for every 10 items
            officialSamples.sort((a,b) => a - b);
            const freeSampleCount = Math.floor(officialSamples.length / 10) * 2;
            for(let i = 0; i < freeSampleCount; i++) {
                promoDiscountAmount += officialSamples[i];
            }
        }

        discountAmount += promoDiscountAmount;
        priceAfterDiscounts -= promoDiscountAmount;

        priceAfterGlobalDiscounts = priceAfterDiscounts;
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
                // IMPORTANT: Coupons do NOT apply to Bundles
                if (item.type === 'bundle') return sum;

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
        
        // Bundles have their price already calculated and discounted in addBundleToCart
        // and we don't apply further coupons to them.
        if (item.type === 'bundle') return Number(item.price);

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

    const updateItemSize = (id, oldSize, newSize, newPrice, newOriginalPrice, vendorId = 'main') => {
        markCartUnsynced();
        if (isCartLocked && vendorId === 'main') {
            toast.error(t('cart.cart_locked_lottery'));
            return;
        }
        
        setCartItems(prev => {
            const parseSizeML = (s) => parseFloat(String(s)) || 0;
            const itemToUpdate = prev.find(i => i.id === id && i.size === oldSize && (i.vendorId || 'main') === vendorId);
            if (!itemToUpdate) return prev;

            // Optional: Stock check for new size could go here, but omitted for simplicity assuming sufficient stock 
            // since we're just shifting MLs, often not exceeding total stock if they just change size.
            // (If strict stock check is needed, you'd calculate current ML vs total stock ML here)

            const existingWithNewSize = prev.find(i => i.id === id && i.size === newSize && (i.vendorId || 'main') === vendorId);
            if (existingWithNewSize) {
                // Merge
                return prev.map(i => {
                    if (i.id === id && i.size === newSize && (i.vendorId || 'main') === vendorId) {
                        return { ...i, quantity: i.quantity + itemToUpdate.quantity };
                    }
                    return i;
                }).filter(i => !(i.id === id && i.size === oldSize && (i.vendorId || 'main') === vendorId));
            } else {
                // Update in place
                return prev.map(i => {
                    if (i.id === id && i.size === oldSize && (i.vendorId || 'main') === vendorId) {
                        return { ...i, size: newSize, price: newPrice, originalPrice: newOriginalPrice };
                    }
                    return i;
                });
            }
        });
    };

    return (
        <CartContext.Provider value={{
            cartItems, activeVendorId, setActiveVendorId, activeItems,
             addToCart, addMultipleToCart, addBundleToCart, removeFromCart, updateQuantity, updateItemSize, clearCart, clearActiveVendorCart,
            subtotal, totalItemsCount, globalItemsCount, uniqueVendorsCount, freeSamplesCount, nextTier, shippingCost, total,
            luckyPrize, setLuckyPrize, discountAmount, promoDiscountAmount, coupon, setCoupon,
            startLottery, cancelLottery, isCartLocked, lotteryTimeLeft, lotteryMode, 
            isMainVendor, vendorConfig, isSelfPickup, setIsSelfPickup, getItemFinalPrice,
            isMiniCartOpen, setIsMiniCartOpen
        }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
