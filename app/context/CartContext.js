"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);

    // Load likely from local storage on mount (optional, skipping for MVP speed)
    // For persistence, we usually use localStorage.

    // Load Cart and Lottery State from Local Storage
    useEffect(() => {
        const savedCart = localStorage.getItem("cart");
        if (savedCart) {
            try {
                setCartItems(JSON.parse(savedCart));
            } catch (e) {
                console.error("Failed to parse cart", e);
            }
        }

        const savedLottery = localStorage.getItem("lotteryMode");
        if (savedLottery) {
            try {
                const parsed = JSON.parse(savedLottery);
                // Check if expired while away
                if (parsed.active && parsed.expiresAt > Date.now()) {
                    setLotteryMode(parsed);
                } else {
                    localStorage.removeItem("lotteryMode");
                }
            } catch (e) {
                console.error("Failed to parse lottery mode", e);
            }
        }
    }, []);

    // Lottery Mode State
    const [lotteryMode, setLotteryMode] = useState({ active: false, expiresAt: null });
    const [lotteryTimeLeft, setLotteryTimeLeft] = useState(null);

    // Persist Lottery Mode
    useEffect(() => {
        if (lotteryMode.active) {
            localStorage.setItem("lotteryMode", JSON.stringify(lotteryMode));
        } else {
            localStorage.removeItem("lotteryMode");
        }
    }, [lotteryMode]);

    // Derived State
    const isCartLocked = lotteryMode.active;

    // Timer Interval
    useEffect(() => {
        let interval;
        if (lotteryMode.active && lotteryMode.expiresAt) {
            interval = setInterval(() => {
                const now = Date.now();
                const diff = lotteryMode.expiresAt - now;

                if (diff <= 0) {
                    // Expired - Clear persistence
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

    // Safety: Auto-unlock if cart is empty (e.g. after checkout or error)
    useEffect(() => {
        if (lotteryMode.active && cartItems.length === 0) {
            setLotteryMode({ active: false, expiresAt: null });
            setLotteryTimeLeft(null);
            localStorage.removeItem("lotteryMode");
        }
    }, [cartItems, lotteryMode.active]);

    const startLottery = (items) => {
        // Clear cart and add lottery items
        const newCart = items.map(p => ({
            ...p,
            quantity: 1,
            isLotteryItem: true
        }));

        setCartItems(newCart);

        // 10 minutes
        const duration = 10 * 60 * 1000;
        setLotteryMode({
            active: true,
            expiresAt: Date.now() + duration
        });
    };

    const cancelLottery = () => {
        setLotteryMode({ active: false, expiresAt: null });
        setLotteryTimeLeft(null);
        setCartItems([]);
    };

    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cartItems));
    }, [cartItems]);

    // Sync Cart to DB for Abandoned Cart Recovery (Logged-in users only)
    const { user } = useUser();
    useEffect(() => {
        if (!user?.primaryEmailAddress?.emailAddress) return;

        // Don't sync empty carts? 
        // Actually empty cart means they cleared it, so we should sync "empty" to stop recovery!
        // But if they just logged out? No, user is null.

        const syncCart = setTimeout(() => {
            fetch('/api/cart/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.primaryEmailAddress.emailAddress,
                    items: cartItems
                })
            }).catch(err => console.error("Cart sync error:", err));
        }, 2000); // Debounce 2s

        return () => clearTimeout(syncCart);
    }, [cartItems, user]);

    const addToCart = (product, size, price) => {
        if (isCartLocked) {
            alert("העגלה נעולה בזמן שהגרלת הבשמים פעילה!");
            return;
        }
        setCartItems((prev) => {
            const existing = prev.find(
                (item) => item.id === product.id && item.size === size
            );
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id && item.size === size
                        ? { ...item, ...product, quantity: item.quantity + 1, size, price } // Merge new product details
                        : item
                );
            }
            return [...prev, { ...product, size, price, quantity: 1 }];
        });
    };

    const addMultipleToCart = (items) => {
        if (isCartLocked) {
            alert("העגלה נעולה בזמן שהגרלת הבשמים פעילה!");
            return;
        }
        setCartItems((prev) => {
            let newCart = [...prev];
            items.forEach(({ product, size, price }) => {
                const existingIndex = newCart.findIndex(
                    (item) => item.id === product.id && item.size === size
                );
                if (existingIndex > -1) {
                    newCart[existingIndex] = {
                        ...newCart[existingIndex],
                        quantity: newCart[existingIndex].quantity + 1
                    };
                } else {
                    newCart.push({ ...product, size, price, quantity: 1 });
                }
            });
            return newCart;
        });
    };



    const removeFromCart = (id, size) => {
        if (isCartLocked) {
            alert("העגלה נעולה בזמן שהגרלת הבשמים פעילה!");
            return;
        }
        setCartItems((prev) => prev.filter((item) => !(item.id === id && item.size === size)));
    };

    const updateQuantity = (id, size, quantity) => {
        if (isCartLocked) {
            alert("העגלה נעולה בזמן שהגרלת הבשמים פעילה!");
            return;
        }
        if (quantity < 1) {
            removeFromCart(id, size);
            return;
        }

        setCartItems((prev) =>
            prev.map((item) => {
                if (item.id === id && item.size === size) {
                    const stock = parseInt(item.stock) || 0;
                    const stockInMl = stock;
                    // Note: Stock is in ml. Quantity is "units" of "size".
                    // Total ml required = quantity * size.
                    // Wait, previous logic in ProductActionsClient checked: currentInCart (ml) + size > stock.
                    // Here, quantity is the number of bottles of 'size'.

                    const totalMlRequested = quantity * size;

                    // We need to check against TOTAL stock, but we might have multiple items of same ID but DIFFERENT sizes?
                    // The simple logic in ProductActionsClient didn't account for other sizes of same product in cart? 
                    // Actually it did: `reduce` over all items.

                    // In the context of `updateQuantity`, checking "global" stock for this product across all sizes is hard inside a simple split map.
                    // However, for the specific bug reported: "In cart, I can add infinite", usually means just pressing + on that item.

                    if (totalMlRequested > stock) {
                        alert(`לא ניתן להוסיף: נותרו ${stock} מ״ל במלאי`);
                        return item; // Do not update
                    }
                    return { ...item, quantity };
                }
                return item;
            })
        );
    };

    const clearCart = () => {
        setCartItems([]);
        // Reset Lottery Mode on successful checkout (or manual clear)
        setLotteryMode({ active: false, expiresAt: null });
        setLotteryTimeLeft(null);
        localStorage.removeItem("lotteryMode");
    };

    const [luckyPrize, setLuckyPrize] = useState(null);

    // Save lucky prize usage to local storage? Or maybe not, keep it per session.
    // If we want persistence, add to the useEffect above. Let's keep it simple for now (clears on refresh).

    const [coupon, setCoupon] = useState(null);

    // Calculations
    // Calculations
    const shippingCost = 30; // Fixed shipping cost
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    let priceAfterDiscounts = subtotal;
    let discountAmount = 0;

    if (lotteryMode.active) {
        // Discount on items only
        const discount = Math.round(priceAfterDiscounts * 0.15);
        discountAmount += discount;
        priceAfterDiscounts -= discount;
    } else if (luckyPrize?.type === 'discount') {
        const discount = Math.round(priceAfterDiscounts * luckyPrize.value);
        discountAmount += discount;
        priceAfterDiscounts -= discount;
    }

    // Apply Coupon (on items only)
    // Apply Coupon (on eligible items only)
    if (coupon) {
        const limits = coupon.limitations || {};

        // 1. Check Min Total
        const cartTotalForMinCheck = subtotal; // Using subtotal before other discounts? Usually strictly subtotal.
        if (limits.min_cart_total && cartTotalForMinCheck < limits.min_cart_total) {
            // If requirement not met, 0 discount.
            // Ideally should warn user, but for now just 0. 
            // The UI might show "Coupon Active" but 0 discount if they drop below.
        } else {
            // 2. Calculate Discount on Eligible Items
            let eligibleSum = 0;

            cartItems.forEach(item => {
                let isEligible = true;

                // Check Limitations
                if (limits.allowed_sizes?.length > 0 && !limits.allowed_sizes.includes(parseInt(item.size))) isEligible = false;
                if (limits.allowed_brands?.length > 0 && !limits.allowed_brands.includes(item.brand)) isEligible = false;
                if (limits.allowed_categories?.length > 0 && !limits.allowed_categories.includes(item.category)) isEligible = false;
                if (limits.allowed_products?.length > 0 && !limits.allowed_products.includes(item.id)) isEligible = false;

                if (isEligible) {
                    eligibleSum += (item.price * item.quantity);
                }
            });

            // Adjust eligible sum if previous discounts (like Lottery/Lucky) are proportional?
            // Currently Lucky Prize applies to 'priceAfterDiscounts' (Global).
            // Complexity: If Lucky Prize reduced the TOTAL by 10%, and Coupon applies to specific items...
            // Standard approach: Apply Coupon to the Item Price, then deduct from Total.
            // HERE: We calculated 'priceAfterDiscounts' which might already be reduced by Lucky Prize.
            // If we calculate coupon off the original item price, we might double dip?
            // User requested: "Simple".
            // Let's assume Coupon applies to the Current Net Price of those items.
            // But we don't track per-item net price easily here.
            // SIMPLIFICATION: Calculate ratio of eligible/total and apply coupon to that portion of 'priceAfterDiscounts'.

            const ratio = subtotal > 0 ? (eligibleSum / subtotal) : 0;
            const eligibleNet = priceAfterDiscounts * ratio;

            const couponDiscount = Math.round(eligibleNet * (coupon.discountPercent / 100));
            discountAmount += couponDiscount;
            priceAfterDiscounts -= couponDiscount;
        }
    }

    let total = priceAfterDiscounts + shippingCost;

    let freeSamplesCount = 0;
    let nextTier = 0;

    if (subtotal >= 1000) {
        freeSamplesCount = 6;
        nextTier = 0; // Max tier
    } else if (subtotal >= 500) {
        freeSamplesCount = 4;
        nextTier = 1000 - subtotal;
    } else if (subtotal >= 300) {
        freeSamplesCount = 2;
        nextTier = 500 - subtotal;
    } else {
        freeSamplesCount = 0;
        nextTier = 300 - subtotal;
    }

    // Auto remove prize if below 1200 (Logic restored)
    useEffect(() => {
        if (subtotal < 1200 && luckyPrize) {
            setLuckyPrize(null);
            // Also remove any prize items from the cart
            setCartItems(prev => prev.filter(item => !item.isPrize));
        }
    }, [subtotal, luckyPrize]);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                addMultipleToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                subtotal,
                freeSamplesCount,
                nextTier,
                shippingCost,
                total,
                luckyPrize,
                setLuckyPrize,
                discountAmount,
                coupon,
                setCoupon,
                // Lottery Exports
                startLottery,
                cancelLottery,
                isCartLocked,
                lotteryTimeLeft,
                lotteryMode
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
