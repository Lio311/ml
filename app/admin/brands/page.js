"use client";

import { useState, useEffect } from "react";
import AdminFilterBar from "@/app/components/admin/AdminFilterBar";
import { useUser } from "@clerk/nextjs";


export default function AdminBrandsPage() {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editUrl, setEditUrl] = useState("");
    const { user } = useUser();
    const canEdit = user?.publicMetadata?.role === 'admin' || user?.emailAddresses[0]?.emailAddress === 'lior31197@gmail.com';


    useEffect(() => {
        fetchBrands();
    }, []);

    async function fetchBrands() {
        try {
            const res = await fetch('/api/admin/brands');
            const data = await res.json();
            setBrands(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const startEdit = (brand) => {
        setEditingId(brand.id);
        setEditUrl(brand.logo_url || "");
    };

    const handleSave = async (id) => {
        try {
            const res = await fetch('/api/admin/brands', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, logo_url: editUrl })
            });

            if (res.ok) {
                setBrands(brands.map(b => b.id === id ? { ...b, logo_url: editUrl } : b));
                setEditingId(null);
            } else {
                alert("Failed to save");
            }
        } catch (error) {
            alert("Error saving");
        }
    };

    const [selectedLetter, setSelectedLetter] = useState(null);
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const filteredBrands = selectedLetter
        ? brands.filter(brand => brand.name.trim().toLowerCase().startsWith(selectedLetter.toLowerCase()))
        : brands;

    // Pagination Logic
    const totalPages = Math.ceil(filteredBrands.length / ITEMS_PER_PAGE);
    const paginatedBrands = filteredBrands.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">ניהול מותגים</h1>
            <p className="mb-4 text-gray-600">הזן קישורים ללוגואים של המותגים השונים. הלוגואים יוצגו בקרוסלה ובדפי המוצרים.</p>

            {/* A-Z Filter Controls */}
            <AdminFilterBar
                selectedLetter={selectedLetter}
                onSelect={(letter) => { setSelectedLetter(letter); setPage(1); }}
            />

            <div className="bg-white rounded-lg shadow border overflow-hidden mb-6">
                <table className="w-full text-center border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-4 border-b text-center">מותג</th>
                            <th className="p-4 border-b text-center">לוגו (תצוגה)</th>
                            <th className="p-4 border-b text-center">קישור ללוגו</th>
                            <th className="p-4 border-b text-center">פעולות</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedBrands.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="p-8 text-gray-500">לא נמצאו מותגים {selectedLetter ? `באות ${selectedLetter}` : ''}</td>
                            </tr>
                        ) : (
                            paginatedBrands.map(brand => (
                                <tr key={brand.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-bold text-center">{brand.name}</td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center">
                                            {brand.logo_url ? (
                                                <img src={brand.logo_url} alt={brand.name} className="h-10 object-contain" />
                                            ) : (
                                                <span className="text-gray-300 text-xs">אין לוגו</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center">
                                            {editingId === brand.id ? (
                                                <input
                                                    value={editUrl}
                                                    onChange={e => setEditUrl(e.target.value)}
                                                    className="border p-2 rounded w-full text-sm text-center"
                                                    dir="ltr"
                                                    placeholder="https://..."
                                                />
                                            ) : (
                                                <div className="text-gray-500 text-xs truncate max-w-[200px] mx-auto" dir="ltr">
                                                    {brand.logo_url}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            {editingId === brand.id ? (
                                                <>
                                                    <button onClick={() => handleSave(brand.id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold">שמור</button>
                                                    <button onClick={() => setEditingId(null)} className="bg-gray-300 text-black px-3 py-1 rounded text-sm">ביטול</button>
                                                </>
                                            ) : (
                                                canEdit ? (
                                                    <button
                                                        onClick={() => startEdit(brand)}
                                                        className="text-blue-500 hover:bg-blue-50 p-2 rounded transition"
                                                        title="ערוך"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                        </svg>
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">צפייה בלבד</span>
                                                )
                                            )}
                                        </div>
                                    </td>

                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mb-12">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 transition"
                    >
                        הקודם
                    </button>
                    <span className="text-sm font-bold text-gray-600">
                        עמוד {page} מתוך {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 transition"
                    >
                        הבא
                    </button>
                </div>
            )}
        </div>
    );
}
