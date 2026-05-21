"use client";

import { useState } from "react";
import { useCart } from "../../../../context/CartContext";
import toast from "react-hot-toast";
import { useLanguage } from "../../../../context/LanguageContext";
import { Check, Plus, X, Bell } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export default function CatalogProductActions({ item, slug }) {
    const { addToCart, cartItems } = useCart();
    const { t, dir } = useLanguage();
    const { user, isSignedIn } = useUser();
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [subscribed, setSubscribed] = useState(false);
    const prices = item.prices || {};
    const [addedSize, setAddedSize] = useState(null);

    const stockMl = Number(item.stock_ml) || 0;
    const isOutOfStock = stockMl <= 0;

    const handleSubscribe = async () => {
        if (!isSignedIn) {
            toast.error(dir === 'rtl' ? 'יש להתחבר כדי להירשם להתראה' : 'Please sign in to subscribe');
            return;
        }

        setIsSubscribing(true);
        try {
            const res = await fetch('/api/stock-notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: item.id })
            });

            if (res.ok) {
                toast.success(dir === 'rtl' ? 'נרשמת בהצלחה! נעדכן אותך כשהמוצר יחזור' : 'Subscribed! We will notify you when back in stock.');
                setSubscribed(true);
            } else {
                const data = await res.json();
                toast.error(data.error || 'שגיאה בהרשמה');
            }
        } catch (error) {
            toast.error('שגיאה בתקשורת');
        } finally {
            setIsSubscribing(false);
        }
    };

    const getDiscountedPrice = (size, originalPrice) => {
        const sizeStr = `${size}`.toLowerCase().includes('ml') ? `${size}`.toLowerCase() : `${size}ml`;
        const hasDiscount = item.discount_percentage > 0 && (item.discount_sizes || []).includes(sizeStr);
        if (!hasDiscount) return originalPrice;
        return Math.round((originalPrice * (1 - item.discount_percentage / 100)) / 5) * 5;
    };

    const handleAddToCart = (size, price) => {
        const discountedPrice = getDiscountedPrice(size, price);
        if (!price) {
            toast.error(t('common.rating_save_error'));
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
                price: discountedPrice,
                stock_ml: stockMl
            },
            size,
            discountedPrice,
            item.catalog_id || slug,
            item.catalog_name || 'ספק חיצוני'
        );
        toast.success(t('common.added_to_cart_toast').replace('{name}', item.fragrance_name).replace('{size}', size));
        setAddedSize(size);
        setTimeout(() => setAddedSize(null), 2000);
    };

    const sizeEntries = Object.entries(prices);
    const hasAnyDiscount = item.discount_percentage > 0;

    if (sizeEntries.length === 0) {
        return <p className="text-gray-400 text-sm">{t('common.no_ratings')}</p>;
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
                            <span>{dir === 'rtl' ? 'עדכנו אותי כשהמוצר חוזר' : 'Notify me when back in stock'}</span>
                            {isSubscribing ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Bell size={18} />
                            )}
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
            {hasAnyDiscount && (
                <div className="bg-red-50 border-s-4 border-red-600 p-3 rounded-r-lg flex items-center justify-between">
                    <div>
                        <span className="block text-[10px] font-black uppercase text-red-600 leading-none mb-1">{t('common.special_offer') || 'מבצע מיוחד'}</span>
                        <span className="text-sm font-bold text-gray-900">{Math.round(item.discount_percentage)}% {t('common.discount') || 'הנחה'}</span>
                    </div>
                    <span className="text-2xl">🔥</span>
                </div>
            )}
            <div className="space-y-3">
                {sizeEntries.map(([size, price]) => {
                    const discountedPrice = getDiscountedPrice(size, price);
                    const hasDiscount = discountedPrice !== price;
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
                            className={`flex items-center justify-between p-3 border rounded-lg bg-white transition cursor-pointer group ${inCart ? 'border-green-300 bg-green-50' : wouldExceed ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60' : hasDiscount ? 'border-red-100 hover:border-red-600' : 'hover:border-black'}`}
                        >
                            <span className="font-bold text-gray-900" dir={dir}>{size.replace(/ml/gi, '').trim()} {t('common.ml_unit')}</span>
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end">
                                    {hasDiscount && (
                                        <span className="text-[10px] text-gray-400 line-through leading-none mb-1">{price} ₪</span>
                                    )}
                                    <span className={`font-bold ${hasDiscount ? 'text-red-600' : 'text-gray-700'}`}>{discountedPrice} ₪</span>
                                </div>
                                <div
                                    className={`w-8 h-8 rounded-full grid place-items-center transition-all ${
                                        inCart ? 'bg-green-500 text-white' :
                                        isAdded ? 'bg-green-500 text-white scale-110' :
                                        wouldExceed ? 'bg-gray-300 text-white' :
                                        hasDiscount ? 'bg-red-600 text-white group-hover:scale-110' :
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
