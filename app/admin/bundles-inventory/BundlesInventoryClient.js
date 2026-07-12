"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function BundlesInventoryClient({ initialBundlesConfig, productsMap }) {
    const [bundlesConfig, setBundlesConfig] = useState(initialBundlesConfig);
    const [suggestions, setSuggestions] = useState({});
    const [loadingSuggestionsFor, setLoadingSuggestionsFor] = useState(null);
    const [updatingFor, setUpdatingFor] = useState(null);

    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [editingProductData, setEditingProductData] = useState(null); // { bundleId, oldProductId }
    
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Debounced search for modal
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                setIsSearching(true);
                try {
                    const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(searchQuery)}&source=admin`);
                    const data = await res.json();
                    setSearchResults(data.results || []);
                } catch (e) {
                    console.error("Search error", e);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

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
                
                // Clear suggestions & modal
                setSuggestions(prev => {
                    const next = { ...prev };
                    delete next[oldProductId];
                    return next;
                });
                setIsSearchModalOpen(false);
                setSearchQuery("");
                setEditingProductData(null);
            } else {
                toast.error("שגיאה בהחלפת הבושם");
            }
        } catch (e) {
            toast.error("שגיאה בהחלפת הבושם");
        } finally {
            setUpdatingFor(null);
        }
    };

    const openEditModal = (bundleId, productId) => {
        setEditingProductData({ bundleId, oldProductId: productId });
        setSearchQuery("");
        setSearchResults([]);
        setIsSearchModalOpen(true);
    };

    return (
        <div className="space-y-8 relative" dir="rtl">
            <h1 className="text-2xl font-black mb-6">מלאי חבילות ודיסקברי</h1>
            
            {Object.entries(bundlesConfig).map(([bundleId, bundle]) => {
                const typeToHebrew = {
                    'clean_bundle': 'קולקציית נקיים',
                    'tropical_bundle': 'קולקציית מנגו וטרופי',
                    'vanilla_bundle': 'קולקציית וניל',
                    'gourmand_bundle': 'קולקציית קינוחים',
                    'citrus_bundle': 'קולקציית הדרים',
                    'floral_bundle': 'קולקציית גן עדן פרחוני',
                    'aquatic_bundle': 'קולקציית חופשה בריביירה'
                };
                return (
                <div key={bundleId} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                        <h2 className="text-xl font-bold">{bundle.name}</h2>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                            <span className="bg-zinc-100 text-zinc-800 px-3 py-1 rounded-full text-xs font-bold">
                                {typeToHebrew[bundle.type] || bundle.type}
                            </span>
                            <span className="bg-zinc-100 text-zinc-800 px-3 py-1 rounded-full text-xs font-bold">{bundle.items?.length || 0} בשמים</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {bundle.items?.map(productId => {
                            const product = productsMap[productId];
                            if (!product) return null;
                            const isOOS = product.stock <= 0;

                            return (
                                <div key={productId} className={`p-4 rounded-2xl border transition-all relative group ${isOOS ? 'border-red-200 bg-red-50/30' : 'border-gray-100 bg-gray-50 hover:shadow-md'}`}>
                                    {/* Edit Button overlay */}
                                    <button
                                        onClick={() => openEditModal(bundleId, productId)}
                                        className="absolute top-2 left-2 p-2 bg-white text-gray-600 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity hover:text-black hover:bg-gray-100"
                                        title="החלף בושם"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
                                    </button>

                                    <div className="flex gap-4">
                                        <div className="w-16 h-16 shrink-0 bg-white rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden p-1">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <div className="text-xs text-gray-400">אין תמונה</div>
                                            )}
                                        </div>
                                        <div className="flex flex-col flex-1 justify-center gap-1">
                                            <span className="font-bold text-sm leading-tight">{product.name || `${product.brand} ${product.model}`}</span>
                                            <span className="text-xs text-gray-500">{product.brand}{product.category ? ` • ${product.category}` : ''}</span>
                                            <div className="mt-1">
                                                {isOOS ? (
                                                    <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">
                                                        חסר במלאי
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">
                                                        במלאי: {product.stock}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {isOOS && (
                                        <div className="mt-4 pt-4 border-t border-red-100">
                                            {!suggestions[productId] && (
                                                <button 
                                                    onClick={() => handleSuggest(productId)}
                                                    disabled={loadingSuggestionsFor === productId}
                                                    className="w-full text-sm bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                                                >
                                                    {loadingSuggestionsFor === productId ? 'טוען חלופות...' : 'הצע חלופות מתוך המלאי'}
                                                </button>
                                            )}

                                            {suggestions[productId] && (
                                                <div className="space-y-3 mt-3">
                                                    <h4 className="text-sm font-bold text-gray-700">חלופות מוצעות:</h4>
                                                    {suggestions[productId].length === 0 ? (
                                                        <p className="text-xs text-gray-500">לא נמצאו חלופות מתאימות במלאי.</p>
                                                    ) : (
                                                        <div className="grid gap-2">
                                                            {suggestions[productId].map(sug => (
                                                                <div key={sug.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold text-xs">{sug.name || `${sug.brand} ${sug.model}`}</span>
                                                                        <span className="text-[10px] text-gray-500">מלאי: {sug.stock}</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleReplace(bundleId, productId, sug)}
                                                                        disabled={updatingFor === productId}
                                                                        className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md font-bold hover:bg-blue-100 transition-colors disabled:opacity-50 shrink-0 mr-2"
                                                                    >
                                                                        {updatingFor === productId ? 'מעדכן...' : 'החלף'}
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
            )})}

            {/* Search Modal overlay */}
            {isSearchModalOpen && editingProductData && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-black text-xl">בחירת בושם חלופי</h3>
                            <button onClick={() => setIsSearchModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                        <div className="p-6 flex-1 overflow-hidden flex flex-col">
                            <div className="relative mb-6">
                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="חפש לפי שם, מותג או ברקוד..."
                                    className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                                    autoFocus
                                />
                                {isSearching && (
                                    <div className="absolute inset-y-0 left-3 flex items-center">
                                        <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto min-h-[300px]">
                                {searchResults.length > 0 ? (
                                    <div className="space-y-2">
                                        {searchResults.map(product => (
                                            <button
                                                key={product.id}
                                                onClick={() => handleReplace(editingProductData.bundleId, editingProductData.oldProductId, product)}
                                                disabled={updatingFor === editingProductData.oldProductId}
                                                className="w-full flex items-center gap-4 p-3 hover:bg-gray-50 border rounded-xl transition-colors text-right"
                                            >
                                                <div className="w-12 h-12 bg-white rounded-lg border flex items-center justify-center overflow-hidden shrink-0">
                                                    {(product.image || product.image_url) ? (
                                                        <img src={product.image || product.image_url} alt={product.name} className="w-full h-full object-contain p-1" />
                                                    ) : (
                                                        <span className="text-[10px] text-gray-400">אין תמונה</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 flex flex-col justify-center text-right" dir="rtl">
                                                    <div className="font-bold text-sm truncate w-full text-right" style={{ textAlign: 'right', direction: 'rtl' }}>
                                                        {product.name || `${product.brand} ${product.model}`}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate w-full text-right" style={{ textAlign: 'right', direction: 'rtl' }}>
                                                        {product.brand}
                                                    </div>
                                                </div>
                                                <div className="shrink-0 flex flex-col items-end">
                                                    {product.stock > 0 ? (
                                                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold">מלאי: {product.stock}</span>
                                                    ) : (
                                                        <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded font-bold">חסר במלאי</span>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : searchQuery.length >= 2 && !isSearching ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                        <p>לא נמצאו תוצאות ל"{searchQuery}"</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2 opacity-50"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                                        <p>הקלד לפחות 2 תווים כדי לחפש בשמים...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

