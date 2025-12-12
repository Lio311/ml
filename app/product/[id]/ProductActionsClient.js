"use client";
import { useCart } from "../../context/CartContext";
import { useState } from "react";

export default function ProductActionsClient({ product }) {
    const { addToCart } = useCart();
    const [addedId, setAddedId] = useState(null);

    const handleAdd = (size, price) => {
        addToCart(product, size, price);
        setAddedId(size);
        setTimeout(() => setAddedId(null), 2000);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg bg-white hover:border-black transition cursor-pointer" onClick={() => handleAdd(2, product.price_2ml)}>
                <span className="font-bold">2 מ״ל</span>
                <div className="flex items-center gap-4">
                    <span>{product.price_2ml} ₪</span>
                    <button className={`w-8 h-8 rounded-full flex items-center justify-center transition ${addedId === 2 ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-gray-800'}`}>
                        {addedId === 2 ? '✓' : '+'}
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-white hover:border-black transition cursor-pointer" onClick={() => handleAdd(5, product.price_5ml)}>
                <span className="font-bold">5 מ״ל</span>
                <div className="flex items-center gap-4">
                    <span>{product.price_5ml} ₪</span>
                    <button className={`w-8 h-8 rounded-full flex items-center justify-center transition ${addedId === 5 ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-gray-800'}`}>
                        {addedId === 5 ? '✓' : '+'}
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-white hover:border-black transition cursor-pointer" onClick={() => handleAdd(10, product.price_10ml)}>
                <span className="font-bold">10 מ״ל</span>
                <div className="flex items-center gap-4">
                    <span>{product.price_10ml} ₪</span>
                    <button className={`w-8 h-8 rounded-full flex items-center justify-center transition ${addedId === 10 ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-gray-800'}`}>
                        {addedId === 10 ? '✓' : '+'}
                    </button>
                </div>
            </div>
        </div>
    );
}
