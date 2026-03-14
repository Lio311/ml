"use client";

import { createContext, useContext, useState, useEffect } from "react";

const CatalogCartContext = createContext();

export function CatalogCartProvider({ children, catalogSlug }) {
    const [cartItems, setCartItems] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Initialize from localStorage unique to this catalog
    useEffect(() => {
        if (!catalogSlug) return;
        const saved = localStorage.getItem(`ml_cat_cart_${catalogSlug}`);
        if (saved) {
            try {
                setCartItems(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load catalog cart", e);
            }
        }
        setIsLoaded(true);
    }, [catalogSlug]);

    // Save to localStorage
    useEffect(() => {
        if (isLoaded && catalogSlug) {
            localStorage.setItem(`ml_cat_cart_${catalogSlug}`, JSON.stringify(cartItems));
        }
    }, [cartItems, isLoaded, catalogSlug]);

    const addToCart = (product, quantity = 1) => {
        setCartItems((prev) => {
            const existing = prev.find((i) => i.id === product.id);
            if (existing) {
                return prev.map((i) =>
                    i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
                );
            }
            return [...prev, { ...product, quantity }];
        });
    };

    const removeFromCart = (id) => {
        setCartItems((prev) => prev.filter((i) => i.id !== id));
    };

    const updateQuantity = (id, quantity) => {
        if (quantity < 1) return;
        setCartItems((prev) =>
            prev.map((i) => (i.id === id ? { ...i, quantity } : i))
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <CatalogCartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                subtotal,
                totalItems,
                catalogSlug
            }}
        >
            {children}
        </CatalogCartContext.Provider>
    );
}

export function useCatalogCart() {
    return useContext(CatalogCartContext);
}
