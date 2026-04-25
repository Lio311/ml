"use client";

import { useState, useEffect } from "react";
import Image from "@/app/components/CImage";
import AdminFilterBar from "@/app/components/admin/AdminFilterBar";
import { useUser } from "@clerk/nextjs";
import toast from 'react-hot-toast';


export default function AdminBrandsPage() {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editUrl, setEditUrl] = useState("");
    const { user } = useUser();
    const canEdit = user?.publicMetadata?.role === 'admin' || user?.emailAddresses[0]?.emailAddress === process.env.ADMIN_EMAIL;


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
                toast.error("Failed to save");
            }
        } catch (error) {
            toast.error("Error saving");
        }
    };

    const [selectedLetter, setSelectedLetter] = useState(null);
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 7;

    const filteredBrands = selectedLetter
        ? brands.filter(brand => 
            brand.name.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().startsWith(selectedLetter.toLowerCase())
          )
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-center border-collapse">
                        <thead className="bg-gray-50 text-gray-500 text-sm">
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
                                    <tr key={brand.id} className="border-b hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-bold text-center">{brand.name}</td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center relative h-10 w-24">
                                                {brand.logo_url ? (
                                                    <Image src={brand.logo_url} alt={brand.name} fill className="object-contain" sizes="96px" />
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
                                                        className="border p-2 rounded-lg w-full text-sm text-center focus:ring-2 focus:ring-blue-100 outline-none"
                                                        dir="ltr"
                                                        placeholder="https://..."
                                                    />
                                                ) : (
                                                    <div className="text-gray-400 text-[10px] truncate max-w-[200px] mx-auto font-mono" dir="ltr">
                                                        {brand.logo_url}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                {editingId === brand.id ? (
                                                    <>
                                                        <button onClick={() => handleSave(brand.id)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm hover:bg-green-700 transition">שמור</button>
                                                        <button onClick={() => setEditingId(null)} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm border hover:bg-gray-200 transition">ביטול</button>
                                                    </>
                                                ) : (
                                                    canEdit ? (
                                                        <button
                                                            onClick={() => startEdit(brand)}
                                                            className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"
                                                            title="ערוך"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                            </svg>
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-400 text-[10px] uppercase font-bold">Read Only</span>
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

                {/* Mobile View Card Layout */}
                <div className="md:hidden divide-y divide-gray-100">
                    {paginatedBrands.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">לא נמצאו מותגים {selectedLetter ? `באות ${selectedLetter}` : ''}</div>
                    ) : (
                        paginatedBrands.map(brand => (
                            <div key={brand.id} className="p-5 bg-white space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="font-bold text-gray-900 text-lg">{brand.name}</div>
                                    <div className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center p-1 relative">
                                        {brand.logo_url ? (
                                            <Image src={brand.logo_url} alt={brand.name} fill className="object-contain p-1" sizes="48px" />
                                        ) : (
                                            <span className="text-[10px] text-gray-300">No Logo</span>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">קישור ללוגו:</label>
                                    {editingId === brand.id ? (
                                        <div className="space-y-3">
                                            <input
                                                value={editUrl}
                                                onChange={e => setEditUrl(e.target.value)}
                                                className="border p-3 rounded-xl w-full text-sm bg-gray-50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-blue-100"
                                                dir="ltr"
                                                placeholder="https://..."
                                            />
                                            <div className="flex gap-2">
                                                <button onClick={() => handleSave(brand.id)} className="bg-green-600 text-white flex-1 py-2.5 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition">שמור שינויים</button>
                                                <button onClick={() => setEditingId(null)} className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl text-sm border active:scale-95 transition">ביטול</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="text-[11px] text-gray-500 font-mono truncate flex-1 bg-gray-50 p-2 rounded-lg border border-gray-100" dir="ltr">
                                                {brand.logo_url || "לא הוגדר קישור"}
                                            </div>
                                            {canEdit && (
                                                <button
                                                    onClick={() => startEdit(brand)}
                                                    className="bg-blue-50 text-blue-600 p-2.5 rounded-xl active:scale-90 transition border border-blue-100"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    )}
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
                        className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 transition"
                    >
                        הקודם
                    </button>
                    <span className="text-sm text-gray-600">
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
