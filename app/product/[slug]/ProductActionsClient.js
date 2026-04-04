"use client";
import { useCart } from "../../context/CartContext";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { Check, Plus } from "lucide-react";

import toast from 'react-hot-toast';

export default function ProductActionsClient({ product }) {
    const { addToCart, cartItems } = useCart();
    const [addedId, setAddedId] = useState(null);
    const { isSignedIn } = useUser();
    const { t, dir, localize } = useLanguage();

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

    const getDiscountedPrice = (size, originalPrice) => {
        const hasDiscount = product.discount_percentage > 0 && (product.discount_sizes || []).includes(`${size}ml`);
        if (!hasDiscount) return originalPrice;
        return Math.floor(originalPrice * (1 - product.discount_percentage / 100));
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

        addToCart(product, size, discountedPrice);
        toast.success(t('common.added_to_cart_toast').replace('{name}', localize(product, 'name')).replace('{size}', size));
        setAddedId(size);
        setTimeout(() => setAddedId(null), 2000);
    };

    return (
        <div className={`space-y-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
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

        </div>
    );
}
