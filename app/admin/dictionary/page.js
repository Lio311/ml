"use client";

import { useState, useEffect } from "react";

export default function DictionaryManagement() {
    const [mappings, setMappings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ hebrew: "", english: "", type: "general" });
    const [status, setStatus] = useState("");

    useEffect(() => {
        fetchMappings();
    }, []);

    const fetchMappings = async () => {
        try {
            const res = await fetch("/api/admin/dictionary");
            if (res.ok) {
                const data = await res.json();
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
            const res = await fetch("/api/admin/dictionary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setStatus("success");
                setFormData({ hebrew: "", english: "", type: "general" });
                fetchMappings();
            } else {
                setStatus("error");
            }
        } catch (error) {
            setStatus("error");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("האם אתה בטוח שברצונך למחוק מונח זה?")) return;

        try {
            const res = await fetch("/api/admin/dictionary", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (res.ok) {
                fetchMappings();
            }
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">ניהול מילון חיפוש (עברית-אנגלית)</h1>

            {/* Add New Form */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-100">
                <h2 className="text-xl font-bold mb-4">הוסף תרגום חדש</h2>
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">מונח בעברית (מה מחפשים)</label>
                        <input
                            type="text"
                            value={formData.hebrew}
                            onChange={(e) => setFormData({ ...formData, hebrew: e.target.value })}
                            className="w-full border rounded p-2 focus:ring-2 focus:ring-black outline-none"
                            placeholder="לדוגמה: שאנל"
                            dir="rtl"
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">מונח באנגלית (מה מחפשים ב-DB)</label>
                        <input
                            type="text"
                            value={formData.english}
                            onChange={(e) => setFormData({ ...formData, english: e.target.value })}
                            className="w-full border rounded p-2 focus:ring-2 focus:ring-black outline-none"
                            placeholder="Example: Chanel"
                            dir="ltr"
                        />
                    </div>
                    <div className="w-full md:w-32">
                        <label className="block text-sm font-medium text-gray-700 mb-1">סוג</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full border rounded p-2"
                        >
                            <option value="general">כללי</option>
                            <option value="brand">מותג</option>
                            <option value="product">מוצר</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={status === "saving"}
                        className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition disabled:opacity-50 h-10"
                    >
                        {status === "saving" ? "שומר..." : "הוסף"}
                    </button>
                </form>
                {status === "success" && <p className="text-green-600 mt-2 text-sm">נשמר בהצלחה!</p>}
                {status === "error" && <p className="text-red-600 mt-2 text-sm">שגיאה בשמירה (אולי המונח קיים?)</p>}
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">עברית</th>
                            <th className="p-4 font-semibold text-gray-600">אנגלית</th>
                            <th className="p-4 font-semibold text-gray-600">סוג</th>
                            <th className="p-4 font-semibold text-gray-600">תאריך הוספה</th>
                            <th className="p-4 font-semibold text-gray-600">פעולות</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-500">טוען נתונים...</td></tr>
                        ) : mappings.length === 0 ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-500">אין נתונים במילון.</td></tr>
                        ) : (
                            mappings.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-bold">{item.hebrew_term}</td>
                                    <td className="p-4" dir="ltr">{item.english_term}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${item.type === 'brand' ? 'bg-blue-100 text-blue-800' :
                                                item.type === 'product' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {item.type === 'brand' ? 'מותג' : item.type === 'product' ? 'מוצר' : 'כללי'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">
                                        {new Date(item.created_at).toLocaleDateString('he-IL')}
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition"
                                            title="מחק"
                                        >
                                            🗑️
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
