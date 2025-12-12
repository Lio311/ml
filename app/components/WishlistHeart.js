"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

export default function WishlistHeart({ productId }) {
    const { isSignedIn, user } = useUser();
    const [inWishlist, setInWishlist] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isSignedIn) {
            setLoading(false);
            return;
        }

        // Check status on mount
        fetch('/api/wishlist')
            .then(res => res.json())
            .then(data => {
                if (data.wishlist && data.wishlist.includes(productId)) {
                    setInWishlist(true);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [isSignedIn, productId]);

    const toggleWishlist = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isSignedIn) {
            alert('עליך להתחבר כדי להוסיף למועדפים');
            return;
        }

        const prevState = inWishlist;
        setInWishlist(!prevState); // Optimistic Update

        try {
            const res = await fetch('/api/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId })
            });
            const data = await res.json();
            setInWishlist(data.inWishlist);
        } catch (err) {
            setInWishlist(prevState); // Revert
            alert('שגיאה בעדכון מועדפים');
        }
    };

    if (loading) return null;

    return (
        <button
            onClick={toggleWishlist}
            className={`transition-colors duration-200 ${inWishlist ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}
            title={inWishlist ? "הסר מהמועדפים" : "הוסף למועדפים"}
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill={inWishlist ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
        </button>
    );
}
