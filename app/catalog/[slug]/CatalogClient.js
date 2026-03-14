"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useCatalogCart } from "./CatalogCartContext";

export default function CatalogClient({ slug }) {
    const [catalog, setCatalog] = useState(null);
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const { addToCart, cartItems, totalItems } = useCatalogCart();

    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                const res = await fetch(`/api/user-catalogs/public-by-slug/${slug}`);
                if (res.ok) {
                    const data = await res.json();
                    setCatalog(data.catalog);
                    setItems(data.items);
                } else {
                    setError("הקטלוג לא נמצא או שאינו זמין.");
                }
            } catch (err) {
                console.error(err);
                setError("שגיאת תקשורת.");
            } finally {
                setIsLoading(false);
            }
        };

        if (slug) fetchCatalog();
    }, [slug]);

    if (isLoading) {
        return <div className="text-center py-20 text-xl animate-pulse">טוען קטלוג...</div>;
    }

    if (error || !catalog) {
        return (
            <div className="text-center py-20">
                <h1 className="text-2xl font-bold text-red-500 mb-4">אופס!</h1>
                <p className="text-gray-600">{error || "משהו השתבש."}</p>
                <Link href="/" className="mt-8 inline-block px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition">
                    חזרה לעמוד הבית
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header & Cart Link */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 mb-2">{catalog.name}</h1>
                    {catalog.description && (
                        <p className="text-gray-600 max-w-2xl">{catalog.description}</p>
                    )}
                </div>
                <Link href={`/catalog/${slug}/cart`} className="relative group">
                    <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                    </div>
                    {totalItems > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white">
                            {totalItems}
                        </span>
                    )}
                </Link>
            </div>

            {/* Products Grid */}
            {items.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <div className="text-4xl mb-4">🏪</div>
                    <p>לא נמצאו מוצרים בקטלוג זה.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {items.map((item) => {
                        const inCart = cartItems.find(i => i.id === item.id);
                        
                        return (
                            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group relative">
                                <div className="h-64 bg-gray-50 flex items-center justify-center overflow-hidden relative">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="text-6xl opacity-10">🛍️</div>
                                    )}
                                </div>
                                <div className="p-5 flex flex-col flex-grow">
                                    <h3 className="text-xl font-bold mb-1 text-gray-900 leading-tight">{item.name}</h3>
                                    <div className="text-2xl font-black text-black mb-3">{item.price} ₪</div>
                                    {item.description && (
                                        <p className="text-sm text-gray-600 mb-6 line-clamp-3 leading-relaxed flex-grow">
                                            {item.description}
                                        </p>
                                    )}
                                    
                                    <button 
                                        onClick={() => {
                                            addToCart(item);
                                            toast.success("נוסף לסל!");
                                        }}
                                        className="mt-auto w-full py-3 rounded-xl font-bold transition-all border-2 border-black flex items-center justify-center gap-2 group/btn"
                                        style={inCart ? { backgroundColor: 'black', color: 'white' } : { backgroundColor: 'white', color: 'black' }}
                                    >
                                        {inCart ? (
                                            <>
                                                <span>נוסף ({inCart.quantity})</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                                </svg>
                                            </>
                                        ) : (
                                            <>
                                                <span>הוסף לסל</span>
                                                <span className="text-xl leading-none group-hover/btn:scale-125 transition-transform">+</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
