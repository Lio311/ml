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

    // Add Item State
    const [newItemName, setNewItemName] = useState("");
    const [newItemDesc, setNewItemDesc] = useState("");
    const [newItemImage, setNewItemImage] = useState("");
    // Replaced single price with size options
    const [newItemSizes, setNewItemSizes] = useState({
        "5ml": { enabled: false, price: "" },
        "10ml": { enabled: false, price: "" },
        "50ml": { enabled: false, price: "" },
        "100ml": { enabled: false, price: "" }
    });
    const [isAddingItem, setIsAddingItem] = useState(false);

    const router = useRouter();

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
                    contact_email: editEmail
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
        if (!confirm("האם אתה בטוח שברצונך למחוק קטלוג זה? כל המוצרים יימחקו לצמיתות.")) return;
        
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
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        
        // Build prices object
        const prices = {};
        let hasPrice = false;
        Object.entries(newItemSizes).forEach(([size, data]) => {
            if (data.enabled && data.price) {
                prices[size] = parseInt(data.price);
                hasPrice = true;
            }
        });

        if (!hasPrice) {
            toast.error("יש לבחור לפחות גודל אחד ולהזין מסיר");
            return;
        }

        setIsAddingItem(true);
        try {
            const res = await fetch(`/api/user-catalogs/${catalogId}/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newItemName,
                    description: newItemDesc,
                    prices: prices, // send the json object
                    image_url: newItemImage || null
                })
            });

            if (res.ok) {
                toast.success("מוצר נוסף בהצלחה!");
                setNewItemName("");
                setNewItemDesc("");
                setNewItemSizes({
                    "5ml": { enabled: false, price: "" },
                    "10ml": { enabled: false, price: "" },
                    "50ml": { enabled: false, price: "" },
                    "100ml": { enabled: false, price: "" }
                });
                setNewItemImage("");
                fetchCatalogData(); // refresh items
            } else {
                const err = await res.json();
                toast.error(err.error || "שגיאה בהוספת מוצר");
            }
        } catch (error) {
            console.error(error);
            toast.error("שגיאה");
        } finally {
            setIsAddingItem(false);
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (!confirm("למחוק מוצר זה מהקטלוג?")) return;
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
                {/* Add Custom Item Form */}
                <div className="w-full lg:w-1/3">
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 sticky top-24">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="bg-green-100 text-green-700 w-8 h-8 flex items-center justify-center rounded-full text-xl">+</span>
                            הוסף מוצר חדש
                        </h2>
                        <form onSubmit={handleAddItem} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">שם המוצר</label>
                                <input type="text" required value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none" placeholder="למשל: בושם טום פורד" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">גדלים ומחירים זמינים</label>
                                <div className="space-y-2 border p-3 rounded-lg bg-white">
                                    {Object.entries(newItemSizes).map(([size, data]) => (
                                        <div key={size} className="flex items-center gap-3">
                                            <label className="flex items-center gap-2 cursor-pointer w-20">
                                                <input 
                                                    type="checkbox"
                                                    checked={data.enabled}
                                                    onChange={(e) => setNewItemSizes(prev => ({
                                                        ...prev,
                                                        [size]: { ...prev[size], enabled: e.target.checked }
                                                    }))}
                                                    className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                                                />
                                                <span className="text-sm font-medium" dir="ltr">{size}</span>
                                            </label>
                                            <input 
                                                type="number" 
                                                min="1" 
                                                disabled={!data.enabled}
                                                value={data.price}
                                                onChange={(e) => setNewItemSizes(prev => ({
                                                    ...prev,
                                                    [size]: { ...prev[size], price: e.target.value }
                                                }))}
                                                className="w-full p-2 border rounded focus:ring-1 focus:ring-black outline-none disabled:bg-gray-100 disabled:opacity-50 text-sm" 
                                                placeholder={`מחיר ל-${size} (₪)`} 
                                            />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">בחר אילו גדלים תרצה להציע עבור המוצר ומה המחיר של כל אחד.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">קישור לתמונה (URL)</label>
                                <input type="url" value={newItemImage} onChange={(e) => setNewItemImage(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none text-left" dir="ltr" placeholder="https://..." />
                                <p className="text-xs text-gray-500 mt-1">אופציונלי. הדבק קישור לתמונה קיימת ברשת.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
                                <textarea value={newItemDesc} onChange={(e) => setNewItemDesc(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none resize-none h-20" placeholder="פירוט על המוצר..." />
                            </div>
                            
                            <button type="submit" disabled={isAddingItem} className="w-full py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition shadow disabled:opacity-50">
                                {isAddingItem ? 'מוסיף...' : 'הוסף לקטלוג'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Products List */}
                <div className="w-full lg:w-2/3">
                    <h2 className="text-2xl font-bold mb-6">המוצרים בקטלוג ({items.length})</h2>
                    
                    {items.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center flex flex-col items-center justify-center">
                            <div className="text-4xl mb-3 opacity-50">🛍️</div>
                            <h3 className="text-lg font-bold text-gray-700 mb-1">הקטלוג שלך ריק</h3>
                            <p className="text-gray-500 text-sm">התחל להוסיף מוצרים משלך בטופס מימין כדי שהלקוחות יוכלו לרכוש.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {items.map(item => (
                                <div key={item.id} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group">
                                    <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden relative">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-4xl opacity-20">📦</div>
                                        )}
                                        <button 
                                            onClick={() => handleDeleteItem(item.id)}
                                            className="absolute top-2 right-2 bg-white/90 text-red-500 p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:scale-110 transition shadow"
                                            title="מחק מוצר"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="p-4 flex flex-col flex-grow">
                                        <h3 className="font-bold text-lg leading-tight mb-3">{item.name}</h3>
                                        
                                        {/* Display Prices */}
                                        <div className="space-y-1 mb-3">
                                            {item.prices && Object.entries(item.prices).map(([size, price]) => (
                                                 <div key={size} className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded text-sm border border-gray-100">
                                                     <span className="font-medium text-gray-600" dir="ltr">{size}</span>
                                                     <span className="font-bold">{price} ₪</span>
                                                 </div>
                                            ))}
                                            {!item.prices && item.price && (
                                                <div className="text-xl font-black text-black">{item.price} ₪</div>
                                            )}
                                        </div>

                                        {item.description && (
                                            <p className="text-sm text-gray-500 line-clamp-2 mt-auto">{item.description}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
