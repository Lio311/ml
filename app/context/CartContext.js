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
            prev.map((item) =>
                item.id === id && item.size === size
                    ? { ...item, quantity }
                    : item
            )
        );
    };

    const clearCart = () => setCartItems([]);

    // Calculations
    const shippingCost = 30; // Fixed shipping cost
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + shippingCost;

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
                total
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
