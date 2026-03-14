"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function CatalogManagerClient({ catalogId }) {
    const [catalog, setCatalog] = useState(null);
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Edit Catalog State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editSlug, setEditSlug] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editImage, setEditImage] = useState("");
    const [editImageInputType, setEditImageInputType] = useState("file");

    // Add Item State
    const [newItemBrand, setNewItemBrand] = useState("");
    const [newItemFragranceName, setNewItemFragranceName] = useState("");
    const [newItemDesc, setNewItemDesc] = useState("");
    const [newItemImage, setNewItemImage] = useState("");
    const [newItemImageInputType, setNewItemImageInputType] = useState("file");
    const [newItemTopNotes, setNewItemTopNotes] = useState("");
    const [newItemMiddleNotes, setNewItemMiddleNotes] = useState("");
    const [newItemBaseNotes, setNewItemBaseNotes] = useState("");
    const [newItemGender, setNewItemGender] = useState("");
    const [newItemCategory, setNewItemCategory] = useState("");
    
    const [newItemSizes, setNewItemSizes] = useState({
        "2ml": { enabled: false, price: "" },
        "5ml": { enabled: false, price: "" },
        "10ml": { enabled: false, price: "" }
    });
    const [isSubmittingItem, setIsSubmittingItem] = useState(false);
    
    // Item Editing State
    const [editingItemId, setEditingItemId] = useState(null);
    const [editItemData, setEditItemData] = useState(null);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: null,
        confirmText: "אישור",
        isDanger: false
    });

    const router = useRouter();

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
            // Fetch catalog details
            const catRes = await fetch(`/api/user-catalogs/${catalogId}`);
            if (!catRes.ok) {
                if (catRes.status === 404) {
                    toast.error("קטלוג לא נמצא או שאין לך הרשאה");
                    router.push("/my-catalogs");
                    return;
                }
                throw new Error("Failed to fetch catalog");
            }
            const catData = await catRes.json();
            setCatalog(catData);
            
            // Populate edit state
            setEditName(catData.name);
            setEditSlug(catData.slug);
            setEditDesc(catData.description || "");
            setEditEmail(catData.contact_email);
            setEditImage(catData.image_url || "");

            // Fetch Items
            const itemsRes = await fetch(`/api/user-catalogs/${catalogId}/items`);
            if (itemsRes.ok) {
                const itemsData = await itemsRes.json();
                setItems(itemsData);
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

    const handleUpdateCatalog = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/user-catalogs/${catalogId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editName,
                    slug: editSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                    description: editDesc,
                    contact_email: editEmail,
                    image_url: editImage || null
                })
            });

            if (res.ok) {
                toast.success("קטלוג עודכן בהצלחה!");
                setIsEditing(false);
                fetchCatalogData();
            } else {
                const ext = await res.json();
                toast.error(ext.error || "שגיאה בעדכון הקטלוג");
            }
        } catch (error) {
            console.error(error);
            toast.error("שגיאה בתקשורת מול השרת");
        }
    };

    const handleDeleteCatalog = async () => {
        openConfirm(
            "מחיקת קטלוג",
            "האם אתה בטוח שברצונך למחוק קטלוג זה? כל המוצרים יימחקו לצמיתות.",
            async () => {
                try {
                    const res = await fetch(`/api/user-catalogs/${catalogId}`, { method: "DELETE" });
                    if (res.ok) {
                        toast.success("קטלוג נמחק");
                        router.push("/my-catalogs");
                    } else {
                        toast.error("שגיאה במחיקת קטלוג");
                    }
                } catch (e) {
                    console.error(e);
                    toast.error("שגיאה");
                }
            },
            "מחק לצמיתות",
            true
        );
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        
        const prices = {};
        let hasPrice = false;
        Object.entries(newItemSizes).forEach(([size, data]) => {
            if (data.enabled && data.price) {
                prices[size] = parseInt(data.price);
                hasPrice = true;
            }
        });

        if (!hasPrice) {
            toast.error("יש לבחור לפחות גודל אחד ולהזין מחיר");
            return;
        }

        if (!newItemImage) {
            toast.error("יש להוסיף תמונת מוצר");
            return;
        }

        setIsSubmittingItem(true);
        try {
            const res = await fetch(`/api/user-catalogs/${catalogId}/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    brand: newItemBrand,
                    fragrance_name: newItemFragranceName,
                    description: newItemDesc,
                    prices: prices,
                    image_url: newItemImage,
                    top_notes: newItemTopNotes,
                    middle_notes: newItemMiddleNotes,
                    base_notes: newItemBaseNotes,
                    gender: newItemGender,
                    category: newItemCategory
                })
            });

            if (res.ok) {
                toast.success("מוצר נוסף בהצלחה!");
                setNewItemBrand("");
                setNewItemFragranceName("");
                setNewItemDesc("");
                setNewItemSizes({
                    "2ml": { enabled: false, price: "" },
                    "5ml": { enabled: false, price: "" },
                    "10ml": { enabled: false, price: "" }
                });
                setNewItemImage("");
                setNewItemTopNotes("");
                setNewItemMiddleNotes("");
                setNewItemBaseNotes("");
                setNewItemGender("");
                setNewItemCategory("");
                fetchCatalogData();
            } else {
                const err = await res.json();
                toast.error(err.error || "שגיאה בהוספת מוצר");
            }
        } catch (error) {
            console.error(error);
            toast.error("שגיאה");
        } finally {
            setIsSubmittingItem(false);
        }
    };

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
            const res = await fetch(`/api/user-catalogs/${catalogId}/items/${editingItemId}`, {
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
            "למחוק מוצר זה מהקטלוג?",
            async () => {
                try {
                    const res = await fetch(`/api/user-catalogs/${catalogId}/items/${itemId}`, { method: "DELETE" });
                    if (res.ok) {
                        toast.success("המוצר נמחק");
                        setItems(items.filter(i => i.id !== itemId));
                    } else {
                        toast.error("שגיאה במחיקה");
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

    if (isLoading || !catalog) {
        return <div className="text-center py-20 text-xl animate-pulse">טוען פרטי קטלוג...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Header & Nav */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                <div>
                    <Link href="/my-catalogs" className="text-gray-500 hover:text-black hover:underline mb-2 inline-block text-sm">
                        &larr; חזרה לקטלוגים שלי
                    </Link>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        {catalog.name}
                        <a href={`/catalog/${catalog.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100 transition font-normal flex items-center gap-1">
                            צפה בקטלוג אונליין
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                        </a>
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold border transition ${isEditing ? 'bg-black text-white border-black' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                        {isEditing ? 'סגור עריכה' : 'הגדרות קטלוג'}
                    </button>
                    <button 
                        onClick={handleDeleteCatalog}
                        className="px-4 py-2 rounded-lg text-sm font-bold bg-white text-red-500 border border-red-200 hover:bg-red-50 hover:border-red-300 transition"
                    >
                        מחק קטלוג
                    </button>
                </div>
            </div>

            {/* Edit Catalog Form */}
            {isEditing && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-fade-in">
                    <h2 className="text-lg font-bold mb-4">הגדרות בסיסיות</h2>
                    <form onSubmit={handleUpdateCatalog} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">שם הקטלוג</label>
                            <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-2 border rounded focus:ring-1 focus:ring-black outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">אימייל להזמנות</label>
                            <input type="email" required value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full p-2 border rounded focus:ring-1 focus:ring-black outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">קישור אישי (Slug)</label>
                            <div className="flex items-center text-left" dir="ltr">
                                <span className="bg-gray-100 p-2 rounded-l border border-r-0 text-gray-500 text-sm">/catalog/</span>
                                <input type="text" required value={editSlug} onChange={(e) => setEditSlug(e.target.value)} className="w-full p-2 border rounded-r focus:ring-1 focus:ring-black outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">תמונת לוגו / פרופיל החנות</label>
                            
                            <div className="flex bg-gray-100 p-1 rounded-lg mb-3">
                                <button 
                                    type="button"
                                    onClick={() => setEditImageInputType("file")}
                                    className={`flex-1 text-sm py-1.5 rounded-md transition ${editImageInputType === "file" ? 'bg-white shadow-sm font-bold text-black' : 'text-gray-500 hover:text-black'}`}
                                >
                                    העלאה מהמחשב
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setEditImageInputType("url")}
                                    className={`flex-1 text-sm py-1.5 rounded-md transition ${editImageInputType === "url" ? 'bg-white shadow-sm font-bold text-black' : 'text-gray-500 hover:text-black'}`}
                                >
                                    קישור לתמונה
                                </button>
                            </div>

                            {editImageInputType === "file" ? (
                                <div className="mt-2 text-xs flex mt-3 items-center gap-2">
                                    <label className="w-full flex flex-col items-center justify-center h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 bg-white transition-colors">
                                        <div className="flex flex-col items-center justify-center">
                                            <p className="mb-1 text-sm text-gray-500"><span className="font-semibold text-black">בחר תמונה מהמחשב</span></p>
                                        </div>
                                        <input type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                if (file.size > 2 * 1024 * 1024) { return toast.error("קובץ גדול מדי. מקסימום 2MB."); }
                                                const reader = new FileReader();
                                                reader.onloadend = () => setEditImage(reader.result);
                                                reader.readAsDataURL(file);
                                            }
                                        }}/>
                                    </label>
                                </div>
                            ) : (
                                <input 
                                    type="url" 
                                    value={editImage} 
                                    onChange={(e) => setEditImage(e.target.value)} 
                                    className="w-full p-2 mt-2 border rounded focus:ring-1 focus:ring-black outline-none text-left" 
                                    dir="ltr" 
                                    placeholder="https://..." 
                                />
                            )}
                            {editImage && (
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500 mb-2">תצוגה מקדימה:</p>
                                    <img src={editImage} alt="Preview" className="w-16 h-16 object-cover rounded-md border border-gray-200 shadow-sm" />
                                </div>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
                            <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full p-2 border rounded focus:ring-1 focus:ring-black outline-none resize-none h-20" />
                        </div>
                        <div className="md:col-span-2 text-left">
                            <button type="submit" className="px-6 py-2 bg-black text-white rounded font-bold hover:bg-gray-800 transition">שמור שינויים</button>
                        </div>
                    </form>
                </div>
            )}

            
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Form: Add or Edit Item */}
                <div className="w-full lg:w-1/3">
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 sticky top-24">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xl ${editingItemId ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                {editingItemId ? '✎' : '+'}
                            </span>
                            {editingItemId ? 'ערוך מוצר' : 'הוסף מוצר חדש'}
                            {editingItemId && (
                                <button onClick={() => { setEditingItemId(null); setEditItemData(null); }} className="text-xs font-normal text-gray-500 underline mr-auto hover:text-black transition">ביטול</button>
                            )}
                        </h2>
                        <form onSubmit={editingItemId ? handleUpdateItem : handleAddItem} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Brand Name (English)</label>
                                    <input type="text" required value={editingItemId ? editItemData.brand : newItemBrand} onChange={(e) => editingItemId ? setEditItemData({...editItemData, brand: e.target.value}) : setNewItemBrand(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="e.g. Tom Ford" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fragrance Name (English)</label>
                                    <input type="text" required value={editingItemId ? editItemData.fragrance_name : newItemFragranceName} onChange={(e) => editingItemId ? setEditItemData({...editItemData, fragrance_name: e.target.value}) : setNewItemFragranceName(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="e.g. Lost Cherry" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gender</label>
                                    <select required value={editingItemId ? editItemData.gender : newItemGender} onChange={(e) => editingItemId ? setEditItemData({...editItemData, gender: e.target.value}) : setNewItemGender(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none text-sm appearance-none bg-white">
                                        <option value="">בחר מגדר</option>
                                        <option value="Unisex">Unisex</option>
                                        <option value="Men">Men</option>
                                        <option value="Women">Women</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                                    <input type="text" required value={editingItemId ? editItemData.category : newItemCategory} onChange={(e) => editingItemId ? setEditItemData({...editItemData, category: e.target.value}) : setNewItemCategory(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="e.g. Amber Floral" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Fragrance Notes (English)</label>
                                <div className="space-y-2">
                                    <input type="text" required value={editingItemId ? editItemData.top_notes : newItemTopNotes} onChange={(e) => editingItemId ? setEditItemData({...editItemData, top_notes: e.target.value}) : setNewItemTopNotes(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="Top: Cherry, Bitter Almond..." />
                                    <input type="text" required value={editingItemId ? editItemData.middle_notes : newItemMiddleNotes} onChange={(e) => editingItemId ? setEditItemData({...editItemData, middle_notes: e.target.value}) : setNewItemMiddleNotes(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="Middle: Sour Cherry, Damask Rose..." />
                                    <input type="text" required value={editingItemId ? editItemData.base_notes : newItemBaseNotes} onChange={(e) => editingItemId ? setEditItemData({...editItemData, base_notes: e.target.value}) : setNewItemBaseNotes(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="Base: Vanilla, Tonka Bean..." />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Sizes & Prices (₪)</label>
                                <div className="space-y-2 border p-3 rounded-lg bg-white">
                                    {Object.entries(editingItemId ? editItemData.sizes : newItemSizes).map(([size, data]) => (
                                        <div key={size} className="flex items-center gap-3">
                                            <label className="flex items-center gap-2 cursor-pointer w-20">
                                                <input 
                                                    type="checkbox"
                                                    checked={data.enabled}
                                                    onChange={(e) => {
                                                        const newState = e.target.checked;
                                                        if (editingItemId) {
                                                            setEditItemData({
                                                                ...editItemData,
                                                                sizes: { ...editItemData.sizes, [size]: { ...editItemData.sizes[size], enabled: newState } }
                                                            });
                                                        } else {
                                                            setNewItemSizes(prev => ({ ...prev, [size]: { ...prev[size], enabled: newState } }));
                                                        }
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
                                                    if (editingItemId) {
                                                        setEditItemData({
                                                            ...editItemData,
                                                            sizes: { ...editItemData.sizes, [size]: { ...editItemData.sizes[size], price: val } }
                                                        });
                                                    } else {
                                                        setNewItemSizes(prev => ({ ...prev, [size]: { ...prev[size], price: val } }));
                                                    }
                                                }}
                                                className="w-full p-2 border rounded focus:ring-1 focus:ring-black outline-none disabled:bg-gray-100 disabled:opacity-50 text-sm" 
                                                placeholder={`Price for ${size}`} 
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Image</label>
                                {((editingItemId && editItemData.imageInputType === "file") || (!editingItemId && newItemImageInputType === "file")) ? (
                                    <div className="flex flex-col gap-2">
                                        <label className="w-full flex flex-col items-center justify-center h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 bg-white transition-colors relative overflow-hidden">
                                            {(editingItemId ? editItemData.image_url : newItemImage) ? (
                                                <img src={editingItemId ? editItemData.image_url : newItemImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                                            ) : null}
                                            <span className="text-xs font-semibold text-gray-700 z-10">בחר תמונה מהמחשב</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    if (file.size > 2 * 1024 * 1024) return toast.error("File too large (max 2MB)");
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => editingItemId ? setEditItemData({...editItemData, image_url: reader.result}) : setNewItemImage(reader.result);
                                                    reader.readAsDataURL(file);
                                                }
                                            }}/>
                                        </label>
                                        <button type="button" onClick={() => editingItemId ? setEditItemData({...editItemData, imageInputType: "url"}) : setNewItemImageInputType("url")} className="text-[10px] text-blue-600 underline text-right">השתמש בקישור במקום</button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <input type="url" required value={editingItemId ? editItemData.image_url : newItemImage} onChange={(e) => editingItemId ? setEditItemData({...editItemData, image_url: e.target.value}) : setNewItemImage(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none text-sm text-left" dir="ltr" placeholder="https://..." />
                                        <button type="button" onClick={() => editingItemId ? setEditItemData({...editItemData, imageInputType: "file"}) : setNewItemImageInputType("file")} className="text-[10px] text-blue-600 underline text-right">העלה קובץ במקום</button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description (English/Hebrew)</label>
                                <textarea required value={editingItemId ? editItemData.description : newItemDesc} onChange={(e) => editingItemId ? setEditItemData({...editItemData, description: e.target.value}) : setNewItemDesc(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none resize-none h-20 text-sm" placeholder="Tell us more about this fragrance..." />
                            </div>
                            
                            <button type="submit" disabled={isSubmittingItem} className="w-full py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition shadow disabled:opacity-50">
                                {isSubmittingItem ? 'מעבד...' : (editingItemId ? 'עדכן מוצר' : 'הוסף לקטלוג')}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Products List */}
                <div className="w-full lg:w-2/3">
                    <h2 className="text-2xl font-bold mb-6 flex items-center justify-between">
                        <span>המוצרים בקטלוג ({items.length})</span>
                    </h2>
                    
                    {items.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center flex flex-col items-center justify-center">
                            <div className="text-4xl mb-3 opacity-50">🛍️</div>
                            <h3 className="text-lg font-bold text-gray-700 mb-1">הקטלוג שלך ריק</h3>
                            <p className="text-gray-500 text-sm">התחל להוסיף מוצרים משלך בטופס מימין.</p>
                        </div>
                    ) : (
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
                                                 <div key={size} className="bg-gray-50 px-2 py-1 rounded text-[10px] border border-gray-100 flex flex-col items-center min-w-[45px]">
                                                     <span className="text-gray-400 font-bold" dir="ltr">{size}</span>
                                                     <span className="font-bold text-black">{price} ₪</span>
                                                 </div>
                                            ))}
                                        </div>

                                        <div className="mt-auto pt-3 border-t grid grid-cols-1 gap-1">
                                            <div className="text-[10px] text-gray-500">
                                                <span className="font-bold text-gray-900">Notes: </span> 
                                                <span className="truncate block" title={item.top_notes}>{item.top_notes}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px]">
                                                <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-medium">{item.gender}</span>
                                                <span className="text-gray-400">{item.category}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Confirm Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmModal.title}</h3>
                        <p className="text-gray-600 mb-6">{confirmModal.message}</p>
                        <div className="flex gap-3 justify-end items-center">
                            <button 
                                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-black transition"
                            >
                                ביטול
                            </button>
                            <button 
                                onClick={confirmModal.onConfirm}
                                className={`px-6 py-2 text-sm font-bold text-white rounded-xl shadow-lg transition transform hover:-translate-y-0.5 active:scale-95 ${confirmModal.isDanger ? 'bg-red-500 hover:bg-red-600' : 'bg-black hover:bg-gray-800'}`}
                            >
                                {confirmModal.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
