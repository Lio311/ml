"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

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
             // We can reuse the same endpoint but as an admin we'd need an admin-specific delete or modify the user one to allow admin override.
             // Given the scope, let's create a quick API call to a new admin delete route if needed, or we can just instruct we'll need an admin delete route.
             // For now, let's build the UI and add the admin delete route next.
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
                                <tr key={catalog.id} className="border-b hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-mono text-xs text-gray-500 text-center">{catalog.id}</td>
                                    <td className="p-4 font-bold text-center">{catalog.name}</td>
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
                                    <td className="p-4 text-center flex items-center justify-center gap-2">
                                        <Link 
                                            href={`/admin/catalogs/${catalog.id}`}
                                            className="text-blue-500 hover:bg-blue-50 px-3 py-1 rounded transition text-sm font-bold"
                                        >
                                            נהל מוצרים
                                        </Link>
                                        <button 
                                            onClick={() => handleDelete(catalog.id)}
                                            className="text-red-500 hover:bg-red-50 px-3 py-1 rounded transition text-sm font-bold"
                                        >
                                            מחק
                                        </button>
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
