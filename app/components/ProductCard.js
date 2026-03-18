"use client";


import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useState, useEffect } from "react";

import WishlistHeart from "./WishlistHeart";

import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
    const { addToCart, cartItems } = useCart();
    const [added, setAdded] = useState(false);

    useEffect(() => {
        let timer;
        if (added) {
            timer = setTimeout(() => setAdded(false), 2000);
        }
        return () => clearTimeout(timer);
    }, [added]);

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
            toast.error("לא ניתן להוסיף את המוצר, אזל המלאי!");
            return;
        }

        addToCart(product, size, price);
        toast.success(`נוסף לסל: ${product.name} (${size} מ"ל)`);
        setAdded(true);
    };

    const router = useRouter();

    return (
        <div
            className="group border rounded-lg overflow-hidden hover:shadow-xl transition bg-white flex flex-col h-full relative"
            onMouseEnter={() => router.prefetch(`/product/${product.slug || product.id}`)}
        >
            <div className="absolute top-2 left-2 z-10">
                <WishlistHeart productId={product.id} />
            </div>

            {/* New Badge (Last 7 days) */}
            {(function () {
                if (!product.created_at) return false;
                const created = new Date(product.created_at);
                const now = new Date();
                const diffTime = Math.abs(now - created);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
            })() && (
                    <div className="absolute top-10 right-2 z-10 text-[10px] leading-3 font-bold bg-sky-500 text-white px-2 py-1 rounded shadow-sm text-center">
                        חדש
                    </div>
                )}

            {((product.stock || 0) <= 20) && (
                <div className={`absolute top-10 left-2 z-10 text-[10px] leading-3 font-bold px-2 py-1 rounded shadow-sm text-center text-white ${(product.stock || 0) <= 0 ? 'bg-gray-400' : 'bg-red-600'
                    }`}>
                    {(product.stock || 0) <= 0 ? (
                        <>אזל<br />במלאי</>
                    ) : (
                        <>יחידות אחרונות<br />במלאי</>
                    )}
                </div>
            )}

            <Link href={`/product/${product.slug || product.id}`} className="block relative aspect-square bg-white overflow-hidden cursor-pointer p-2">
                {product.image_url ? (
                    <Image
                        src={product.image_url}
                        alt={`דוגמית בושם ${product.name} - ${product.brand}`}
                        width={300}
                        height={300}
                        className="w-full h-full object-contain group-hover:scale-110 transition duration-700"
                        sizes="(max-width: 768px) 50vw, 25vw"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-4xl group-hover:scale-105 transition duration-500">
                        🧴
                    </div>
                )}
            </Link>

            <div className="p-4 flex-1 flex flex-col">
                <div className="text-xs text-gray-500 mb-1 line-clamp-1">{product.category}</div>
                <Link href={`/product/${product.slug || product.id}`}>
                    <h3 className="font-bold text-sm mb-2 line-clamp-2 min-h-[40px] hover:underline">{product.name}</h3>
                </Link>

                <div className="mt-auto space-y-2">
                    {Number(product.price_2ml) > 0 && (
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
                    )}

                    {Number(product.price_5ml) > 0 && (
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
                    )}

                    {Number(product.price_10ml) > 0 && (
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
                    )}

                    <Link href={`/product/${product.slug || product.id}`} className={`block w-full text-center text-xs py-2 mt-3 rounded transition ${added ? 'bg-green-600 text-white' : 'bg-black text-white hover:bg-gray-800'}`}>
                        {added ? 'נוסף לסל!' : 'פרטים נוספים'}
                    </Link>
                </div>
            </div>
        </div>
    );
}
