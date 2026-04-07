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
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
                    <span className="text-3xl block mb-3">😔</span>
                    <p className="font-bold text-gray-900 text-lg mb-1">{t('common.out_of_stock')}</p>
                    <p className="text-sm text-gray-500 mb-6">{dir === 'rtl' ? 'הבושם הזה אזל זמנית מהמלאי' : 'This fragrance is temporarily out of stock'}</p>
                    
                    {subscribed ? (
                        <div className="bg-green-50 text-green-700 p-3 rounded-xl border border-green-100 flex items-center justify-center gap-2 font-bold text-sm">
                            <Check size={16} />
                            <span>{dir === 'rtl' ? 'עדכון יישלח אליך למייל' : 'We will email you when it returns'}</span>
                        </div>
                    ) : (
                        <button
                            onClick={handleSubscribe}
                            disabled={isSubscribing}
                            className="w-full bg-black text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isSubscribing ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Bell size={18} />
                            )}
                            <span>{dir === 'rtl' ? 'עדכנו אותי כשהמוצר חוזר' : 'Notify me when back in stock'}</span>
                        </button>
                    )}
                    
                    {!isSignedIn && !subscribed && (
                        <p className="text-[10px] text-gray-400 mt-3 font-medium">
                            {dir === 'rtl' ? '* ההרשמה מיועדת ללקוחות רשומים בלבד.' : '* Notification available for registered users only.'}
                        </p>
                    )}
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
                                <div
                                    className={`w-8 h-8 rounded-full grid place-items-center transition-all ${
                                        inCart ? 'bg-green-500 text-white' :
                                        isAdded ? 'bg-green-500 text-white scale-110' :
                                        wouldExceed ? 'bg-gray-300 text-white' :
                                        'bg-black text-white hover:bg-gray-800 group-hover:scale-110'
                                    }`}
                                >
                                    {inCart || isAdded ? <Check size={14} strokeWidth={2.5} /> : wouldExceed ? <X size={14} strokeWidth={2.5} /> : <Plus size={14} strokeWidth={2.5} />}
                                </div>
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
