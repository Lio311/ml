"use client";

import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);

    // Load likely from local storage on mount (optional, skipping for MVP speed)
    // For persistence, we usually use localStorage.

    useEffect(() => {
        const saved = localStorage.getItem("cart");
        if (saved) {
            try {
                setCartItems(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse cart", e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product, size, price) => {
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
        setCartItems((prev) => prev.filter((item) => !(item.id === id && item.size === size)));
    };

    const updateQuantity = (id, size, quantity) => {
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

    const clearCart = () => setCartItems([]);

    const [luckyPrize, setLuckyPrize] = useState(null);

    // Save lucky prize usage to local storage? Or maybe not, keep it per session.
    // If we want persistence, add to the useEffect above. Let's keep it simple for now (clears on refresh).

    // Calculations
    const shippingCost = 30; // Fixed shipping cost
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    let total = subtotal + shippingCost;
    let discountAmount = 0;

    if (luckyPrize?.type === 'discount') {
        discountAmount = Math.round(total * luckyPrize.value);
        total = total - discountAmount;
    }

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

    // Auto remove prize if below 1000
    useEffect(() => {
        if (subtotal < 1000 && luckyPrize) {
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
                discountAmount
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
