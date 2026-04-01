"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import WishlistHeart from "./WishlistHeart";
import QuickViewModal from "./QuickViewModal";
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
    const { addToCart, cartItems } = useCart();
    const [added, setAdded] = useState(false);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    const { t, dir, localize, locale } = useLanguage();
    const router = useRouter();

    const translateCategory = (cat) => {
        if (!cat || locale === 'he') return cat;
        return cat.split(',').map(part => {
            const trimmed = part.trim();
            const mapped = t(`category_map.${trimmed}`);
            // If t() returns the key itself, it means it's not found in the map
            return mapped.startsWith('category_map.') ? trimmed : mapped;
        }).join(', ');
    };

    useEffect(() => {
        let timer;
        if (added) {
            timer = setTimeout(() => setAdded(false), 2000);
        }
        return () => clearTimeout(timer);
    }, [added]);

    const handleAdd = (size, price) => {
        const stock = product.stock || 0;
        const currentInCart = (cartItems || []).reduce((total, item) => {
            if (item.id === product.id) {
                return total + (item.size * item.quantity);
            }
            return total;
        }, 0);

        if (currentInCart + size > stock) {
            toast.error(t('common.out_of_stock_toast'));
            return;
        }

        addToCart(product, size, price);
        toast.success(t('common.added_to_cart_toast').replace('{name}', localize(product, 'name')).replace('{size}', size));
        setAdded(true);
    };

    return (
        <div
            className={`group border rounded-lg overflow-hidden hover:shadow-xl transition bg-white flex flex-col h-full relative ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
            onMouseEnter={() => {
                const identifier = product.slug || product.id;
                if (identifier) router.prefetch(`/product/${identifier}`);
            }}
            dir={dir}
        >
            <div className="absolute top-2 start-2 z-10">
                <WishlistHeart productId={product.id} />
            </div>

            {/* New Badge (Last 7 days) */}
            {(function () {
                if (!product.created_at) return false;
                const created = new Date(product.created_at);
                const now = new Date();
                const diffTime = Math.abs(now - created);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
            })() && (
                    <div className="absolute top-10 end-2 z-10 text-[10px] leading-3 font-bold bg-sky-500 text-white px-2 py-1 rounded shadow-sm text-center">
                        {t('common.new')}
                    </div>
                )}

            {((product.stock || 0) <= 20) && (
                <div className={`absolute top-10 start-2 z-10 text-[10px] leading-3 font-bold px-2 py-1 rounded shadow-sm text-center text-white ${(product.stock || 0) <= 0 ? 'bg-gray-400' : 'bg-red-600'
                    }`}>
                    {(product.stock || 0) <= 0 ? (
                        <span className="whitespace-pre-line">{t('common.out_of_stock').replace(' ', '\n')}</span>
                    ) : (
                        <span className="whitespace-pre-line">{t('common.last_units').replace(' ', '\n')}</span>
                    )}
                </div>
            )}

            <Link 
                href={product.slug || product.id ? `/product/${product.slug || product.id}` : '#'} 
                className={`block relative aspect-square bg-white overflow-hidden p-2 ${!product.slug && !product.id ? 'pointer-events-none' : 'cursor-pointer'}`}
            >
                {product.image_url ? (
                    <Image
                        src={product.image_url}
                        alt={t('common.perfume_sample_alt').replace('{name}', localize(product, 'name')).replace('{brand}', product.brand)}
                        width={300}
                        height={300}
                        className="w-full h-full object-contain group-hover:scale-110 transition duration-700"
                        sizes="(max-width: 768px) 50vw, 25vw"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-4xl group-hover:scale-105 transition duration-500">
                        🧴
                    </div>
                )}
            </Link>

            {/* Quick View Button Overlay */}
            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto mt-4">
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsQuickViewOpen(true);
                    }}
                    className="bg-white/90 backdrop-blur-md text-black shadow-xl hover:bg-black hover:text-white rounded-full px-6 py-3 font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                    <span className="md:inline hidden">{t('common.quick_view') || 'תצוגה מהירה'}</span>
                </button>
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <div className="text-xs text-gray-500 mb-1 line-clamp-1 text-center">{translateCategory(localize(product, 'category'))}</div>
                <Link href={product.slug || product.id ? `/product/${product.slug || product.id}` : '#'}>
                    <h3 className="font-bold text-sm mb-2 line-clamp-2 min-h-[40px] hover:underline flex flex-col items-center text-center">
                        {locale === 'he' ? (
                            <>
                                <span className="text-gray-400 font-medium text-[10px] md:text-xs uppercase tracking-wider mb-0.5">
                                    {product.brand_he || product.brand}
                                </span>
                                <span className="text-black text-sm md:text-base">
                                    {product.model_he || product.model}
                                </span>
                            </>
                        ) : (
                            <span>{localize(product, 'name')}</span>
                        )}
                    </h3>
                </Link>

                <div className="mt-auto space-y-2">
                    {Number(product.price_2ml) > 0 && (
                        <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>2 {t('common.ml_unit')}</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold">{product.price_2ml} ₪</span>
                                <button
                                    onClick={() => handleAdd(2, product.price_2ml)}
                                    className="bg-gray-100 hover:bg-black hover:text-white w-6 h-6 rounded flex items-center justify-center transition"
                                    title={t('common.add_to_cart')}
                                >+</button>
                            </div>
                        </div>
                    )}

                    {Number(product.price_5ml) > 0 && (
                        <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>5 {t('common.ml_unit')}</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold">{product.price_5ml} ₪</span>
                                <button
                                    onClick={() => handleAdd(5, product.price_5ml)}
                                    className="bg-gray-100 hover:bg-black hover:text-white w-6 h-6 rounded flex items-center justify-center transition"
                                    title={t('common.add_to_cart')}
                                >+</button>
                            </div>
                        </div>
                    )}

                    {Number(product.price_10ml) > 0 && (
                        <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>10 {t('common.ml_unit')}</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold">{product.price_10ml} ₪</span>
                                <button
                                    onClick={() => handleAdd(10, product.price_10ml)}
                                    className="bg-gray-100 hover:bg-black hover:text-white w-6 h-6 rounded flex items-center justify-center transition"
                                    title={t('common.add_to_cart')}
                                >+</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <QuickViewModal 
                product={product} 
                isOpen={isQuickViewOpen} 
                onClose={() => setIsQuickViewOpen(false)} 
            />
        </div>
    );
}
