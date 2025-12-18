"use client";

import { useState, useEffect } from "react";
import AdminFilterBar from "@/app/components/admin/AdminFilterBar";

export default function AdminBrandsPage() {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editUrl, setEditUrl] = useState("");

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
    const filteredBrands = selectedLetter
        ? brands.filter(brand => brand.name.trim().toLowerCase().startsWith(selectedLetter.toLowerCase()))
        : brands;

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">ניהול מותגים</h1>
            <p className="mb-4 text-gray-600">הזן קישורים ללוגואים של המותגים השונים. הלוגואים יוצגו בקרוסלה ובדפי המוצרים.</p>

            {/* A-Z Filter Controls */}
            <AdminFilterBar
                selectedLetter={selectedLetter}
                onSelect={setSelectedLetter}
            />

            <div className="bg-white rounded-lg shadow border overflow-hidden">
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
                        {filteredBrands.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="p-8 text-gray-500">לא נמצאו מותגים באות {selectedLetter}</td>
                            </tr>
                        ) : (
                            filteredBrands.map(brand => (
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
                                                <button onClick={() => startEdit(brand)} className="text-blue-600 underline text-sm font-bold">ערוך</button>
                                            )}
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
