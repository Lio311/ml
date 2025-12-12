"use client";

import { useState } from "react";
import { useCart } from "../../context/CartContext";

export default function ProductActions({ product }) {
    const { addToCart } = useCart();
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedPrice, setSelectedPrice] = useState(null);
    const [addedMessage, setAddedMessage] = useState(false);

    const handleSelect = (size, price) => {
        setSelectedSize(size);
        setSelectedPrice(price);
    };

    const handleAddToCart = () => {
        if (!selectedSize || !selectedPrice) return;
        addToCart(product, selectedSize, selectedPrice);
        setAddedMessage(true);
        setTimeout(() => setAddedMessage(false), 3000);
    };

    return (
        <div className="space-y-4">
            {/* 2ml */}
            <div
                className={`flex items-center justify-between p-3 border rounded transition cursor-pointer ${selectedSize === 2 ? 'border-black bg-gray-50' : 'hover:border-black'}`}
                onClick={() => handleSelect(2, product.price_2ml)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center">
                        {selectedSize === 2 && <div className="w-3 h-3 bg-black rounded-full" />}
                    </div>
                    <span className="font-bold">2 מ״ל</span>
                </div>
                <span className="font-bold">{product.price_2ml} ₪</span>
            </div>

            {/* 5ml */}
            <div
                className={`flex items-center justify-between p-3 border rounded transition cursor-pointer ${selectedSize === 5 ? 'border-black bg-gray-50' : 'hover:border-black'}`}
                onClick={() => handleSelect(5, product.price_5ml)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center">
                        {selectedSize === 5 && <div className="w-3 h-3 bg-black rounded-full" />}
                    </div>
                    <span className="font-bold">5 מ״ל</span>
                </div>
                <span className="font-bold">{product.price_5ml} ₪</span>
            </div>

            {/* 10ml */}
            <div
                className={`flex items-center justify-between p-3 border rounded transition cursor-pointer ${selectedSize === 10 ? 'border-black bg-gray-50' : 'hover:border-black'}`}
                onClick={() => handleSelect(10, product.price_10ml)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center">
                        {selectedSize === 10 && <div className="w-3 h-3 bg-black rounded-full" />}
                    </div>
                    <span className="font-bold">10 מ״ל</span>
                </div>
                <span className="font-bold">{product.price_10ml} ₪</span>
            </div>

            {addedMessage && (
                <div className="text-center text-green-600 font-bold text-sm animate-pulse mt-2">
                    המוצר נוסף לסל בהצלחה!
                </div>
            )}

            <button
                className={`w-full py-4 mt-6 text-lg font-bold transition duration-200 ${selectedSize ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                onClick={handleAddToCart}
                disabled={!selectedSize}
            >
                {selectedSize ? 'הוסף לסל' : 'בחר גודל'}
            </button>
            {!selectedSize && (
                <p className="text-xs text-center mt-2 text-red-500 font-bold">
                    * יש לבחור גודל כדי להוסיף לסל
                </p>
            )}
        </div>
    );
}
