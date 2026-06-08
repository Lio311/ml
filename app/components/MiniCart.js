"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import CartItem from "../cart/components/CartItem";
import FreeSamplesProgress from "../cart/components/FreeSamplesProgress";

export default function MiniCart() {
    const { 
        isMiniCartOpen, setIsMiniCartOpen, 
        cartItems, activeVendorId,
        subtotal, total, freeSamplesCount, nextTier,
        updateQuantity, removeFromCart,
        isMainVendor, vendorConfig
    } = useCart();
    const { t, dir } = useLanguage();
    const isRTL = dir === 'rtl';

    const drawerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (drawerRef.current && !drawerRef.current.contains(event.target)) {
                setIsMiniCartOpen(false);
            }
        }
        if (isMiniCartOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isMiniCartOpen, setIsMiniCartOpen]);

    // Lock body scroll
    useEffect(() => {
        if (isMiniCartOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isMiniCartOpen]);

    const activeItems = cartItems.filter(item => (item.vendorId || 'main') === activeVendorId);

    return (
        <>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity duration-300 ${isMiniCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            ></div>

            {/* Drawer */}
            <div 
                ref={drawerRef}
                className={`fixed top-0 bottom-0 ${isRTL ? 'right-0' : 'left-0'} w-[90vw] md:w-[450px] bg-white z-[9999] shadow-2xl transition-transform duration-300 flex flex-col`}
                style={{ transform: isMiniCartOpen ? 'translateX(0)' : `translateX(${isRTL ? '100%' : '-100%'})` }}
                dir={dir}
            >
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                    <h2 className="text-xl font-black">{t('cart.title')}</h2>
                    <button 
                        onClick={() => setIsMiniCartOpen(false)}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        aria-label="Close cart"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                    {activeItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <div className="text-6xl">🛒</div>
                            <h3 className="text-xl font-bold">{t('cart.empty_title')}</h3>
                            <p className="text-gray-500">{t('cart.empty_desc')}</p>
                            <button 
                                onClick={() => setIsMiniCartOpen(false)}
                                className="bg-black text-white px-6 py-3 rounded-full font-bold hover:bg-gray-800 transition-colors"
                            >
                                {t('common.continue_shopping')}
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Free Samples Progress */}
                            <FreeSamplesProgress 
                                isMainVendor={isMainVendor}
                                subtotal={subtotal}
                                freeSamplesCount={freeSamplesCount}
                                nextTier={nextTier}
                                vendorConfig={vendorConfig}
                            />

                            {/* Cart Items */}
                            <div className="flex flex-col gap-3">
                                {activeItems.map((item) => (
                                    <CartItem 
                                        key={`${item.id}-${item.size}`} 
                                        item={item} 
                                        updateQuantity={updateQuantity} 
                                        removeFromCart={removeFromCart} 
                                        activeVendorId={activeVendorId} 
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {activeItems.length > 0 && (
                    <div className="p-4 border-t bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center justify-between mb-4">
                            <span className="font-bold text-gray-500">{t('cart.subtotal')}:</span>
                            <span className="text-xl font-black">{total} ₪</span>
                        </div>
                        <Link 
                            href="/cart"
                            onClick={() => setIsMiniCartOpen(false)}
                            className="w-full bg-black text-white py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 hover:bg-gray-900 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            {t('cart.checkout')}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                        </Link>
                        <button 
                            onClick={() => setIsMiniCartOpen(false)}
                            className="w-full mt-3 text-sm font-bold text-gray-500 hover:text-black transition-colors"
                        >
                            {t('common.continue_shopping')}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
