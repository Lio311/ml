"use client";
import { useCart } from "../../context/CartContext";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

export default function ProductActionsClient({ product }) {
    const { addToCart, cartItems } = useCart();
    const [addedId, setAddedId] = useState(null);
    const { isSignedIn } = useUser();

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

    const handleAdd = (size, price) => {
        const stock = parseInt(product.stock) || 0;

        // Calculate current amount of this product in cart
        const currentInCart = (cartItems || []).reduce((total, item) => {
            // Ensure ID comparison is type-safe (string vs number)
            if (String(item.id) === String(product.id)) {
                return total + (item.size * item.quantity);
            }
            return total;
        }, 0);

        if (currentInCart + size > stock) {
            alert(`לא ניתן להוסיף לסל: נותרו ${stock} מ״ל במלאי (יש לך כבר ${currentInCart} מ״ל בסל)`);
            return;
        }

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

            <div className="pt-2 flex justify-center">
                <button
                    onClick={() => {
                        const url = window.location.href;
                        if (navigator.share) {
                            navigator.share({
                                title: product.name,
                                text: `תראו את הבושם הזה ב-ml_tlv: ${product.name}`,
                                url: url
                            }).catch(console.error);
                        } else {
                            navigator.clipboard.writeText(url).then(() => {
                                alert("הקישור הועתק, מוזמנים לשתף!");
                            });
                        }
                    }}
                    className="flex items-center gap-2 text-gray-500 hover:text-black transition text-sm"
                >
                    <div className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M15.75 4.5a3 3 0 1 1 .825 2.066l-8.421 4.679a3.002 3.002 0 0 1 0 1.51l8.421 4.679a3 3 0 1 1-.729 1.31l-8.421-4.678a3 3 0 1 1 0-4.132l8.421-4.679a3 3 0 0 1-.096-.755Z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <span>שיתוף המוצר</span>
                </button>
            </div>
        </div>
    );
}
