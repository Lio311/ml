"use client";
import { useCart } from "../../context/CartContext";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { Check, Plus, Bell } from "lucide-react";

import toast from 'react-hot-toast';

export default function ProductActionsClient({ product }) {
    const { addToCart, cartItems } = useCart();
    const [addedId, setAddedId] = useState(null);
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [subscribed, setSubscribed] = useState(false);
    const { isSignedIn } = useUser();
    const { t, dir, localize } = useLanguage();

    const stock = Number(product.stock) || 0;
    const isOutOfStock = stock <= 0;

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
                body: JSON.stringify({ productId: product.id })
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

    // Track View History
    useEffect(() => {
        if (isSignedIn && product?.id) {
            fetch('/api/history/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: product.id })
            }).catch(err => console.error("Tracking failed", err));
        }
    }, [isSignedIn, product]);

    const isDiscountActive = (size) => {
        if (!product.discount_percentage || product.discount_percentage <= 0) return false;
        if (size && !(product.discount_sizes || []).includes(`${size}ml`)) return false;
        if (product.discount_end_date && new Date(product.discount_end_date) < new Date()) return false;
        return true;
    };

    const getDiscountedPrice = (size, originalPrice) => {
        if (!isDiscountActive(size)) return originalPrice;
        return Math.round((originalPrice * (1 - product.discount_percentage / 100)) / 5) * 5;
    };

    const handleAdd = (size, price) => {
        const discountedPrice = getDiscountedPrice(size, price);
        if (!product) return;
        const stock = Number(product.stock) || 0;

        // Calculate current amount of this product in cart
        const currentInCart = (cartItems || []).reduce((total, item) => {
            // Ensure ID comparison is type-safe (string vs number)
            if (item && String(item.id) === String(product.id)) {
                return total + (Number(item.size || 0) * Number(item.quantity || 0));
            }
            return total;
        }, 0);

        if (currentInCart + size > stock) {
            toast.error(t('common.out_of_stock_toast'));
            return;
        }

        addToCart(product, size, discountedPrice, 'main', 'האתר הרשמי', price);

        const toastKey = product.is_discovery_set ? 'common.added_to_cart_toast_set' : 'common.added_to_cart_toast';
        const displaySize = product.is_discovery_set ? (product.volume_label || (dir === 'rtl' ? 'מארז' : 'Set')) : size;

        toast.success(t(toastKey).replace('{name}', localize(product, 'name')).replace('{size}', displaySize));
        setAddedId(size);
        setTimeout(() => setAddedId(null), 2000);
    };

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
        <div className={`space-y-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
            {product.is_discovery_set ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-white hover:border-black transition cursor-pointer" onClick={() => handleAdd('1', product.single_price)}>
                    <span className="font-bold">{(dir === 'ltr' && product.volume_label_en) ? product.volume_label_en : (product.volume_label || (dir === 'rtl' ? 'יחידה' : 'Unit'))}</span>
                    <div className="flex items-center gap-4">
                        {getDiscountedPrice('1', product.single_price) !== product.single_price ? (
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-gray-400 line-through leading-none">{product.single_price} ₪</span>
                                <span className="font-black text-green-600 leading-none">{getDiscountedPrice('1', product.single_price)} ₪</span>
                            </div>
                        ) : (
                            <span>{product.single_price} ₪</span>
                        )}
                        <div className={`w-8 h-8 rounded-full grid place-items-center transition ${addedId === '1' ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-gray-800'}`}>
                            {addedId === '1' ? <Check size={14} strokeWidth={2.5} /> : <Plus size={14} strokeWidth={2.5} />}
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-white hover:border-black transition cursor-pointer" onClick={() => handleAdd(2, product.price_2ml)}>
                        <span className="font-bold">2 {t('common.ml_unit')}</span>
                        <div className="flex items-center gap-4">
                            {getDiscountedPrice(2, product.price_2ml) !== product.price_2ml ? (
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-gray-400 line-through leading-none">{product.price_2ml} ₪</span>
                                    <span className="font-black text-green-600 leading-none">{getDiscountedPrice(2, product.price_2ml)} ₪</span>
                                </div>
                            ) : (
                                <span>{product.price_2ml} ₪</span>
                            )}
                            <div className={`w-8 h-8 rounded-full grid place-items-center transition ${addedId === 2 ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-gray-800'}`}>
                                {addedId === 2 ? <Check size={14} strokeWidth={2.5} /> : <Plus size={14} strokeWidth={2.5} />}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg bg-white hover:border-black transition cursor-pointer" onClick={() => handleAdd(5, product.price_5ml)}>
                        <span className="font-bold">5 {t('common.ml_unit')}</span>
                        <div className="flex items-center gap-4">
                            {getDiscountedPrice(5, product.price_5ml) !== product.price_5ml ? (
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-gray-400 line-through leading-none">{product.price_5ml} ₪</span>
                                    <span className="font-black text-green-600 leading-none">{getDiscountedPrice(5, product.price_5ml)} ₪</span>
                                </div>
                            ) : (
                                <span>{product.price_5ml} ₪</span>
                            )}
                            <div className={`w-8 h-8 rounded-full grid place-items-center transition ${addedId === 5 ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-gray-800'}`}>
                                {addedId === 5 ? <Check size={14} strokeWidth={2.5} /> : <Plus size={14} strokeWidth={2.5} />}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg bg-white hover:border-black transition cursor-pointer" onClick={() => handleAdd(10, product.price_10ml)}>
                        <span className="font-bold">10 {t('common.ml_unit')}</span>
                        <div className="flex items-center gap-4">
                            {getDiscountedPrice(10, product.price_10ml) !== product.price_10ml ? (
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-gray-400 line-through leading-none">{product.price_10ml} ₪</span>
                                    <span className="font-black text-green-600 leading-none">{getDiscountedPrice(10, product.price_10ml)} ₪</span>
                                </div>
                            ) : (
                                <span>{product.price_10ml} ₪</span>
                            )}
                            <div className={`w-8 h-8 rounded-full grid place-items-center transition ${addedId === 10 ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-gray-800'}`}>
                                {addedId === 10 ? <Check size={14} strokeWidth={2.5} /> : <Plus size={14} strokeWidth={2.5} />}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
