"use client";

import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";

export default function AdminCatalogsClient() {
    const [catalogs, setCatalogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCatalogs = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/catalogs");
            if (res.ok) {
                const data = await res.json();
                setCatalogs(data);
            } else {
                toast.error("שגיאה בטעינת קטלוגים");
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

    const handleDelete = async (id) => {
        if (!confirm("האם אתה בטוח שברצונך למחוק קטלוג זה ואת כל מוצריו? (פעולה זו בלתי הפיכה)")) return;

        try {
             const res = await fetch(`/api/admin/catalogs/${id}`, { method: 'DELETE' });
             if (res.ok) {
                 toast.success("קטלוג נמחק בהצלחה");
                 setCatalogs(catalogs.filter(c => c.id !== id));
             } else {
                 toast.error("שגיאה במחיקה - ייתכן שאין הרשאה מתאימה");
             }
        } catch (error) {
             console.error(error);
             toast.error("שגיאת תקשורת");
        }
    };

    const handleToggleVisibility = async (catalog) => {
        const newHiddenStatus = !catalog.is_hidden;
        try {
            const res = await fetch(`/api/admin/catalogs/${catalog.id}/toggle-visibility`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_hidden: newHiddenStatus })
            });

            if (res.ok) {
                toast.success(newHiddenStatus ? "הקטלוג הוסתר" : "הקטלוג כעת גלוי");
                setCatalogs(catalogs.map(c => 
                    c.id === catalog.id ? { ...c, is_hidden: newHiddenStatus } : c
                ));
            } else {
                toast.error("שגיאה בעדכון הסטטוס");
            }
        } catch (error) {
            console.error(error);
            toast.error("שגיאת תקשורת");
        }
    };

    if (isLoading) {
        return <div className="text-center py-10 animate-pulse">טוען נתונים...</div>;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100 border-b">
                            <th className="p-4 font-bold text-gray-700 text-center">מזהה</th>
                            <th className="p-4 font-bold text-gray-700 text-center">שם הקטלוג / חנות</th>
                            <th className="p-4 font-bold text-gray-700 text-center">מספר פריטים</th>
                            <th className="p-4 font-bold text-gray-700 text-center">אימייל התקשרות</th>
                            <th className="p-4 font-bold text-gray-700 text-center">קישור</th>
                            <th className="p-4 font-bold text-gray-700 text-center">פעולות</th>
                        </tr>
                    </thead>
                    <tbody>
                        {catalogs.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-gray-500">לא נמצאו קטלוגים שיצרו משתמשים.</td>
                            </tr>
                        ) : (
                            catalogs.map((catalog) => (
                                <tr key={catalog.id} className={`border-b hover:bg-gray-50 transition-colors ${catalog.is_hidden ? 'opacity-70 bg-gray-50/50' : ''}`}>
                                    <td className="p-4 font-mono text-xs text-gray-500 text-center">{catalog.id}</td>
                                    <td className="p-4 font-bold text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {catalog.name}
                                            {catalog.is_hidden && (
                                                <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold">מוסתר</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">
                                            {catalog.total_items}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center" dir="ltr">{catalog.contact_email}</td>
                                    <td className="p-4 text-center">
                                        <a 
                                            href={`/catalog/${catalog.slug}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:underline text-sm font-mono flex items-center justify-center gap-1"
                                            dir="ltr"
                                        >
                                            /{catalog.slug}
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                            </svg>
                                        </a>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => handleToggleVisibility(catalog)}
                                                className={`p-2 rounded-full transition-colors ${catalog.is_hidden ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-green-500 bg-green-50 hover:bg-green-100'}`}
                                                title={catalog.is_hidden ? "הצג קטלוג" : "הסתר קטלוג"}
                                            >
                                                <Eye size={18} />
                                            </button>
                                            
                                            <Link 
                                                href={`/admin/catalogs/${catalog.id}`}
                                                className="p-2 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
                                                title="נהל מוצרים"
                                            >
                                                <Pencil size={18} />
                                            </Link>
                                            
                                            <button 
                                                onClick={() => handleDelete(catalog.id)}
                                                className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-full transition-colors"
                                                title="מחק קטלוג"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
