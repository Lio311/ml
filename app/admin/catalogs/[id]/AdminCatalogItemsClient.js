"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AdminCatalogItemsClient({ catalogId }) {
    const [catalog, setCatalog] = useState(null);
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Item Editing State
    const [editingItemId, setEditingItemId] = useState(null);
    const [editItemData, setEditItemData] = useState(null);
    const [isSubmittingItem, setIsSubmittingItem] = useState(false);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: null,
        confirmText: "אישור",
        isDanger: false
    });

    const openConfirm = (title, message, onConfirm, confirmText = "אישור", isDanger = false) => {
        setConfirmModal({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            },
            confirmText,
            isDanger
        });
    };

    const fetchCatalogData = async () => {
        setIsLoading(true);
        try {
            // Fetch catalog details (we can use the regular user-catalogs endpoint or the admin one if we had it for single catalog)
            // Let's assume we can fetch it. If not we might need an admin catalog detail endpoint.
            // Actually, let's just fetch items first.
            const itemsRes = await fetch(`/api/admin/catalogs/${catalogId}/items`);
            if (itemsRes.ok) {
                const itemsData = await itemsRes.json();
                setItems(itemsData);
            } else {
                toast.error("שגיאה בטעינת מוצרי הקטלוג");
            }
        } catch (error) {
            console.error(error);
            toast.error("שגיאה בטעינת הנתונים");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCatalogData();
    }, [catalogId]);

    const handleStartEdit = (item) => {
        setEditingItemId(item.id);
        setEditItemData({
            brand: item.brand || "",
            fragrance_name: item.fragrance_name || "",
            description: item.description || "",
            image_url: item.image_url || "",
            imageInputType: "url",
            top_notes: item.top_notes || "",
            middle_notes: item.middle_notes || "",
            base_notes: item.base_notes || "",
            gender: item.gender || "",
            category: item.category || "",
            sizes: {
                "2ml": { enabled: !!item.prices?.["2ml"], price: item.prices?.["2ml"] || "" },
                "5ml": { enabled: !!item.prices?.["5ml"], price: item.prices?.["5ml"] || "" },
                "10ml": { enabled: !!item.prices?.["10ml"], price: item.prices?.["10ml"] || "" }
            }
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleUpdateItem = async (e) => {
        e.preventDefault();
        const prices = {};
        Object.entries(editItemData.sizes).forEach(([size, data]) => {
            if (data.enabled && data.price) prices[size] = parseInt(data.price);
        });

        setIsSubmittingItem(true);
        try {
            const res = await fetch(`/api/admin/catalogs/${catalogId}/items/${editingItemId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    brand: editItemData.brand,
                    fragrance_name: editItemData.fragrance_name,
                    description: editItemData.description,
                    prices: prices,
                    image_url: editItemData.image_url,
                    top_notes: editItemData.top_notes,
                    middle_notes: editItemData.middle_notes,
                    base_notes: editItemData.base_notes,
                    gender: editItemData.gender,
                    category: editItemData.category
                })
            });

            if (res.ok) {
                toast.success("מוצר עודכן בהצלחה!");
                setEditingItemId(null);
                setEditItemData(null);
                fetchCatalogData();
            } else {
                const err = await res.json();
                toast.error(err.error || "שגיאה בעדכון");
            }
        } catch (error) {
            console.error(error);
            toast.error("שגיאה");
        } finally {
            setIsSubmittingItem(false);
        }
    };

    const handleDeleteItem = async (itemId) => {
        openConfirm(
            "מחיקת מוצר",
            "האם אתה בטוח שברצונך למחוק מוצר זה? (פעולה זו בלתי הפיכה)",
            async () => {
                try {
                    const res = await fetch(`/api/admin/catalogs/${catalogId}/items/${itemId}`, { method: "DELETE" });
                    if (res.ok) {
                        toast.success("המוצר נמחק");
                        setItems(items.filter(i => i.id !== itemId));
                    } else {
                        toast.error("שגיאה במחיקו");
                    }
                } catch (e) {
                    console.error(e);
                    toast.error("שגיאה");
                }
            },
            "מחק מוצר",
            true
        );
    };

    if (isLoading) {
        return <div className="text-center py-20 text-xl animate-pulse">טוען נתונים...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between border-b pb-6">
                <div>
                    <Link href="/admin/catalogs" className="text-gray-500 hover:text-black hover:underline mb-2 inline-block text-sm">
                        &larr; חזרה לרשימת הקטלוגים
                    </Link>
                    <h1 className="text-3xl font-bold">ניהול מוצרים בקטלוג</h1>
                    <p className="text-gray-500 text-sm mt-1">מזהה קטלוג: {catalogId}</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Edit Form */}
                <div className="w-full lg:w-1/3">
                    {editingItemId ? (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 sticky top-24 shadow-sm">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 flex items-center justify-center rounded-full text-xl bg-blue-100 text-blue-700">✎</span>
                                ערוך מוצר
                                <button onClick={() => { setEditingItemId(null); setEditItemData(null); }} className="text-xs font-normal text-gray-500 underline mr-auto hover:text-black transition">ביטול</button>
                            </h2>
                            <form onSubmit={handleUpdateItem} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">שם המותג (באנגלית)</label>
                                        <input type="text" required value={editItemData.brand} onChange={(e) => setEditItemData({...editItemData, brand: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">דגם (באנגלית)</label>
                                        <input type="text" required value={editItemData.fragrance_name} onChange={(e) => setEditItemData({...editItemData, fragrance_name: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">מגדר</label>
                                        <select required value={editItemData.gender} onChange={(e) => setEditItemData({...editItemData, gender: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none text-sm appearance-none bg-white">
                                            <option value="">בחר מגדר</option>
                                            <option value="Unisex">Unisex</option>
                                            <option value="Men">Men</option>
                                            <option value="Women">Women</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">קטגוריה</label>
                                        <input type="text" required value={editItemData.category} onChange={(e) => setEditItemData({...editItemData, category: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">תווי הבושם (באנגלית)</label>
                                    <div className="space-y-2">
                                        <input type="text" value={editItemData.top_notes} onChange={(e) => setEditItemData({...editItemData, top_notes: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="Top notes..." />
                                        <input type="text" value={editItemData.middle_notes} onChange={(e) => setEditItemData({...editItemData, middle_notes: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="Middle notes..." />
                                        <input type="text" value={editItemData.base_notes} onChange={(e) => setEditItemData({...editItemData, base_notes: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="Base notes..." />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">גדלים ומחירים (₪)</label>
                                    <div className="space-y-2 border p-3 rounded-lg bg-white">
                                        {Object.entries(editItemData.sizes).map(([size, data]) => (
                                            <div key={size} className="flex items-center gap-3">
                                                <label className="flex items-center gap-2 cursor-pointer w-20">
                                                    <input 
                                                        type="checkbox"
                                                        checked={data.enabled}
                                                        onChange={(e) => {
                                                            const newState = e.target.checked;
                                                            setEditItemData({
                                                                ...editItemData,
                                                                sizes: { ...editItemData.sizes, [size]: { ...editItemData.sizes[size], enabled: newState } }
                                                            });
                                                        }}
                                                        className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                                                    />
                                                    <span className="text-sm font-medium" dir="ltr">{size}</span>
                                                </label>
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    required={data.enabled}
                                                    disabled={!data.enabled}
                                                    value={data.price}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setEditItemData({
                                                            ...editItemData,
                                                            sizes: { ...editItemData.sizes, [size]: { ...editItemData.sizes[size], price: val } }
                                                        });
                                                    }}
                                                    className="w-full p-2 border rounded focus:ring-1 focus:ring-black outline-none disabled:bg-gray-100 disabled:opacity-50 text-sm" 
                                                    placeholder={`מחיר עבור ${size}`} 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">תמונת מוצר (URL)</label>
                                    <input type="url" required value={editItemData.image_url} onChange={(e) => setEditItemData({...editItemData, image_url: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none text-sm text-left" dir="ltr" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">תיאור (אנגלית/עברית)</label>
                                    <textarea required value={editItemData.description} onChange={(e) => setEditItemData({...editItemData, description: e.target.value})} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none resize-none h-20 text-sm" />
                                </div>
                                
                                <button type="submit" disabled={isSubmittingItem} className="w-full py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition shadow disabled:opacity-50">
                                    {isSubmittingItem ? 'מעבד...' : 'עדכן מוצר'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 sticky top-24 text-center">
                            <div className="text-3xl mb-3">👈</div>
                            <h3 className="font-bold text-blue-900 mb-2">בחר מוצר לעריכה</h3>
                            <p className="text-blue-700 text-sm">לחץ על כפתור העריכה (✎) על אחד המוצרים ברשימה כדי להתחיל לעדכן אותו.</p>
                        </div>
                    )}
                </div>

                {/* Items List */}
                <div className="w-full lg:w-2/3">
                    <h2 className="text-xl font-bold mb-4">מוצרים בקטלוג ({items.length})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {items.map(item => (
                            <div key={item.id} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group relative">
                                <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden relative">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-4xl opacity-20">📦</div>
                                    )}
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleStartEdit(item)}
                                            className="bg-white text-blue-600 p-2 rounded-full hover:bg-blue-50 hover:scale-110 transition shadow border border-blue-100"
                                            title="ערוך מוצר"
                                        >
                                            ✎
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteItem(item.id)}
                                            className="bg-white text-red-500 p-2 rounded-full hover:bg-red-50 hover:scale-110 transition shadow border border-red-100"
                                            title="מחק מוצר"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 flex flex-col flex-grow">
                                    <div className="mb-2">
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.brand}</div>
                                        <h3 className="font-bold text-lg leading-tight">{item.fragrance_name}</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {item.prices && Object.entries(item.prices).map(([size, price]) => (
                                             <div key={size} className="bg-gray-50 px-2 py-1 rounded text-[10px] border border-gray-100 flex flex-col items-center">
                                                 <span className="text-gray-400 font-bold" dir="ltr">{size}</span>
                                                 <span className="font-bold text-black">{price} ₪</span>
                                             </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Confirm Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmModal.title}</h3>
                        <p className="text-gray-600 mb-6">{confirmModal.message}</p>
                        <div className="flex gap-3 justify-end items-center">
                            <button onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-black transition">ביטול</button>
                            <button onClick={confirmModal.onConfirm} className={`px-6 py-2 text-sm font-bold text-white rounded-xl shadow-lg transition transform hover:-translate-y-0.5 active:scale-95 ${confirmModal.isDanger ? 'bg-red-500 hover:bg-red-600' : 'bg-black hover:bg-gray-800'}`}>{confirmModal.confirmText}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
