"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function BundlesInventoryClient({ initialBundlesConfig, productsMap }) {
    const [bundlesConfig, setBundlesConfig] = useState(initialBundlesConfig);
    const [suggestions, setSuggestions] = useState({});
    const [loadingSuggestionsFor, setLoadingSuggestionsFor] = useState(null);
    const [updatingFor, setUpdatingFor] = useState(null);

    const handleSuggest = async (productId) => {
        setLoadingSuggestionsFor(productId);
        try {
            const res = await fetch(`/api/admin/bundles-inventory/suggestions?product_id=${productId}`);
            if (res.ok) {
                const data = await res.json();
                setSuggestions(prev => ({ ...prev, [productId]: data.suggestions || [] }));
            } else {
                toast.error("שגיאה בטעינת חלופות");
            }
        } catch (e) {
            toast.error("שגיאה בטעינת חלופות");
        } finally {
            setLoadingSuggestionsFor(null);
        }
    };

    const handleReplace = async (bundleId, oldProductId, newProduct) => {
        setUpdatingFor(oldProductId);
        try {
            const res = await fetch(`/api/admin/bundles-inventory/update`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bundleId, oldProductId, newProductId: newProduct.id }),
            });
            if (res.ok) {
                const data = await res.json();
                setBundlesConfig(data.newConfig);
                toast.success("הבושם הוחלף בהצלחה");
                
                // Add new product to map manually if not present
                if (!productsMap[newProduct.id]) {
                    productsMap[newProduct.id] = newProduct;
                }
                
                // Clear suggestions for the old product
                setSuggestions(prev => {
                    const next = { ...prev };
                    delete next[oldProductId];
                    return next;
                });
            } else {
                toast.error("שגיאה בהחלפת הבושם");
            }
        } catch (e) {
            toast.error("שגיאה בהחלפת הבושם");
        } finally {
            setUpdatingFor(null);
        }
    };

    return (
        <div className="space-y-8" dir="rtl">
            <h1 className="text-2xl font-black mb-6">מלאי חבילות ודיסקברי</h1>
            
            {Object.entries(bundlesConfig).map(([bundleId, bundle]) => (
                <div key={bundleId} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-2">{bundle.name}</h2>
                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                        <span className="bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-wider text-[10px] font-bold">
                            {bundle.type}
                        </span>
                        <span>{bundle.items?.length || 0} בשמים</span>
                    </div>

                    <div className="space-y-4">
                        {bundle.items?.map(productId => {
                            const product = productsMap[productId];
                            if (!product) return null;
                            const isOOS = product.stock <= 0;

                            return (
                                <div key={productId} className={`p-4 rounded-xl border ${isOOS ? 'border-red-200 bg-red-50/30' : 'border-gray-100 bg-gray-50'}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-bold">{product.name || `${product.brand} ${product.model}`}</span>
                                            <span className="text-xs text-gray-500">{product.brand} • {product.categories?.[0] || 'ללא קטגוריה'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {isOOS ? (
                                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold">
                                                    חסר במלאי
                                                </span>
                                            ) : (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">
                                                    במלאי: {product.stock}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {isOOS && (
                                        <div className="mt-4 pt-4 border-t border-red-100">
                                            {!suggestions[productId] && (
                                                <button 
                                                    onClick={() => handleSuggest(productId)}
                                                    disabled={loadingSuggestionsFor === productId}
                                                    className="text-sm bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                                                >
                                                    {loadingSuggestionsFor === productId ? 'טוען חלופות...' : 'הצע חלופות'}
                                                </button>
                                            )}

                                            {suggestions[productId] && (
                                                <div className="space-y-3">
                                                    <h4 className="text-sm font-bold text-gray-700">חלופות מוצעות:</h4>
                                                    {suggestions[productId].length === 0 ? (
                                                        <p className="text-xs text-gray-500">לא נמצאו חלופות מתאימות במלאי.</p>
                                                    ) : (
                                                        <div className="grid gap-2">
                                                            {suggestions[productId].map(sug => (
                                                                <div key={sug.id} className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold text-sm">{sug.name || `${sug.brand} ${sug.model}`}</span>
                                                                        <span className="text-xs text-gray-500">מלאי: {sug.stock}</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleReplace(bundleId, productId, sug)}
                                                                        disabled={updatingFor === productId}
                                                                        className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded font-bold hover:bg-blue-100 transition-colors disabled:opacity-50"
                                                                    >
                                                                        {updatingFor === productId ? 'מעדכן...' : 'החלף לבושם זה'}
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
