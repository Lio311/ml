"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function MyCatalogsClient() {
    const [catalogs, setCatalogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    
    // Form State
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [email, setEmail] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    const router = useRouter();

    const fetchCatalogs = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/user-catalogs");
            if (res.ok) {
                const data = await res.json();
                setCatalogs(data);
            } else {
                toast.error("שגיאה בטעינת הקטלוגים");
            }
        } catch (error) {
            console.error(error);
            toast.error("שגיאה בטעינת הקטלוגים");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCatalogs();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setIsCreating(true);

        try {
            const res = await fetch("/api/user-catalogs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                    description,
                    contact_email: email,
                    image_url: imageUrl || null
                })
            });

            if (res.ok) {
                toast.success("קטלוג נוצר בהצלחה!");
                setName("");
                setSlug("");
                setDescription("");
                setEmail("");
                setImageUrl("");
                fetchCatalogs(); // Refresh the list
            } else {
                const data = await res.json();
                toast.error(data.error || "שגיאה ביצירת הקטלוג");
            }
        } catch (error) {
            console.error(error);
            toast.error("שגיאה בתקשורת מול השרת");
        } finally {
            setIsCreating(false);
        }
    };

    if (isLoading) {
        return <div className="text-center py-20 text-xl animate-pulse">טוען קטלוגים...</div>;
    }

    return (
        <div className="flex flex-col lg:flex-row gap-12">
            
            {/* Left: Create New Catalog Form */}
            <div className="w-full lg:w-1/3">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 sticky top-24">
                    <h2 className="text-xl font-bold mb-6 text-gray-800">צור קטלוג חדש ✨</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">שם הקטלוג (יוצג למבקרים)</label>
                            <input 
                                type="text" 
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none"
                                placeholder="למשל: הבשמים של דני"
                            />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">קישור אישי (אנגלית ומספרים בלבד)</label>
                            <div className="flex items-center text-left" dir="ltr">
                                <span className="bg-gray-100 p-3 rounded-l-lg border border-r-0 text-gray-500 text-sm">mltlv.io/catalog/</span>
                                <input 
                                    type="text" 
                                    required
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    className="w-full p-3 border rounded-r-lg focus:ring-2 focus:ring-black outline-none"
                                    placeholder="danny-shop"
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1" dir="rtl">כך ייראה הקישור שתשתף עם הלקוחות שלך.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">אימייל לקבלת הזמנות</label>
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none"
                                placeholder="your@email.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">תמונת לוגו / פרופיל החנות (שורת URL)</label>
                            <input 
                                type="url" 
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none text-left"
                                dir="ltr"
                                placeholder="https://..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">תיאור קצר (אופציונלי)</label>
                            <textarea 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none resize-none h-24"
                                placeholder="ספר קצת על הקטלוג שלך..."
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isCreating}
                            className="w-full py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition disabled:opacity-50"
                        >
                            {isCreating ? 'יוצר...' : 'צור קטלוג'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Right: List of Catalogs */}
            <div className="w-full lg:w-2/3">
                {catalogs.length === 0 ? (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-12 text-center h-full flex flex-col items-center justify-center">
                        <div className="text-5xl mb-4">🏪</div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">אין לך עדיין קטלוגים</h3>
                        <p className="text-gray-500 max-w-sm">צור את הקטלוג הראשון שלך באמצעות הטופס והתחל למכור מוצרים לבחירתך!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {catalogs.map((catalog) => (
                            <div key={catalog.id} className="bg-white p-6 rounded-xl shadow-md border hover:border-black transition-all flex flex-col h-full relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-gray-400 to-black"></div>
                                <div className="flex items-center gap-4 mb-4">
                                    {catalog.image_url ? (
                                        <div className="w-12 h-12 rounded-full overflow-hidden border bg-gray-50 flex-shrink-0">
                                            <img src={catalog.image_url} alt={catalog.name} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-12 h-12 rounded-full border bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">
                                            🏪
                                        </div>
                                    )}
                                    <h3 className="text-xl font-bold">{catalog.name}</h3>
                                </div>
                                <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-grow">
                                    {catalog.description || "ללא תיאור"}
                                </p>
                                
                                <div className="bg-gray-50 p-3 rounded-lg mb-4 text-xs font-mono text-left break-all border group-hover:bg-gray-100 transition" dir="ltr">
                                    /catalog/{catalog.slug}
                                </div>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t">
                                    <div className="text-xs text-gray-400">
                                        נוצר ב: {new Date(catalog.created_at).toLocaleDateString('he-IL')}
                                    </div>
                                    <Link href={`/my-catalogs/${catalog.id}`} className="px-5 py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 transition">
                                        ניהול קטלוג
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}
