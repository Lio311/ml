"use client";

import { useState } from "react";
import { useCatalogCart } from "../../CatalogCartContext";
import toast from "react-hot-toast";

export default function CatalogProductActions({ item, slug }) {
    const { addToCart, cartItems } = useCatalogCart();
    const prices = item.prices || {};
    const [addedSize, setAddedSize] = useState(null);

    const handleAddToCart = (size, price) => {
        if (!price) {
            toast.error("מחיר לא מוגדר");
            return;
        }

        const cartItemId = `${item.id}_${size}`;

        addToCart(
            {
                ...item,
                id: cartItemId,
                originalId: item.id,
                size: size,
                price: price
            },
            size,
            price,
            item.catalog_id,
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

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-gray-900 text-lg text-right">בחר גודל והוסף לסל:</h3>
            <div className="space-y-3">
                {sizeEntries.map(([size, price]) => {
                    const cartItemId = `${item.id}_${size}`;
                    const inCart = cartItems.find(i => i.id === cartItemId);
                    const isAdded = addedSize === size;

                    return (
                        <div
                            key={size}
                            onClick={() => !inCart && handleAddToCart(size, price)}
                            className={`flex items-center justify-between p-3 border rounded-lg bg-white transition cursor-pointer group ${inCart ? 'border-green-300 bg-green-50' : 'hover:border-black'}`}
                        >
                            <span className="font-bold text-gray-900" dir="rtl">{size.replace(/ml/gi, '').trim()} מ"ל</span>
                            <div className="flex items-center gap-4">
                                <span className="text-gray-700 font-medium">{price} ₪</span>
                                <button
                                    type="button"
                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                                        inCart ? 'bg-green-500 text-white' :
                                        isAdded ? 'bg-green-500 text-white scale-110' :
                                        'bg-black text-white hover:bg-gray-800 group-hover:scale-110'
                                    }`}
                                >
                                    {inCart || isAdded ? '✓' : '+'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            <p className="text-center text-xs text-gray-400">המחיר כולל מע״מ. משלוח מחושב בקופה.</p>
        </div>
    );
}
