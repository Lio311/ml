"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
    const { isSignedIn } = useUser();
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initial Fetch
    useEffect(() => {
        if (!isSignedIn) {
            setWishlistItems([]);
            setLoading(false);
            return;
        }

        fetch('/api/wishlist')
            .then(res => res.json())
            .then(data => {
                if (data.wishlist) {
                    setWishlistItems(data.wishlist);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch wishlist", err);
                setLoading(false);
            });
    }, [isSignedIn]);

    const addToWishlist = (productId) => {
        if (!wishlistItems.includes(productId)) {
            setWishlistItems(prev => [...prev, productId]);
        }
    };

    const removeFromWishlist = (productId) => {
        setWishlistItems(prev => prev.filter(id => id !== productId));
    };

    const toggleWishlist = async (productId) => {
        if (!isSignedIn) {
            toast.error('עליך להתחבר כדי להוסיף למועדפים');
            return false;
        }

        // Optimistic Update
        const isCurrentlyIn = wishlistItems.includes(productId);
        if (isCurrentlyIn) {
            removeFromWishlist(productId);
        } else {
            addToWishlist(productId);
        }

        try {
            const res = await fetch('/api/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId })
            });

            if (!res.ok) throw new Error("API Error");

            const data = await res.json();
            // Sync with server truth if needed, but usually optimistic is fine unless error
            return data.inWishlist;

        } catch (err) {
            // Revert on error
            if (isCurrentlyIn) {
                addToWishlist(productId);
            } else {
                removeFromWishlist(productId);
            }
            toast.error('שגיאה בעדכון מועדפים');
            return isCurrentlyIn;
        }
    };

    const isInWishlist = (productId) => wishlistItems.includes(productId);

    return (
        <WishlistContext.Provider
            value={{
                wishlistItems,
                count: wishlistItems.length,
                loading,
                toggleWishlist,
                isInWishlist
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
}

export const useWishlist = () => useContext(WishlistContext);
