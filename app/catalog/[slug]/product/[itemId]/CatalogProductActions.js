"use client";

import { useState } from "react";
import { useCart } from "../../../../context/CartContext";
import toast from "react-hot-toast";
import { useLanguage } from "../../../../context/LanguageContext";
import { Check, Plus, X } from "lucide-react";

export default function CatalogProductActions({ item, slug }) {
    const { addToCart, cartItems } = useCart();
    const { t, dir } = useLanguage();
    const prices = item.prices || {};
    const [addedSize, setAddedSize] = useState(null);

    const stockMl = Number(item.stock_ml) || 0;
    const isOutOfStock = stockMl <= 0;

    const handleAddToCart = (size, price) => {
        if (!price) {
            toast.error(t('common.rating_save_error')); // Or a better key for missing price
            return;
        }

        if (isOutOfStock) {
            toast.error(t('common.out_of_stock_toast'));
            return;
        }

        const cartItemId = `${item.id}_${size}`;

        addToCart(
            {
                ...item,
                id: cartItemId,
                originalId: item.id,
                size: size,
                price: price,
                stock_ml: stockMl
            },
            size,
            price,
            item.catalog_id || slug,
            item.catalog_name || 'ספק חיצוני'
        );
        toast.success(t('common.added_to_cart_toast').replace('{name}', item.fragrance_name).replace('{size}', size));
        setAddedSize(size);
        setTimeout(() => setAddedSize(null), 2000);
    };

    const sizeEntries = Object.entries(prices);

    if (sizeEntries.length === 0) {
        return <p className="text-gray-400 text-sm">{t('common.no_ratings')}</p>; // Or "No price available"
    }

    if (isOutOfStock) {
        return (
            <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                    <span className="text-2xl block mb-2">😔</span>
                    <p className="font-bold text-gray-500">{t('common.out_of_stock')}</p>
                    <p className="text-xs text-gray-400 mt-1">{t('common.no_products_found')}</p> 
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {sizeEntries.map(([size, price]) => {
                    const cartItemId = `${item.id}_${size}`;
                    const inCart = cartItems.find(i => i.id === cartItemId);
                    const isAdded = addedSize === size;

                    // Check if adding this size would exceed stock
                    const currentVolume = cartItems.reduce((sum, ci) => {
                        if (ci.originalId === item.id || ci.id.startsWith(`${item.id}_`)) {
                            return sum + (Number(ci.quantity) * Number(ci.size));
                        }
                        return sum;
                    }, 0);
                    const wouldExceed = currentVolume + Number(size) > stockMl;

                    return (
                        <div
                            key={size}
                            onClick={() => !inCart && !wouldExceed && handleAddToCart(size, price)}
                            className={`flex items-center justify-between p-3 border rounded-lg bg-white transition cursor-pointer group ${inCart ? 'border-green-300 bg-green-50' : wouldExceed ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60' : 'hover:border-black'}`}
                        >
                            <span className="font-bold text-gray-900" dir={dir}>{size.replace(/ml/gi, '').trim()} {t('common.ml_unit')}</span>
                            <div className="flex items-center gap-4">
                                <span className="text-gray-700 font-medium">{price} ₪</span>
                                <button
                                    type="button"
                                    disabled={wouldExceed && !inCart}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center p-0 leading-none transition-all ${
                                        inCart ? 'bg-green-500 text-white' :
                                        isAdded ? 'bg-green-500 text-white scale-110' :
                                        wouldExceed ? 'bg-gray-300 text-white' :
                                        'bg-black text-white hover:bg-gray-800 group-hover:scale-110'
                                    }`}
                                >
                                    {inCart || isAdded ? <Check size={20} strokeWidth={3} className="shrink-0" /> : wouldExceed ? <X size={20} strokeWidth={3} className="shrink-0" /> : <Plus size={20} strokeWidth={3} className="shrink-0" />}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            {stockMl > 0 && stockMl <= 30 && (
                <p className="text-xs text-center text-rose-500 font-bold">⚠️ {t('common.limited_stock')}: {stockMl} {t('common.ml_unit')}!</p>
            )}
            <p className="text-center text-xs text-gray-400">{t('common.shipping_returns')}</p>
        </div>
    );
}
