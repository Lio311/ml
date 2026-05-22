"use client";

import { useWishlist } from '../context/WishlistContext';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

export default function WishlistHeart({ productId }) {
    const { toggleWishlist, isInWishlist, loading } = useWishlist();
    const { t } = useLanguage();
    const inWishlist = isInWishlist(productId);

    // Render immediately, don't wait for loading
    // if (loading) return null;

    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(productId);
            }}
            className={`transition-colors duration-200 ${inWishlist ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}
            title={inWishlist ? t('common.remove_from_wishlist') : t('common.add_to_wishlist')}
        >
            <motion.div
                whileTap={{ scale: 0.8 }}
                animate={{ scale: inWishlist ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 0.3 }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill={inWishlist ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
            </motion.div>
        </button>
    );
}
