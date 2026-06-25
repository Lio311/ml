"use client";

import { useState, useEffect } from "react";
import AdminFilterBar from "@/app/components/admin/AdminFilterBar";
import { useUser } from "@clerk/nextjs";
import toast from 'react-hot-toast';
import CustomDropdown from '../../components/ui/CustomDropdown';


export default function DictionaryManagement() {
    // Force rebuild: Fix toast import
    const [mappings, setMappings] = useState([]);
    const [page, setPage] = useState(1);
    const [filterLetter, setFilterLetter] = useState(null);
    const ITEMS_PER_PAGE = 5;
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ hebrew: "", english: "", type: "general" });
    const [editingId, setEditingId] = useState(null);
    const [status, setStatus] = useState("");
    const { user } = useUser();
    const canEdit = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'viewer' || user?.emailAddresses[0]?.emailAddress === process.env.ADMIN_EMAIL;


    useEffect(() => {
        fetchMappings();
    }, []);

    const fetchMappings = async () => {
        try {
            const res = await fetch("/api/admin/dictionary");
            if (res.ok) {
                const data = await res.json();
                // Sort alphabetically by English term
                data.sort((a, b) => a.english_term.localeCompare(b.english_term));
                setMappings(data);
            }
        } catch (error) {
            console.error("Failed to fetch mappings", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.hebrew || !formData.english) return;

        setStatus("saving");
        try {
            const method = editingId ? "PUT" : "POST";
            const body = editingId ? { ...formData, id: editingId } : formData;

            const res = await fetch("/api/admin/dictionary", {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setStatus("success");
                setFormData({ hebrew: "", english: "", type: "general" });
                setEditingId(null);
                fetchMappings();
            } else {
                setStatus("error");
            }
        } catch (error) {
            setStatus("error");
        }
    };

    const handleEdit = (item) => {
        setFormData({ hebrew: item.hebrew_term, english: item.english_term, type: item.type });
        setEditingId(item.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setFormData({ hebrew: "", english: "", type: "general" });
        setEditingId(null);
        setStatus("");
    };

    const handleDelete = (id) => {
        toast((t) => (
            <div className="flex flex-col gap-2">
                <p className="font-medium text-sm">האם אתה בטוח שברצונך למחוק מונח זה?</p>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            deleteTerm(id);
                        }}
                        className="bg-red-600 text-white text-xs px-3 py-1.5 rounded hover:bg-red-700 transition"
                    >
                        כן, מחק
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded hover:bg-gray-200 transition border"
                    >
                        ביטול
                    </button>
                </div>
            </div>
        ), { duration: 5000, position: 'top-center' });
    };

    const deleteTerm = async (id) => {
        try {
            const res = await fetch(`/api/admin/dictionary?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('נמחק בהצלחה');
                fetchMappings();
            } else {
                toast.error('שגיאה במחיקה');
            }
        } catch (error) {
            toast.error('שגיאה בתקשורת');
        }
    };



    // Filter Logic
    const filteredMappings = filterLetter
        ? mappings.filter(m => m.english_term.trim().toUpperCase().startsWith(filterLetter))
        : mappings;

    // Pagination Logic
    const totalPages = Math.ceil(filteredMappings.length / ITEMS_PER_PAGE);
    const paginatedMappings = filteredMappings.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    return (
        <div className="max-w-7xl mx-auto p-6 text-right" dir="rtl">
            <h1 className="text-3xl font-bold mb-8 text-gray-900">ניהול מילון חיפוש (עברית-אנגלית)</h1>

            {/* Add New Form */}
            {canEdit && (
                <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-100">
                    <h2 className="text-xl font-bold mb-4">{editingId ? "ערוך מונח קיים" : "הוסף תרגום חדש"}</h2>
                    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full text-right">
                            <label className="block text-sm font-bold text-gray-700 mb-1">מונח בעברית (מה מחפשים)</label>
                            <input
                                type="text"
                                value={formData.hebrew}
                                onChange={(e) => setFormData({ ...formData, hebrew: e.target.value })}
                                className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                placeholder="לדוגמה: שאנל"
                                dir="rtl"
                            />
                        </div>
                        <div className="flex-1 w-full text-right">
                            <label className="block text-sm font-bold text-gray-700 mb-1">מונח באנגלית (מה מחפשים ב-DB)</label>
                            <input
                                type="text"
                                value={formData.english}
                                onChange={(e) => setFormData({ ...formData, english: e.target.value })}
                                className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                placeholder="Example: Chanel"
                                dir="ltr"
                            />
                        </div>
                        <div className="w-full md:w-40 text-right">
                            <label className="block text-sm font-bold text-gray-700 mb-1">סוג</label>
                            <CustomDropdown
                                options={[
                                    { value: 'general', label: 'כללי' },
                                    { value: 'brand', label: 'מותג' },
                                    { value: 'product', label: 'מוצר' },
                                ]}
                                value={formData.type}
                                onChange={(v) => setFormData({ ...formData, type: v })}
                                fullWidth
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl hover:bg-gray-200 transition font-bold"
                                >
                                    ביטול
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={status === "saving"}
                                className="bg-black text-white px-8 py-2.5 rounded-xl hover:bg-gray-800 transition disabled:opacity-50 font-bold flex-1 md:flex-none shadow-md"
                            >
                                {status === "saving" ? "שומר..." : (editingId ? "עדכן" : "הוסף")}
                            </button>
                        </div>
                    </form>
                    {status === "success" && <p className="text-green-600 mt-2 text-sm font-bold">נשמר בהצלחה!</p>}
                    {status === "error" && <p className="text-red-600 mt-2 text-sm font-bold">שגיאה בשמירה (אולי המונח קיים?)</p>}
                </div>
            )}


            {/* A-Z Filters */}
            <AdminFilterBar
                selectedLetter={filterLetter}
                onSelect={(letter) => { setFilterLetter(letter); setPage(1); }}
            />

            {/* Content Container */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-center border-collapse">
                        <thead className="bg-gray-50 border-b text-gray-500 text-sm">
                            <tr>
                                <th className="p-4 font-semibold text-center">עברית</th>
                                <th className="p-4 font-semibold text-center">אנגלית</th>
                                <th className="p-4 font-semibold text-center">סוג</th>
                                <th className="p-4 font-semibold text-center">תאריך הוספה</th>
                                <th className="p-4 font-semibold text-center">פעולות</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-400">טוען נתונים...</td></tr>
                            ) : paginatedMappings.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-400">
                                    {filterLetter ? `אין תוצאות באות ${filterLetter}` : 'אין נתונים במילון.'}
                                </td></tr>
                            ) : (
                                paginatedMappings.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 text-center transition-colors">
                                        <td className="p-4 font-bold text-gray-900">{item.hebrew_term}</td>
                                        <td className="p-4 text-gray-600" dir="ltr">{item.english_term}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${item.type === 'brand' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                item.type === 'product' ? 'bg-green-50 text-green-700 border-green-100' :
                                                    'bg-gray-50 text-gray-700 border-gray-100'
                                                }`}>
                                                {item.type === 'brand' ? 'מותג' : item.type === 'product' ? 'מוצר' : 'כללי'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-400">
                                            {new Date(item.created_at).toLocaleDateString('he-IL')}
                                        </td>
                                        <td className="p-4 flex gap-2 justify-center">
                                            {canEdit ? (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"
                                                        title="ערוך"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                                                        title="מחק"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                        </svg>
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-gray-400 text-[10px] font-bold uppercase">Read Only</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View Card Layout */}
                <div className="md:hidden divide-y divide-gray-100">
                    {loading ? (
                        <div className="p-8 text-center text-gray-400 text-sm">טוען נתונים...</div>
                    ) : paginatedMappings.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            {filterLetter ? `אין תוצאות באות ${filterLetter}` : 'אין נתונים במילון.'}
                        </div>
                    ) : (
                        paginatedMappings.map((item) => (
                            <div key={item.id} className="p-5 bg-white space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="font-bold text-gray-900 text-lg">{item.hebrew_term}</div>
                                        <div className="text-sm text-gray-500 font-medium" dir="ltr">{item.english_term}</div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${item.type === 'brand' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                        item.type === 'product' ? 'bg-green-50 text-green-700 border-green-100' :
                                            'bg-gray-50 text-gray-700 border-gray-100'
                                        }`}>
                                        {item.type === 'brand' ? 'מותג' : item.type === 'product' ? 'מוצר' : 'כללי'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                    <div className="text-[10px] text-gray-400 font-bold uppercase">
                                        נוסף ב: {new Date(item.created_at).toLocaleDateString('he-IL')}
                                    </div>
                                    <div className="flex gap-2">
                                        {canEdit && (
                                            <>
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="bg-blue-50 text-blue-600 p-2.5 rounded-xl active:scale-90 transition border border-blue-100"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="bg-red-50 text-red-600 p-2.5 rounded-xl active:scale-90 transition border border-red-100"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                    </svg>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mb-12">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 border rounded-xl hover:bg-gray-100 disabled:opacity-50 transition"
                    >
                        הקודם
                    </button>
                    <span className="text-sm text-gray-600">
                        עמוד {page} מתוך {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 border rounded-xl hover:bg-gray-100 disabled:opacity-50 transition"
                    >
                        הבא
                    </button>
                </div>
            )}
        </div>
    );
}
