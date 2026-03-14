"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import TagInput from "../../components/TagInput";

function OrdersTab({ catalogId }) {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/user-catalogs/${catalogId}/orders/manage`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (e) {
            console.error('Error fetching orders:', e);
            toast.error('שגיאה בטעינת הזמנות');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [catalogId]);

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const res = await fetch(`/api/user-catalogs/${catalogId}/orders/manage`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, status: newStatus })
            });
            if (res.ok) {
                toast.success('סטטוס חבילה עודכן');
                fetchOrders();
            } else {
                toast.error('שגיאה בעדכון סטטוס');
            }
        } catch (e) {
            toast.error('שגיאה בעדכון סטטוס');
        }
    };

    if (isLoading) return <div className="text-center py-10 animate-pulse">טוען הזמנות...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-right" dir="rtl">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-lg">הזמנות לקטלוג שלי</h3>
                <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold">{orders.length} הזמנות</span>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 border-b">
                        <tr>
                            <th className="p-4 text-right font-semibold">מספר הזמנה</th>
                            <th className="p-4 text-right font-semibold">תאריך</th>
                            <th className="p-4 text-right font-semibold">לקוח</th>
                            <th className="p-4 text-right font-semibold">סכום</th>
                            <th className="p-4 text-right font-semibold">פריטים</th>
                            <th className="p-4 text-center font-semibold">סטטוס מול הלקוח</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-right">
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-10 text-center text-gray-500 text-lg">עדיין אין הזמנות לקטלוג זה.</td>
                            </tr>
                        ) : (
                            orders.map(order => {
                                const customer = typeof order.customer_details === 'string' ? JSON.parse(order.customer_details) : order.customer_details;
                                const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                                
                                return (
                                    <tr key={order.id} className="hover:bg-gray-50/50 transition">
                                        <td className="p-4 font-bold text-gray-700">#{order.id}</td>
                                        <td className="p-4 text-gray-500">{new Date(order.created_at).toLocaleDateString('he-IL')}</td>
                                        <td className="p-4">
                                            <div className="font-bold">{customer?.name}</div>
                                            <div className="text-xs text-gray-400">{customer?.email}</div>
                                            <div className="text-xs text-gray-400">{customer?.phone}</div>
                                        </td>
                                        <td className="p-4 font-bold text-lg">{order.total_amount} ₪</td>
                                        <td className="p-4 text-xs text-gray-500 max-w-[200px]">
                                            <ul className="list-disc list-inside space-y-1">
                                                {items.map((item, i) => (
                                                    <li key={i} className="truncate">
                                                        {item.quantity}x {item.name} ({item.size}ml)
                                                    </li>
                                                ))}
                                            </ul>
                                            {order.free_samples_count > 0 && (
                                                <div className="mt-1 text-pink-500 font-bold">+ {order.free_samples_count} דוגמיות חינם</div>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                className={`p-2 border rounded-lg font-bold text-xs outline-none transition-colors select-none cursor-pointer
                                                    ${order.status === 'pending' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                                    order.status === 'processing' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                                    order.status === 'shipped' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                                    order.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                                                    'bg-gray-100 text-gray-800 border-gray-200'}`}
                                            >
                                                <option value="pending" className="bg-white text-black">ממתין</option>
                                                <option value="processing" className="bg-white text-black">בטיפול</option>
                                                <option value="shipped" className="bg-white text-black">נשלח אליכם</option>
                                                <option value="completed" className="bg-white text-black">הושלם (נאסף/נמסר)</option>
                                                <option value="cancelled" className="bg-white text-black">בוטל</option>
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


export default function CatalogManagerClient({ catalogId }) {
    const [catalog, setCatalog] = useState(null);
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [availableNotes, setAvailableNotes] = useState([]);
    const [availableCategories, setAvailableCategories] = useState([]);
    
    // Edit Catalog State
    const [editName, setEditName] = useState("");
    const [editSlug, setEditSlug] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editImage, setEditImage] = useState("");
    const [editImageInputType, setEditImageInputType] = useState("file");
    
    // Shipping & Samples State
    const [editSelfPickup, setEditSelfPickup] = useState(false);
    const [editDeliveryActive, setEditDeliveryActive] = useState(false);
    const [editDeliveryPrice, setEditDeliveryPrice] = useState(0);
    const [editSampleTiers, setEditSampleTiers] = useState([]);

    // Tabs
    const [activeTab, setActiveTab] = useState("products");

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
    const [newItemStockMl, setNewItemStockMl] = useState("");

    // Filter/Sort/Pagination State
    const [filterGender, setFilterGender] = useState("הכל");
    const [filterCategory, setFilterCategory] = useState("הכל");
    const [sortBy, setSortBy] = useState("newest");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedSizes, setSelectedSizes] = useState({});
    const ITEMS_PER_PAGE = 12;

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
            setEditSelfPickup(catData.self_pickup_active || false);
            setEditDeliveryActive(catData.delivery_active || false);
            setEditDeliveryPrice(catData.delivery_price || 0);
            
            // Handle sample tiers potentially being string or object
            let parsedTiers = [];
            if (catData.sample_tiers) {
                if (typeof catData.sample_tiers === 'string') {
                    try { parsedTiers = JSON.parse(catData.sample_tiers); } catch (e) {}
                } else if (Array.isArray(catData.sample_tiers)) {
                    parsedTiers = catData.sample_tiers;
                }
            }
            setEditSampleTiers(parsedTiers);

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
        
        // Fetch available notes for autocomplete
        const fetchNotes = async () => {
            try {
                const res = await fetch("/api/fragrance-notes");
                if (res.ok) {
                    const data = await res.json();
                    setAvailableNotes(data);
                }
            } catch (error) {
                console.error("Error fetching notes for autocomplete:", error);
            }
        };
        fetchNotes();

        // Fetch available categories from main site products
        const fetchCategories = async () => {
            try {
                const res = await fetch("/api/categories");
                if (res.ok) {
                    const data = await res.json();
                    setAvailableCategories(data);
                }
            } catch (error) {
                console.error("Error fetching categories for autocomplete:", error);
            }
        };
        fetchCategories();

        // 🟢 Block mouse wheel from changing number input values
        const handleWheel = (e) => {
            if (document.activeElement.type === 'number') {
                e.preventDefault();
            }
        };
        document.addEventListener('wheel', handleWheel, { passive: false });
        return () => document.removeEventListener('wheel', handleWheel);
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
                    image_url: editImage || null,
                    self_pickup_active: editSelfPickup,
                    delivery_active: editDeliveryActive,
                    delivery_price: Number(editDeliveryPrice),
                    sample_tiers: editSampleTiers
                })
            });

            if (res.ok) {
                toast.success("הגדרות קטלוג עודכנו בהצלחה!");
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
            const body = {
                brand: newItemBrand,
                fragrance_name: newItemFragranceName,
                description: newItemDesc,
                image_url: newItemImage,
                top_notes: newItemTopNotes,
                middle_notes: newItemMiddleNotes,
                base_notes: newItemBaseNotes,
                gender: newItemGender,
                category: newItemCategory,
                prices: prices,
                stock_ml: Number(newItemStockMl) || 0
            };

            const res = await fetch(`/api/user-catalogs/${catalogId}/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
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
                        &rarr; חזרה לקטלוגים שלי
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
                        onClick={handleDeleteCatalog}
                        className="px-4 py-2 rounded-lg text-sm font-bold bg-white text-red-500 border border-red-200 hover:bg-red-50 hover:border-red-300 transition"
                    >
                        מחק קטלוג
                    </button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar">
                <button 
                    onClick={() => setActiveTab('products')} 
                    className={`px-6 py-3 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'products' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                >
                    מוצרים
                </button>
                <button 
                    onClick={() => setActiveTab('settings')} 
                    className={`px-6 py-3 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'settings' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                >
                    הגדרות
                </button>
                <button 
                    onClick={() => setActiveTab('shipping')} 
                    className={`px-6 py-3 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'shipping' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                >
                    משלוחים
                </button>
                <button 
                    onClick={() => setActiveTab('orders')} 
                    className={`px-6 py-3 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'orders' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                >
                    הזמנות
                </button>
            </div>

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-fade-in">
                    <h2 className="text-lg font-bold mb-4 text-emerald-600 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774a1.125 1.125 0 0 1 .12 1.45l-.527.737c-.25.35-.273.806-.108 1.204.165.397.505.71.93.78l.894.15c.542.09.94.56.94 1.109v1.094c0 .55-.398 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.93.78-.164.398-.142.854.108 1.204l.527.738a1.125 1.125 0 0 1-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.273-1.203-.108-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527a1.125 1.125 0 0 1-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15a1.125 1.125 0 0 1-.94-1.11v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.164-.398.142-.854-.108-1.204l-.527-.738a1.125 1.125 0 0 1 .12-1.45l.774-.773a1.125 1.125 0 0 1 1.449-.12l.738.527c.35.25.806.273 1.204.108.397-.165.71-.505.78-.929l.15-.894Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                        הגדרות בסיסיות
                    </h2>
                    <form onSubmit={handleUpdateCatalog} className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <div className="flex items-center text-left h-10" dir="ltr">
                                <span className="bg-gray-100 px-3 h-full flex items-center rounded-l border border-r-0 text-gray-500 text-sm whitespace-nowrap flex-shrink-0">ml-tlv.com/catalog/</span>
                                <input type="text" required value={editSlug} onChange={(e) => setEditSlug(e.target.value)} className="w-full h-full p-2 border rounded-r focus:ring-1 focus:ring-black outline-none text-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">תמונת לוגו / פרופיל החנות</label>
                            
                            <div className="flex bg-gray-100 p-1 rounded-lg mb-3">
                                <button 
                                    type="button"
                                    onClick={() => setEditImageInputType("file")}
                                    className={`flex-1 text-xs py-1.5 rounded-md transition ${editImageInputType === "file" ? 'bg-white shadow-sm font-bold text-black' : 'text-gray-500 hover:text-black'}`}
                                >
                                    העלאה מהמחשב
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setEditImageInputType("url")}
                                    className={`flex-1 text-xs py-1.5 rounded-md transition ${editImageInputType === "url" ? 'bg-white shadow-sm font-bold text-black' : 'text-gray-500 hover:text-black'}`}
                                >
                                    קישור לתמונה
                                </button>
                            </div>

                            <div className="flex flex-col gap-3">
                                {editImageInputType === "file" ? (
                                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 bg-white transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-2 pb-2">
                                            <p className="text-xs text-gray-500"><span className="font-semibold text-black">בחר תמונה מהמחשב</span></p>
                                        </div>
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/png, image/jpeg, image/webp" 
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => setEditImage(reader.result);
                                                    reader.readAsDataURL(file);
                                                }
                                            }} 
                                        />
                                    </label>
                                ) : (
                                    <input 
                                        type="url" 
                                        value={editImage || ""}
                                        onChange={(e) => setEditImage(e.target.value)}
                                        className="w-full p-2 border rounded focus:ring-1 focus:ring-black outline-none text-left text-sm"
                                        dir="ltr"
                                        placeholder="https://..."
                                    />
                                )}

                                {editImage && (
                                    <div className="flex items-center gap-2">
                                        <img src={editImage} alt="Preview" className="w-10 h-10 object-cover rounded border" />
                                        <span className="text-[10px] text-gray-400">תצוגה מקדימה</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
                            <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full p-2 border rounded focus:ring-1 focus:ring-black outline-none resize-none h-20" />
                        </div>

                        <div className="md:col-span-2 text-left pt-4 mt-4 border-t">
                            <button type="submit" className="px-8 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition">שמור הגדרות</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Shipping Tab */}
            {activeTab === 'shipping' && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-fade-in">
                    <form onSubmit={handleUpdateCatalog} className="space-y-8">
                        {/* Shipping & Delivery */}
                        <div>
                            <h2 className="text-lg font-bold mb-4 text-blue-600 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125a1.125 1.125 0 0 0 1.125-1.125V11.06c0-.426-.242-.812-.614-1.026l-1.95-1.123a1.125 1.125 0 0 0-1.084 0l-1.95 1.123a1.125 1.125 0 0 0-.614 1.026v5.216C12.33 17.153 13.044 18 14.162 18H15m-1.41-11.41-1.091-1.091A1.125 1.125 0 0 0 11.5 5.25h-5.25a1.125 1.125 0 0 0-1.125 1.125v3" />
                                </svg>
                                אפשרויות משלוח
                            </h2>
                            <div className="flex flex-col gap-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
                                
                                <label className="flex items-center gap-4 cursor-pointer p-2 hover:bg-white rounded-lg transition">
                                    <input 
                                        type="checkbox" 
                                        checked={editSelfPickup} 
                                        onChange={(e) => setEditSelfPickup(e.target.checked)} 
                                        className="w-6 h-6 text-black border-gray-300 rounded focus:ring-black"
                                    />
                                    <div>
                                        <div className="font-bold text-gray-900">מאפשר איסוף עצמי</div>
                                        <div className="text-xs text-gray-500">הלקוח יכול להגיע לאסוף את ההזמנה ללא עלות.</div>
                                    </div>
                                </label>

                                <div className="border-t border-gray-200 pt-4 mt-2">
                                    <label className="flex items-center gap-4 cursor-pointer p-2 hover:bg-white rounded-lg transition mb-3">
                                        <input 
                                            type="checkbox" 
                                            checked={editDeliveryActive} 
                                            onChange={(e) => setEditDeliveryActive(e.target.checked)} 
                                            className="w-6 h-6 text-black border-gray-300 rounded focus:ring-black"
                                        />
                                        <div>
                                            <div className="font-bold text-gray-900">מציע משלוחים</div>
                                            <div className="text-xs text-gray-500">משלוח עד הבית בעלות קבועה שתבחר.</div>
                                        </div>
                                    </label>
                                    
                                    {editDeliveryActive && (
                                        <div className="pl-12 flex items-center gap-3 mt-2">
                                            <label className="text-sm font-bold text-gray-700">עלות משלוח:</label>
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    value={editDeliveryPrice}
                                                    onChange={(e) => setEditDeliveryPrice(e.target.value)}
                                                    className="w-32 p-3 border rounded-lg focus:ring-1 focus:ring-black outline-none text-sm pr-8"
                                                />
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₪</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Free Samples Tiers */}
                        <div className="border-t pt-8">
                             <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h2 className="text-lg font-bold text-purple-600 flex items-center gap-2">
                                        <span className="text-xl">🧪</span>
                                        הטבות דוגמיות (2ml)
                                    </h2>
                                    <p className="text-xs text-gray-500">הגדר מדרגות רכישה שבהן הלקוח יקבל דוגמיות מתנה.</p>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => setEditSampleTiers([...editSampleTiers, { minAmount: 100, samplesCount: 1, message: "" }])}
                                    className="text-sm font-bold bg-black text-white px-5 py-2 rounded-xl shadow-lg hover:bg-gray-800 transition"
                                >
                                    + הוסף מדרגה
                                </button>
                             </div>
                             
                             <div className="space-y-4">
                                {editSampleTiers.length === 0 ? (
                                    <div className="bg-gray-50 border-2 border-dashed border-gray-100 rounded-2xl p-10 text-center">
                                        <div className="text-4xl mb-3 opacity-20">🎁</div>
                                        <p className="text-gray-400 font-medium">אין כרגע מדרגות הטבה מוגדרות.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {editSampleTiers.map((tier, idx) => (
                                            <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-4 relative group">
                                                <button 
                                                    type="button" 
                                                    onClick={() => setEditSampleTiers(editSampleTiers.filter((_, i) => i !== idx))}
                                                    className="absolute top-2 left-2 md:static text-gray-300 hover:text-red-500 p-2 transition"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                                
                                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">בקנייה מעל</label>
                                                        <div className="relative">
                                                            <input 
                                                                type="number" 
                                                                min="1"
                                                                value={tier.minAmount}
                                                                onChange={(e) => {
                                                                    const newTiers = [...editSampleTiers];
                                                                    newTiers[idx].minAmount = Number(e.target.value);
                                                                    setEditSampleTiers(newTiers);
                                                                }}
                                                                className="w-full p-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-0 transition outline-none font-bold"
                                                            />
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₪</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">מספר דוגמיות</label>
                                                        <input 
                                                            type="number" 
                                                            min="1"
                                                            value={tier.samplesCount}
                                                            onChange={(e) => {
                                                                const newTiers = [...editSampleTiers];
                                                                newTiers[idx].samplesCount = Number(e.target.value);
                                                                setEditSampleTiers(newTiers);
                                                            }}
                                                            className="w-full p-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-0 transition outline-none font-bold"
                                                        />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">הודעה אישית</label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="מזל טוב! מגיע לך מתנה..."
                                                            value={tier.message || ""}
                                                            onChange={(e) => {
                                                                const newTiers = [...editSampleTiers];
                                                                newTiers[idx].message = e.target.value;
                                                                setEditSampleTiers(newTiers);
                                                            }}
                                                            className="w-full p-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-black focus:ring-0 transition outline-none text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                             </div>
                        </div>

                        <div className="text-left pt-6 border-t flex justify-end">
                            <button type="submit" className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl hover:bg-emerald-700 transition transform hover:-translate-y-1 active:scale-95">
                                שמור הגדרות משלוח ודוגמיות
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'products' && (
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
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">שם המותג (באנגלית)</label>
                                    <input type="text" required value={editingItemId ? editItemData.brand : newItemBrand} onChange={(e) => editingItemId ? setEditItemData({...editItemData, brand: e.target.value}) : setNewItemBrand(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="למשל: Tom Ford" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">דגם (באנגלית)</label>
                                    <input type="text" required value={editingItemId ? editItemData.fragrance_name : newItemFragranceName} onChange={(e) => editingItemId ? setEditItemData({...editItemData, fragrance_name: e.target.value}) : setNewItemFragranceName(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" placeholder="למשל: Lost Cherry" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">מגדר</label>
                                    <select required value={editingItemId ? editItemData.gender : newItemGender} onChange={(e) => editingItemId ? setEditItemData({...editItemData, gender: e.target.value}) : setNewItemGender(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none text-sm appearance-none bg-white">
                                        <option value="">בחר מגדר</option>
                                        <option value="Unisex">Unisex</option>
                                        <option value="Men">Men</option>
                                        <option value="Women">Women</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">קטגוריות (לחץ Enter להוספה)</label>
                                    <TagInput
                                        tags={(editingItemId ? editItemData.category : newItemCategory).split(',').map(t => t.trim()).filter(Boolean)}
                                        onChange={(newTags) => editingItemId ? setEditItemData({...editItemData, category: newTags.join(',')}) : setNewItemCategory(newTags.join(','))}
                                        suggestions={availableCategories}
                                        placeholder="הוסף קטגוריה (למשל: יוניסקס)"
                                    />
                                </div>
                            </div>

                            {/* Inventory / Stock */}
                            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                    </svg>
                                    ניהול מלאי (במ"ל)
                                </label>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="number" 
                                        min="0"
                                        placeholder="כמה מ״ל יש בבקבוק?"
                                        value={editingItemId ? editItemData.stock_ml : newItemStockMl}
                                        onChange={(e) => editingItemId ? setEditItemData({...editItemData, stock_ml: e.target.value}) : setNewItemStockMl(e.target.value)}
                                        className="w-full p-2 border rounded focus:ring-2 focus:ring-black outline-none text-sm font-bold"
                                    />
                                    <span className="text-xs text-gray-400 whitespace-nowrap">מ״ל סה״כ</span>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">העגלה תחסום הזמנות שחורגות מכמות זו.</p>
                            </div>

                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">תגיות הבושם (באנגלית)</label>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">תגיות עליונות</label>
                                        <TagInput
                                            tags={(editingItemId ? editItemData.top_notes : newItemTopNotes).split(',').map(t => t.trim()).filter(Boolean)}
                                            onChange={(newTags) => editingItemId ? setEditItemData({...editItemData, top_notes: newTags.join(',')}) : setNewItemTopNotes(newTags.join(','))}
                                            suggestions={availableNotes}
                                            placeholder="למשל: יסמין, ורד..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">תגיות לב (אמצע)</label>
                                        <TagInput
                                            tags={(editingItemId ? editItemData.middle_notes : newItemMiddleNotes).split(',').map(t => t.trim()).filter(Boolean)}
                                            onChange={(newTags) => editingItemId ? setEditItemData({...editItemData, middle_notes: newTags.join(',')}) : setNewItemMiddleNotes(newTags.join(','))}
                                            suggestions={availableNotes}
                                            placeholder="למשל: וניל, עץ..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">תגיות בסיס</label>
                                        <TagInput
                                            tags={(editingItemId ? editItemData.base_notes : newItemBaseNotes).split(',').map(t => t.trim()).filter(Boolean)}
                                            onChange={(newTags) => editingItemId ? setEditItemData({...editItemData, base_notes: newTags.join(',')}) : setNewItemBaseNotes(newTags.join(','))}
                                            suggestions={availableNotes}
                                            placeholder="למשל: מאסק, אמבר..."
                                        />
                                    </div>
                                </div>
                            </div>


                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">גדלים ומחירים (₪)</label>
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
                                                placeholder={`מחיר עבור ${size}`} 
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">מלאי זמין סה"כ (מ"ל)</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={editingItemId ? editItemData.stock_ml : newItemStockMl}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (editingItemId) {
                                                    setEditItemData({ ...editItemData, stock_ml: val });
                                                } else {
                                                    setNewItemStockMl(val);
                                                }
                                            }}
                                            className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-black outline-none text-sm pr-2 text-left" 
                                            placeholder="כמה מ״ל יש לך סה״כ מהבושם הזה?" 
                                            dir="ltr"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">ml</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">המלאי יקטן אוטומטית בכל הזמנה.</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">תמונת מוצר</label>
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
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">תיאור (אנגלית/עברית)</label>
                                <textarea required value={editingItemId ? editItemData.description : newItemDesc} onChange={(e) => editingItemId ? setEditItemData({...editItemData, description: e.target.value}) : setNewItemDesc(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none resize-none h-20 text-sm" placeholder="ספרו לנו עוד על הבושם..." />
                            </div>
                            
                            <button type="submit" disabled={isSubmittingItem} className="w-full py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition shadow disabled:opacity-50">
                                {isSubmittingItem ? 'מעבד...' : (editingItemId ? 'עדכן מוצר' : 'הוסף לקטלוג')}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Products List */}
                <div className="w-full lg:w-2/3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                        <h2 className="text-2xl font-bold">
                            המוצרים בקטלוג ({items.length})
                        </h2>
                        {items.length > 0 && (
                            <div className="flex items-center gap-2 text-sm flex-wrap">
                                {/* Gender Filter */}
                                <select
                                    value={filterGender}
                                    onChange={(e) => { setFilterGender(e.target.value); setCurrentPage(1); }}
                                    className="p-1.5 border rounded-lg text-sm bg-white focus:ring-1 focus:ring-black outline-none"
                                >
                                    <option value="הכל">כל המגדרים</option>
                                    <option value="Unisex">Unisex</option>
                                    <option value="Men">Men</option>
                                    <option value="Women">Women</option>
                                </select>
                                {/* Sort */}
                                <select
                                    value={sortBy}
                                    onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                                    className="p-1.5 border rounded-lg text-sm bg-white focus:ring-1 focus:ring-black outline-none"
                                >
                                    <option value="newest">חדש ביותר</option>
                                    <option value="price_asc">מחיר: נמוך לגבוה</option>
                                    <option value="price_desc">מחיר: גבוה לנמוך</option>
                                    <option value="name_asc">שם א-ת</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {items.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center flex flex-col items-center justify-center">
                            <div className="text-4xl mb-3 opacity-50">🛍️</div>
                            <h3 className="text-lg font-bold text-gray-700 mb-1">הקטלוג שלך ריק</h3>
                            <p className="text-gray-500 text-sm">התחל להוסיף מוצרים משלך בטופס מימין.</p>
                        </div>
                    ) : (() => {
                        // Apply filters
                        let filtered = [...items];
                        if (filterGender !== "הכל") filtered = filtered.filter(i => i.gender === filterGender);
                        
                        // Sort
                        if (sortBy === "price_asc") filtered.sort((a, b) => (Object.values(a.prices||{})[0]||0) - (Object.values(b.prices||{})[0]||0));
                        else if (sortBy === "price_desc") filtered.sort((a, b) => (Object.values(b.prices||{})[0]||0) - (Object.values(a.prices||{})[0]||0));
                        else if (sortBy === "name_asc") filtered.sort((a, b) => (a.name||'').localeCompare(b.name||''));
                        // "newest" is default (array order from DB)

                        // Pagination
                        const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
                        const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

                        return (
                            <>
                                {filtered.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400">
                                        <p>לא נמצאו מוצרים עם הסינון הנוכחי.</p>
                                        <button onClick={() => { setFilterGender("הכל"); setFilterCategory("הכל"); }} className="text-black underline mt-2 text-sm">נקה סינון</button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Results summary */}
                                        <p className="text-sm text-gray-500 mb-4">
                                            מציג {filtered.length} מוצרים {totalPages > 1 ? `(עמוד ${currentPage} מתוך ${totalPages})` : ''}
                                        </p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            {paginated.map(item => {
                                                const sizeEntries = Object.entries(item.prices || {});
                                                return (
                                                    <div key={item.id} className="group border rounded-lg overflow-hidden hover:shadow-xl transition bg-white flex flex-col h-full relative">
                                                        {/* Admin Action Buttons (Top Right) */}
                                                        <div className="absolute top-2 right-2 flex gap-1 z-10 transition-opacity">
                                                            <button 
                                                                onClick={(e) => { e.preventDefault(); handleStartEdit(item); }}
                                                                className="bg-white text-blue-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-blue-50 transition shadow border border-blue-100"
                                                                title="ערוך מוצר"
                                                            >
                                                                ✎
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.preventDefault(); handleDeleteItem(item.id); }}
                                                                className="bg-white text-red-500 w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 transition shadow border border-red-100"
                                                                title="מחק מוצר"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>

                                                        {item.gender && (
                                                            <div className="absolute top-2 left-2 z-10 text-[10px] leading-3 font-bold bg-gray-900 text-white px-2 py-1 rounded shadow-sm text-center uppercase tracking-wide">
                                                                {item.gender}
                                                            </div>
                                                        )}

                                                        <Link href={`/catalog/${catalog.slug}/product/${item.id}`} className="block relative aspect-square bg-white overflow-hidden cursor-pointer p-2">
                                                            {item.image_url ? (
                                                                <img
                                                                    src={item.image_url}
                                                                    alt={item.fragrance_name}
                                                                    className="w-full h-full object-contain group-hover:scale-110 transition duration-700"
                                                                />
                                                            ) : (
                                                                <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-4xl group-hover:scale-105 transition duration-500">
                                                                    🧴
                                                                </div>
                                                            )}
                                                        </Link>

                                                        <div className="p-4 flex-1 flex flex-col">
                                                            <div className="text-xs text-gray-500 mb-1 line-clamp-1">{(item.category || '').split(',')[0]}</div>
                                                            <Link href={`/catalog/${catalog.slug}/product/${item.id}`}>
                                                                <h3 className="font-bold text-sm mb-2 line-clamp-2 min-h-[40px] hover:underline">
                                                                    <span className="mr-1">{item.brand}</span>
                                                                    {item.fragrance_name}
                                                                </h3>
                                                            </Link>

                                                            <div className="mt-auto space-y-2">
                                                                {sizeEntries.length > 0 ? sizeEntries.map(([size, price]) => (
                                                                    <div key={size} className="flex items-center justify-between text-xs text-gray-600">
                                                                        <span>{size.replace(/ml/gi, '').trim()} מ״ל</span>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-bold">{price} ₪</span>
                                                                        </div>
                                                                    </div>
                                                                )) : (
                                                                    <div className="flex items-center justify-between text-xs text-gray-600">
                                                                        <span>1 מ״ל</span>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-bold">{item.price || 0} ₪</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">מלאי זמין</span>
                                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${Number(item.stock_ml) > 10 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                                    {item.stock_ml || 0} מ"ל
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
                                                {currentPage > 1 && (
                                                    <button
                                                        onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                        className="px-4 py-2 border rounded-lg text-sm font-bold hover:bg-gray-50 transition"
                                                    >
                                                        הקודם
                                                    </button>
                                                )}
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                    <button
                                                        key={page}
                                                        onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                        className={`w-10 h-10 rounded-lg font-bold text-sm transition ${page === currentPage ? 'bg-black text-white' : 'border hover:bg-gray-50'}`}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}
                                                {currentPage < totalPages && (
                                                    <button
                                                        onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                        className="px-4 py-2 border rounded-lg text-sm font-bold hover:bg-gray-50 transition"
                                                    >
                                                        הבא
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        );
                    })()}
                </div>
            </div>
            )}

            {/* Orders Tab Placeholder */}
            {activeTab === 'orders' && (
                <OrdersTab catalogId={catalogId} />
            )}


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
