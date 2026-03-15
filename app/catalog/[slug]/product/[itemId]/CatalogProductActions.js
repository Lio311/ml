"use client";

import { useState } from "react";
import { useCart } from "../../../../context/CartContext";
import toast from "react-hot-toast";

export default function CatalogProductActions({ item, slug }) {
    const { addToCart, cartItems } = useCart();
    const prices = item.prices || {};
    const [addedSize, setAddedSize] = useState(null);

    const stockMl = Number(item.stock_ml) || 0;
    const isOutOfStock = stockMl <= 0;

    const handleAddToCart = (size, price) => {
        if (!price) {
            toast.error("מחיר לא מוגדר");
            return;
        }

        if (isOutOfStock) {
            toast.error("המוצר אזל מהמלאי!");
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
        toast.success(`נוסף לסל: ${item.fragrance_name} (${size})`);
        setAddedSize(size);
        setTimeout(() => setAddedSize(null), 2000);
    };

    const sizeEntries = Object.entries(prices);

    if (sizeEntries.length === 0) {
        return <p className="text-gray-400 text-sm">אין מחיר זמין</p>;
    }

    if (isOutOfStock) {
        return (
            <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                    <span className="text-2xl block mb-2">😔</span>
                    <p className="font-bold text-gray-500">המוצר אזל מהמלאי</p>
                    <p className="text-xs text-gray-400 mt-1">נסה שוב מאוחר יותר</p>
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
                            <span className="font-bold text-gray-900" dir="rtl">{size.replace(/ml/gi, '').trim()} מ"ל</span>
                            <div className="flex items-center gap-4">
                                <span className="text-gray-700 font-medium">{price} ₪</span>
                                <button
                                    type="button"
                                    disabled={wouldExceed && !inCart}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                                        inCart ? 'bg-green-500 text-white' :
                                        isAdded ? 'bg-green-500 text-white scale-110' :
                                        wouldExceed ? 'bg-gray-300 text-white' :
                                        'bg-black text-white hover:bg-gray-800 group-hover:scale-110'
                                    }`}
                                >
                                    {inCart || isAdded ? '✓' : wouldExceed ? '✕' : '+'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            {stockMl > 0 && stockMl <= 30 && (
                <p className="text-xs text-center text-rose-500 font-bold">⚠️ נשארו {stockMl} מ"ל בלבד!</p>
            )}
            <p className="text-center text-xs text-gray-400">המחיר כולל מע״מ. משלוח מחושב בקופה.</p>
        </div>
    );
}
