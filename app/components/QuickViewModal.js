"use client";

import { motion, AnimatePresence } from 'framer-motion';
import Image from "@/app/components/CImage";
import Link from 'next/link';
import { X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import WishlistHeart from './WishlistHeart';

export default function QuickViewModal({ product, isOpen, onClose }) {
    const { t, dir, localize, locale } = useLanguage();
    const { addToCart, cartItems } = useCart();
    const [addedSize, setAddedSize] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    useEffect(() => {
        let timer;
        if (addedSize) {
            timer = setTimeout(() => setAddedSize(null), 3000);
        }
        return () => clearTimeout(timer);
    }, [addedSize]);

    if (!product || !mounted) return null;

    const translateCategory = (cat) => {
        if (!cat || locale === 'he') return cat;
        return cat.split(',').map(part => {
            const trimmed = part.trim();
            const mapped = t(`category_map.${trimmed}`);
            return mapped.startsWith('category_map.') ? trimmed : mapped;
        }).join(', ');
    };

    const getDiscountedPrice = (size, originalPrice) => {
        const hasDiscount = product.discount_percentage > 0 && (product.discount_sizes || []).includes(`${size}ml`);
        if (!hasDiscount) return originalPrice;
        return Math.round((originalPrice * (1 - product.discount_percentage / 100)) / 5) * 5;
    };

    const handleAdd = (size, price) => {
        const discountedPrice = getDiscountedPrice(size, price);
        const stock = product.stock || 0;
        const currentInCart = (cartItems || []).reduce((total, item) => {
            if (item.id === product.id) {
                return total + (item.size * item.quantity);
            }
            return total;
        }, 0);

        if (currentInCart + size > stock) {
            toast.error(t('common.out_of_stock_toast') || 'Out of stock');
            return;
        }

        addToCart(product, size, discountedPrice);
        toast.success(t('common.added_to_cart_toast')?.replace('{name}', localize(product, 'name'))?.replace('{size}', size) || 'Added to cart');
        setAddedSize(size);
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6" dir={dir}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className={`relative w-full max-w-4xl bg-white/85 backdrop-blur-2xl rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[95vh] md:max-h-[90vh] border border-white/20 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 end-4 z-20 p-2 bg-white/90 hover:bg-black hover:text-white rounded-full transition-all shadow-lg backdrop-blur-md"
                        >
                            <X size={20} />
                        </button>

                        <div className="absolute top-4 start-4 z-20">
                            <WishlistHeart productId={product.id} />
                        </div>

                        {/* Image Section */}
                        <div className="w-full md:w-1/2 bg-transparent flex-shrink-0 relative">
                            <div className="aspect-[4/3] md:aspect-auto md:h-full relative overflow-hidden py-6 md:py-10">
                                {product.image_url ? (
                                    <Image
                                        src={product.image_url}
                                        alt={localize(product, 'name')}
                                        fill
                                        className="object-contain p-6 md:p-12 hover:scale-105 transition-transform duration-700"
                                        priority
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-4xl">
                                        🧴
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col overflow-y-auto">
                            <div className="text-xs font-bold tracking-widest text-gray-400 mb-2 uppercase">
                                {translateCategory(localize(product, 'category'))}
                            </div>
                            
                            <div className="mb-2">
                                {locale === 'he' ? (
                                    <div className="flex flex-col">
                                        <span className="text-gray-500 font-medium text-sm md:text-base uppercase tracking-wider mb-1">
                                            {product.brand_he || product.brand}
                                        </span>
                                        <h2 className="text-2xl md:text-3xl font-black text-black">
                                            {product.model_he || product.model}
                                        </h2>
                                    </div>
                                ) : (
                                    <h2 className="text-2xl md:text-3xl font-black">{localize(product, 'name')}</h2>
                                )}
                            </div>

                            {product.description && (
                                <p className="hidden text-gray-600 text-sm mt-4 line-clamp-3 leading-relaxed">
                                    {localize(product, 'description')}
                                </p>
                            )}

                            <div className="mt-8 flex-1 space-y-4">
                                <h3 className="font-bold text-sm uppercase tracking-wider opacity-80">{t('common.select_size') || 'בחר/י גודל'}</h3>
                                
                                <div className="space-y-3">
                                    {[
                                        { size: 2, price: product.price_2ml },
                                        { size: 5, price: product.price_5ml },
                                        { size: 10, price: product.price_10ml }
                                    ].filter(opt => Number(opt.price) > 0).map(option => {
                                        const discountedPrice = getDiscountedPrice(option.size, option.price);
                                        const hasDiscount = discountedPrice !== option.price;

                                        return (
                                            <div key={option.size} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-black transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center font-bold text-lg">
                                                        {option.size}
                                                    </div>
                                                    <span className="text-sm font-medium">{t('common.ml_unit')}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col items-end">
                                                        {hasDiscount && (
                                                            <span className="text-[10px] text-gray-400 line-through leading-none mb-1">{option.price} ₪</span>
                                                        )}
                                                        <span className={`font-bold text-lg leading-none ${hasDiscount ? 'text-green-600' : ''}`}>
                                                            {discountedPrice} ₪
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleAdd(option.size, option.price)}
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                                            addedSize === option.size 
                                                            ? 'bg-green-500 text-white' 
                                                            : 'bg-black text-white hover:bg-gray-800 hover:scale-105'
                                                        }`}
                                                    >
                                                        {addedSize === option.size ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                                            </svg>
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <Link
                                    href={product.slug || product.id ? `/product/${product.slug || product.id}` : '#'}
                                    onClick={onClose}
                                    className="block w-full text-center py-4 text-sm font-bold uppercase tracking-widest text-black hover:bg-gray-50 transition-colors rounded-xl border-2 border-transparent hover:border-black"
                                >
                                    {t('common.view_full_details') || 'לפרטים המלאים'}
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
