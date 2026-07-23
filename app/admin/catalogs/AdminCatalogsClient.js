"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Pencil, Trash2, Eye, EyeOff, AlertTriangle, Check, X } from "lucide-react";

export default function AdminCatalogsClient() {
    const [catalogs, setCatalogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [enableCatalogs, setEnableCatalogs] = useState(true);

    const fetchCatalogs = async () => {
        setIsLoading(true);
        try {
            const [catalogsRes, settingsRes] = await Promise.all([
                fetch("/api/admin/catalogs"),
                fetch("/api/admin/settings")
            ]);
            
            if (catalogsRes.ok) {
                const data = await catalogsRes.json();
                setCatalogs(data);
            } else {
                toast.error("שגיאה בטעינת קטלוגים");
            }

            if (settingsRes.ok) {
                const settingsData = await settingsRes.json();
                if (settingsData.features && settingsData.features.enable_personal_catalogs !== undefined) {
                    setEnableCatalogs(settingsData.features.enable_personal_catalogs);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("שגיאה בטעינת הנתונים");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCatalogs();
    }, []);

    const handleDelete = (id) => {
        toast.custom((t) => (
            <div
                className={`${
                    t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-full bg-white shadow-2xl rounded-[2rem] pointer-events-auto flex flex-col p-6 border-2 border-red-50`}
                dir="rtl"
            >
                <div className="flex items-center gap-4 mb-5">
                    <div className="bg-red-50 p-3 rounded-2xl">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-gray-900 font-black text-lg">מחיקת קטלוג לצמיתות</h3>
                        <p className="text-gray-500 text-sm leading-relaxed mt-0.5">
                            האם אתה בטוח שברצונך למחוק קטלוג זה וכל מוצריו? פעולה זו בלתי הפיכה.
                        </p>
                    </div>
                </div>
                
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            executeDelete(id);
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-red-200"
                    >
                        <Check className="w-4 h-4" />
                        כן, מחק הכל
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 border border-gray-200"
                    >
                        <X className="w-4 h-4" />
                        ביטול
                    </button>
                </div>
            </div>
        ), { duration: Infinity, position: 'top-center' });
    };

    const executeDelete = async (id) => {

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
    const handleToggleGlobalCatalogs = async (checked) => {
        setEnableCatalogs(checked);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    features: { enable_personal_catalogs: checked }
                })
            });
            if (res.ok) {
                toast.success(checked ? "הקטלוגים האישיים פעילים" : "הקטלוגים האישיים הוסתרו מהאתר");
            } else {
                toast.error("שגיאה בעדכון הגדרות");
                setEnableCatalogs(!checked);
            }
        } catch (error) {
            console.error(error);
            toast.error("שגיאת תקשורת");
            setEnableCatalogs(!checked);
        }
    };

    if (isLoading) {
        return <div className="text-center py-10 animate-pulse">טוען נתונים...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">הגדרות קטלוגים</h2>
                    <p className="text-gray-500 text-sm mt-1">הפעל או כבה את הופעת הקטלוגים האישיים בתפריט העליון ובפוטר של האתר</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer" dir="ltr">
                    <input 
                        type="checkbox" 
                        value="" 
                        className="sr-only peer" 
                        checked={enableCatalogs}
                        onChange={(e) => handleToggleGlobalCatalogs(e.target.checked)}
                    />
                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                </label>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b text-gray-500 text-sm">
                            <th className="p-4 font-bold text-center">מזהה</th>
                            <th className="p-4 font-bold text-center">שם הקטלוג / חנות</th>
                            <th className="p-4 font-bold text-center">מספר פריטים</th>
                            <th className="p-4 font-bold text-center">אימייל התקשרות</th>
                            <th className="p-4 font-bold text-center">קישור</th>
                            <th className="p-4 font-bold text-center">פעולות</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {catalogs.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-gray-400">לא נמצאו קטלוגים שיצרו משתמשים.</td>
                            </tr>
                        ) : (
                            catalogs.map((catalog) => (
                                <tr key={catalog.id} className={`hover:bg-gray-50/50 transition-colors ${catalog.is_hidden ? 'opacity-70 bg-gray-50/20' : ''}`}>
                                    <td className="p-4 font-mono text-[10px] text-gray-400 text-center">{catalog.id}</td>
                                    <td className="p-4 font-bold text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="text-gray-900">{catalog.name}</span>
                                            {catalog.is_hidden && (
                                                <span className="bg-red-50 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold border border-red-100 uppercase tracking-tighter">מוסתר</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="inline-block bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-blue-100">
                                            {catalog.total_items}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center text-gray-600 text-sm" dir="ltr">{catalog.contact_email}</td>
                                    <td className="p-4 text-center">
                                        <a 
                                            href={`/catalog/${catalog.slug}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 hover:underline text-[13px] font-mono flex items-center justify-center gap-1.5 transition-colors"
                                            dir="ltr"
                                        >
                                            /{catalog.slug}
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                            </svg>
                                        </a>
                                    </td>
                                    <td className="p-4 text-center whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleToggleVisibility(catalog)}
                                                className={`p-2 rounded-xl transition-all border ${catalog.is_hidden ? 'text-red-600 bg-red-50 border-red-100 hover:bg-red-100' : 'text-green-600 bg-green-50 border-green-100 hover:bg-green-100'}`}
                                                title={catalog.is_hidden ? "הצג קטלוג" : "הסתר קטלוג"}
                                            >
                                                {catalog.is_hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                            
                                            <Link 
                                                href={`/admin/catalogs/${catalog.id}`}
                                                className="p-2 text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100 rounded-xl transition-all"
                                                title="נהל מוצרים"
                                            >
                                                <Pencil size={16} />
                                            </Link>
                                            
                                            <button 
                                                onClick={() => handleDelete(catalog.id)}
                                                className="p-2 text-red-600 bg-red-50 border-red-100 hover:bg-red-100 rounded-xl transition-all"
                                                title="מחק קטלוג"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile View Card Layout */}
            <div className="md:hidden divide-y divide-gray-100">
                {catalogs.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">לא נמצאו קטלוגים.</div>
                ) : (
                    catalogs.map((catalog) => (
                        <div key={catalog.id} className={`p-5 bg-white space-y-4 ${catalog.is_hidden ? 'opacity-80' : ''}`}>
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="font-bold text-gray-900 text-lg">{catalog.name}</div>
                                        {catalog.is_hidden && (
                                            <span className="bg-red-50 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold border border-red-100 uppercase tracking-tighter">מוסתר</span>
                                        )}
                                    </div>
                                    <div className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">ID: {catalog.id}</div>
                                </div>
                                <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-100 shadow-sm">
                                    {catalog.total_items} פריטים
                                </span>
                            </div>

                            <div className="space-y-3 pt-1">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">אימייל:</span>
                                    <span className="text-sm font-medium text-gray-700" dir="ltr">{catalog.contact_email}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">קישור:</span>
                                    <a 
                                        href={`/catalog/${catalog.slug}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 font-mono text-sm flex items-center gap-1 font-bold"
                                        dir="ltr"
                                    >
                                        /{catalog.slug}
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                        </svg>
                                    </a>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-gray-50 items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-300 uppercase">פעולות ניהול</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleToggleVisibility(catalog)}
                                        className={`p-3 rounded-xl active:scale-90 transition-all border shadow-sm ${catalog.is_hidden ? 'text-red-600 bg-red-50 border-red-100' : 'text-green-600 bg-green-50 border-green-100'}`}
                                    >
                                        {catalog.is_hidden ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                    
                                    <Link 
                                        href={`/admin/catalogs/${catalog.id}`}
                                        className="p-3 text-blue-600 bg-blue-50 border-blue-100 rounded-xl shadow-sm active:scale-90 transition-all"
                                    >
                                        <Pencil size={18} />
                                    </Link>
                                    
                                    <button 
                                        onClick={() => handleDelete(catalog.id)}
                                        className="p-3 text-red-600 bg-red-50 border-red-100 rounded-xl shadow-sm active:scale-90 transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
        </div>
    );
}
