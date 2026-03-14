"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useCart } from "../../context/CartContext";

export default function CatalogClient({ slug }) {
    const [catalog, setCatalog] = useState(null);
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSizes, setSelectedSizes] = useState({});

    const { addToCart, cartItems, totalItemsCount } = useCart();

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

    const handleSizeSelect = (itemId, size, price) => {
        setSelectedSizes(prev => ({
            ...prev,
            [itemId]: { size, price }
        }));
    };

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
                                <Link href={`/catalog/${slug}/product/${item.id}`} className="block h-64 bg-gray-50 flex items-center justify-center overflow-hidden relative">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="text-6xl opacity-10">🛍️</div>
                                    )}
                                </Link>
                                <div className="p-5 flex flex-col flex-grow">
                                    <Link href={`/catalog/${slug}/product/${item.id}`} className="block group/title">
                                        <h3 className="text-xl font-bold mb-1 text-gray-900 leading-tight group-hover/title:text-blue-600 transition-colors">{item.name}</h3>
                                    </Link>
                                    
                                    {/* Size Options or Single Price */}
                                    {item.prices && Object.keys(item.prices).length > 0 ? (
                                        <div className="mb-3">
                                            <div className="text-2xl font-black text-black mb-2">
                                                {selectedSizes[item.id]?.price || Object.values(item.prices)[0]} ₪
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-sm mt-2 font-mono">
                                                {Object.entries(item.prices).map(([size, price], index) => {
                                                    const isSelected = selectedSizes[item.id]?.size === size || (!selectedSizes[item.id] && index === 0);
                                                    return (
                                                        <button
                                                            key={size}
                                                            onClick={() => handleSizeSelect(item.id, size, price)}
                                                            className={`px-3 py-1 rounded border transition-colors ${isSelected ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-black hover:bg-white'}`}
                                                            dir="ltr"
                                                        >
                                                            {size}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-2xl font-black text-black mb-3">{item.price} ₪</div>
                                    )}

                                    {item.description && (
                                        <p className="text-sm text-gray-600 mb-6 line-clamp-3 leading-relaxed flex-grow">
                                            {item.description}
                                        </p>
                                    )}
                                    
                                    <button 
                                        onClick={() => {
                                            const defaultSizeStr = item.prices ? Object.keys(item.prices)[0] : null;
                                            const defaultPrice = item.prices ? Object.values(item.prices)[0] : item.price;
                                            
                                            const sizeStr = selectedSizes[item.id]?.size || defaultSizeStr || '1';
                                            const activePrice = selectedSizes[item.id]?.price || defaultPrice;

                                            // Unique ID logic for cart
                                            const cartItemId = item.prices ? `${item.id}_${sizeStr}` : item.id;
                                            const inCartItem = cartItems.find(i => i.id === cartItemId);

                                            if (inCartItem) {
                                                // Already in cart, do nothing or redirect to cart
                                            } else {
                                                addToCart(
                                                    {
                                                        ...item,
                                                        id: cartItemId, 
                                                        originalId: item.id, 
                                                        size: sizeStr,
                                                        price: activePrice
                                                    },
                                                    sizeStr,
                                                    activePrice,
                                                    catalog.id, // vendorId
                                                    catalog.name // vendorName
                                                );
                                                toast.success("נוסף לסל!");
                                            }
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
