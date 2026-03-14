"use client";

import { useState } from "react";
import { useCatalogCart } from "../../CatalogCartContext";
import toast from "react-hot-toast";

export default function CatalogProductActions({ item, slug }) {
    const { addToCart, cartItems } = useCatalogCart();
    const prices = item.prices || {};
    const sizeKeys = Object.keys(prices);
    const [selectedSize, setSelectedSize] = useState(sizeKeys.length > 0 ? sizeKeys[0] : null);

    const activePrice = selectedSize ? prices[selectedSize] : item.price;
    const cartItemId = selectedSize ? `${item.id}_${selectedSize}` : item.id;
    const inCart = cartItems.find(i => i.id === cartItemId);

    const handleAddToCart = () => {
        if (!activePrice) {
            toast.error("מחיר לא מוגדר");
            return;
        }

        addToCart({
            ...item,
            id: cartItemId,
            originalId: item.id,
            size: selectedSize || '1',
            price: activePrice
        });
        toast.success("נוסף לסל!");
    };

    return (
        <div className="space-y-6">
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-gray-900">{activePrice} ₪</span>
                {selectedSize && <span className="text-gray-500 font-medium">ל-{selectedSize}</span>}
            </div>

            {sizeKeys.length > 0 && (
                <div className="space-y-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">בחר גודל:</p>
                    <div className="flex flex-wrap gap-2">
                        {sizeKeys.map((size) => (
                            <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                className={`px-4 py-2 rounded-xl border-2 font-bold transition-all ${selectedSize === size ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-black hover:bg-gray-50'}`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <button
                onClick={handleAddToCart}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-3 ${inCart ? 'bg-gray-100 text-gray-500 cursor-default' : 'bg-black text-white hover:bg-gray-800'}`}
            >
                {inCart ? (
                    <>
                        <span>כבר בסל ({inCart.quantity})</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                    </>
                ) : (
                    <>
                        <span>הוסף לסל הקניות</span>
                        <span className="text-2xl leading-none">+</span>
                    </>
                )}
            </button>
            
            <p className="text-center text-xs text-gray-400">המחיר כולל מע״מ. משלוח מחושב בקופה.</p>
        </div>
    );
}
