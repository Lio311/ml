"use client";

import { useState, useRef, useEffect } from "react";
import Image from "@/app/components/CImage";
import Link from "next/link";
import { useLanguage } from "../../context/LanguageContext";
import { useCart } from "../../context/CartContext";
import { getDiscountedPrice } from "../../lib/productUtils";

export default function CartItem({ item, updateQuantity, removeFromCart, activeVendorId, isOutOfStockError }) {
    const { t, localize, locale } = useLanguage();
    const { getItemFinalPrice, updateItemSize } = useCart();
    const [isEditingSize, setIsEditingSize] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsEditingSize(false);
            }
        }
        if (isEditingSize) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isEditingSize]);

    const handleSizeChange = (newSize) => {
        setIsEditingSize(false);
        if (String(item.size) === String(newSize)) return;
        
        const priceKey = `price_${newSize}ml`;
        const newOriginalPrice = item[priceKey];
        if (!newOriginalPrice || Number(newOriginalPrice) <= 0) return;
        
        const discountedPrice = getDiscountedPrice(item, newSize, newOriginalPrice);
        updateItemSize(item.id, item.size, newSize, discountedPrice, newOriginalPrice, activeVendorId);
    };

    const isBundle = item.type === 'bundle';
    const productUrl = isBundle ? '#' : `/product/${item.slug || item.id}`;
    
    const finalPrice = getItemFinalPrice(item);
    const hasDiscount = (item.originalPrice && item.originalPrice !== item.price) || (finalPrice < item.price);
    const originalPriceToDisplay = item.originalPrice || item.price;
    
    return (
        <div key={`${item.id}-${item.size}`} className={`flex items-center gap-4 border p-4 rounded-xl shadow-sm relative ${isBundle ? 'border-zinc-900 border-2 shadow-md' : ''} ${isOutOfStockError ? 'bg-red-50 border-red-500 animate-pulse' : 'bg-white'}`}>
            {isOutOfStockError && (
                <div className="absolute -top-3 right-4 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-sm animate-bounce">
                    אזל מהמלאי
                </div>
            )}
            {isBundle ? (
                <div className="w-20 h-20 bg-gray-50 grid grid-cols-2 grid-rows-2 gap-0.5 rounded overflow-hidden relative border border-gray-100 flex-shrink-0">
                    {item.items.slice(0, 4).map((p, i) => (
                        <div key={i} className="relative w-full h-full bg-white">
                            <Image src={p.image_url} alt={p.name} fill className="object-contain p-0.5" sizes="40px" />
                        </div>
                    ))}
                </div>
            ) : (
                <Link href={productUrl} className="w-20 h-20 bg-white flex items-center justify-center text-2xl rounded overflow-hidden relative border border-gray-100 flex-shrink-0 hover:opacity-80 transition-opacity">
                    {item.image_url ? (
                        <Image src={item.image_url} alt={item.name} fill className="object-contain" sizes="80px" />
                    ) : (
                        <span>{item.isPrize ? '🎁' : '🧴'}</span>
                    )}
                </Link>
            )}

            <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                <div className="flex flex-col">
                    {isBundle ? (
                        <>
                            <span className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.15em]">{t('bundles.title')}</span>
                            <span className="text-sm md:text-base font-black text-zinc-900">{item.name}</span>
                            <div className="text-[10px] text-zinc-500 mt-1 italic">
                                {item.items.length} {t('common.perfumes')} • {item.size} {t('common.ml_unit')}
                            </div>
                        </>
                    ) : (
                        <Link href={productUrl} className="block group">
                            <h3 className="font-bold text-gray-900 leading-tight whitespace-normal group-hover:text-blue-600 transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{localize(item, 'brand')}</span>
                                    <span className="text-sm md:text-base">{localize(item, 'model') || localize(item, 'name')}</span>
                                </div>
                            </h3>
                        </Link>
                    )}
                </div>
                
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mt-2 gap-3">
                    <div className={`text-sm font-bold flex flex-wrap items-center gap-2`}>
                        {hasDiscount && !item.isPrize ? (
                            <span className="flex items-center gap-2 whitespace-nowrap">
                                <span className="line-through text-gray-400 font-normal">{originalPriceToDisplay} ₪</span>
                                <span className="text-green-600">{finalPrice} ₪</span>
                            </span>
                        ) : (
                            <span className={`whitespace-nowrap ${item.isPrize ? 'text-green-600' : 'text-primary'}`}>{item.price} ₪</span>
                        )}

                        {!item.isPrize && !isBundle && item.size !== 'set' && !item.is_discovery_set && (
                            <div className="relative inline-block" ref={dropdownRef}>
                                <button 
                                    onClick={(e) => { e.preventDefault(); setIsEditingSize(!isEditingSize); }}
                                    className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1"
                                >
                                    {String(item.size).replace(/ml$/i, '')}ml
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3 h-3 transition-transform ${isEditingSize ? 'rotate-180' : ''}`}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>
                                
                                {isEditingSize && (
                                    <div className="absolute top-full mt-2 start-0 bg-white border shadow-xl rounded-xl overflow-hidden z-50 flex flex-col min-w-[120px]">
                                        {['2', '5', '10'].map(sz => {
                                            const price = item[`price_${sz}ml`];
                                            if (!price || Number(price) <= 0) return null;
                                            return (
                                                <button 
                                                    key={sz}
                                                    onClick={(e) => { e.preventDefault(); handleSizeChange(sz); }}
                                                    className={`px-4 py-3 text-sm text-start hover:bg-gray-50 transition-colors flex justify-between items-center ${String(item.size) === sz ? 'font-bold bg-blue-50/50 text-blue-600' : 'text-gray-700'}`}
                                                >
                                                    <span>{sz}ml</span>
                                                    {String(item.size) !== sz && <span className="text-xs text-gray-400 ms-3">{price}₪</span>}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {item.is_discovery_set && (
                            <div className="relative inline-block">
                                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    {item.volume_label || (locale === 'he' ? 'דיסקברי סט' : 'Set')}
                                </span>
                            </div>
                        )}

                        {item.isPrize && <span className="whitespace-nowrap text-sm text-gray-500">{` (${t('cart.prize')})`}</span>}
                        {isBundle && <span className="text-[10px] bg-zinc-900 text-white px-2 py-0.5 rounded-full font-black tracking-tight">{t('bundles.badge_discount')}</span>}
                    </div>

                    <div className="flex items-center gap-3">
                        {!item.isPrize && !isBundle && (
                            <div className="flex items-center gap-3 bg-gray-50 rounded-full px-2 py-1 border border-gray-100">
                                <button onClick={() => updateQuantity(item.id, item.size, item.quantity - 1, activeVendorId)} className="w-6 h-6 flex items-center justify-center rounded-full bg-white hover:bg-gray-200 transition shadow-sm">-</button>
                                <span className="w-4 text-center font-medium text-sm">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, item.size, item.quantity + 1, activeVendorId)} className="w-6 h-6 flex items-center justify-center rounded-full bg-white hover:bg-gray-200 transition shadow-sm">+</button>
                            </div>
                        )}

                        <button onClick={() => removeFromCart(item.id, item.size, activeVendorId)} className="text-red-500 p-2 hover:bg-red-50 rounded-full transition ms-auto lg:ms-0" aria-label="Remove">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
