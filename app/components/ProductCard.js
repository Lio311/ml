"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { useState } from "react";

import WishlistHeart from "./WishlistHeart";

export default function ProductCard({ product }) {
    const { addToCart, cartItems } = useCart();
    const [added, setAdded] = useState(false);

    // Default to lowest price/size for display if needed, 
    // currently the design showed 3 lines.

    const handleAdd = (size, price) => {
        const stock = product.stock || 0;

        // Calculate current volume of this product in cart
        const currentInCart = (cartItems || []).reduce((total, item) => {
            if (item.id === product.id) {
                return total + (item.size * item.quantity);
            }
            return total;
        }, 0);

        if (currentInCart + size > stock) {
            alert(`לא ניתן להוסיף לסל: נותרו ${stock} מ״ל במלאי (יש לך כבר ${currentInCart} מ״ל בסל)`);
            return;
        }

        addToCart(product, size, price);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    return (
        <div className="group border rounded-lg overflow-hidden hover:shadow-xl transition bg-white flex flex-col h-full relative">
            <div className="absolute top-2 left-2 z-10">
                <WishlistHeart productId={product.id} />
                {(product.stock <= 20) && (
                    <div className="mt-2 text-[10px] font-bold bg-red-600 text-white px-2 py-1 rounded shadow-sm">
                        יחידות אחרונות במלאי
                    </div>
                )}
            </div>

            <Link href={`/product/${product.id}`} className="block relative aspect-square bg-white overflow-hidden cursor-pointer p-2">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-110 transition duration-700"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-4xl group-hover:scale-105 transition duration-500">
                        🧴
                    </div>
                )}
            </Link>

            <div className="p-4 flex-1 flex flex-col">
                <div className="text-xs text-gray-500 mb-1 line-clamp-1">{product.category}</div>
                <Link href={`/product/${product.id}`}>
                    <h3 className="font-bold text-sm mb-2 line-clamp-2 min-h-[40px] hover:underline">{product.name}</h3>
                </Link>

                <div className="mt-auto space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>2 מ״ל</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold">{product.price_2ml} ₪</span>
                            <button
                                onClick={() => handleAdd(2, product.price_2ml)}
                                className="bg-gray-100 hover:bg-black hover:text-white w-6 h-6 rounded flex items-center justify-center transition"
                                title="הוסף לסל"
                            >+</button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>5 מ״ל</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold">{product.price_5ml} ₪</span>
                            <button
                                onClick={() => handleAdd(5, product.price_5ml)}
                                className="bg-gray-100 hover:bg-black hover:text-white w-6 h-6 rounded flex items-center justify-center transition"
                                title="הוסף לסל"
                            >+</button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>10 מ״ל</span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold">{product.price_10ml} ₪</span>
                            <button
                                onClick={() => handleAdd(10, product.price_10ml)}
                                className="bg-gray-100 hover:bg-black hover:text-white w-6 h-6 rounded flex items-center justify-center transition"
                                title="הוסף לסל"
                            >+</button>
                        </div>
                    </div>

                    <Link href={`/product/${product.id}`} className={`block w-full text-center text-xs py-2 mt-3 rounded transition ${added ? 'bg-green-600 text-white' : 'bg-black text-white hover:bg-gray-800'}`}>
                        {added ? 'נוסף לסל! 🛒' : 'פרטים נוספים'}
                    </Link>
                </div>
            </div>
        </div>
    );
}
