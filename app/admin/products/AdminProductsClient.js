fg,"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TagInput from "../../components/TagInput";

export default function AdminProductsClient({ products, initialSearch, totalProducts, filteredCount, currentPage, totalPages, currentLetter, currentView, currentSort }) {
    const router = useRouter();
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [searchTerm, setSearchTerm] = useState(initialSearch);

    useEffect(() => {
        setSearchTerm(initialSearch);
    }, [initialSearch]);

    const [isCreating, setIsCreating] = useState(false);

    const startEdit = (product) => {
        setEditingId(product.id);
        setIsCreating(false);
        setEditForm({
            brand: product.brand || '',
            model: product.model || '',
            price_2ml: product.price_2ml || 0,
            price_5ml: product.price_5ml || 0,
            price_10ml: product.price_10ml || 0,
            image_url: product.image_url || '',
            category: product.category || '',
            category: product.category || '',
            description: product.description || '',
            stock: product.stock || 0,
            top_notes: product.top_notes || '',
            middle_notes: product.middle_notes || '',
            base_notes: product.base_notes || ''
        });
    };

    const startCreate = () => {
        setEditingId(null);
        setIsCreating(true);
        setEditForm({
            brand: '',
            model: '',
            price_2ml: 0,
            price_5ml: 0,
            price_10ml: 0,
            image_url: '',
            category: '',
            description: '',
            stock: 0,
            top_notes: '',
            middle_notes: '',
            base_notes: ''
        });
    };

    const handleSave = async () => {
        const method = isCreating ? 'POST' : 'PUT';

        try {
            const res = await fetch('/api/products', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingId, ...editForm })
            });

            if (res.ok) {
                setEditingId(null);
                setIsCreating(false);
                router.refresh();
            } else {
                alert('שגיאה בשמירה');
            }
        } catch (e) {
            alert('שגיאה בתקשורת');
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setIsCreating(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק מוצר זה?')) return;

        try {
            const res = await fetch(`/api/products?id=${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                router.refresh();
            } else {
                alert('שגיאה במחיקה');
            }
        } catch (e) {
            alert('שגיאה בתקשורת');
        }
    };

    const handleLetterClick = (letter) => {
        router.push(`/admin/products?letter=${letter}`);
    };

    const handlePageChange = (newPage) => {
        const queryParams = new URLSearchParams();
        if (searchTerm) queryParams.set('q', searchTerm);
        if (currentLetter) queryParams.set('letter', currentLetter);
        queryParams.set('page', newPage);
        router.push(`/admin/products?${queryParams.toString()}`);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.push(`/admin/products?q=${searchTerm}`);
    };

    const allCategories = Array.from(new Set(
        products.flatMap(p => p.category ? p.category.split(',') : [])
            .map(c => c.trim())
            .filter(Boolean)
    )).sort();

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">ניהול מוצרים</h1>
                    <div className="text-sm text-gray-500">
                        סה״כ מוצרים באתר: <strong>{totalProducts}</strong>
                        {currentLetter && (
                            <span className="mr-2">
                                | נמצאו באות <strong>{currentLetter}</strong>: <strong>{filteredCount}</strong>
                            </span>
                        )}
                        {searchTerm && (
                            <span className="mr-2">
                                | תוצאות חיפוש: <strong>{filteredCount}</strong>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* View Tabs */}
            <div className="flex gap-4 border-b mb-6">
                <button
                    onClick={() => router.push('/admin/products?view=all')}
                    className={`pb-2 px-4 font-bold transition ${currentView === 'all' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black'}`}
                >
                    כל המוצרים
                </button>
                <button
                    onClick={() => router.push('/admin/products?view=out_of_stock')}
                    className={`pb-2 px-4 font-bold transition ${currentView === 'out_of_stock' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-red-600'}`}
                >
                    חסרים במלאי ⚠️
                </button>
                <button
                    onClick={() => router.push('/admin/products?view=stock_list')}
                    className={`pb-2 px-4 font-bold transition ${currentView === 'stock_list' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                >
                    דו״ח מלאי 📊
                </button>
            </div>

            {/* Sorting Controls (Visible mainly in Stock List or All) */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                    <span className="text-sm text-gray-500 self-center">מיון לפי מלאי:</span>
                    <button
                        onClick={() => router.push(`/admin/products?view=${currentView}&sort=stock_desc`)}
                        className={`px-3 py-1 rounded text-sm border ${currentSort === 'stock_desc' ? 'bg-black text-white border-black' : 'bg-white text-black hover:border-black'}`}
                    >
                        גבוה לנמוך
                    </button>
                    <button
                        onClick={() => router.push(`/admin/products?view=${currentView}&sort=stock_asc`)}
                        className={`px-3 py-1 rounded text-sm border ${currentSort === 'stock_asc' ? 'bg-black text-white border-black' : 'bg-white text-black hover:border-black'}`}
                    >
                        נמוך לגבוה
                    </button>
                </div>

                <div className="flex gap-4">
                    <button onClick={startCreate} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 transition">
                        + מוצר חדש
                    </button>
                    <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="חפש מוצר..."
                            className="border p-2 rounded w-full md:w-64"
                        />
                        <button className="bg-black text-white px-4 py-2 rounded font-bold">חפש</button>
                    </form>
                </div>
            </div>

            {/* A-Z Filter */}
            <div className="flex flex-wrap gap-2 mb-8 justify-center md:justify-start">
                <button
                    onClick={() => router.push('/admin/products')}
                    className={`px-3 py-1 rounded text-sm font-bold border transition ${!currentLetter && !searchTerm ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-300 hover:border-black'}`}
                >
                    הכל
                </button>
                {letters.map(letter => (
                    <button
                        key={letter}
                        onClick={() => handleLetterClick(letter)}
                        className={`w-8 h-8 flex items-center justify-center rounded text-sm font-bold border transition ${currentLetter === letter ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-300 hover:border-black'}`}
                    >
                        {letter}
                    </button>
                ))}
            </div>

            {isCreating && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-blue-200 mb-8">
                    <h3 className="text-xl font-bold mb-4">יצירת מוצר חדש</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-sm text-gray-500">מותג</label>
                            <input
                                value={editForm.brand}
                                onChange={e => setEditForm({ ...editForm, brand: e.target.value })}
                                className="border p-2 rounded w-full bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">דגם</label>
                            <input
                                value={editForm.model}
                                onChange={e => setEditForm({ ...editForm, model: e.target.value })}
                                className="border p-2 rounded w-full bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">קטגוריות (לחץ Enter להוספה)</label>
                            <TagInput
                                tags={editForm.category ? editForm.category.split(',').filter(Boolean) : []}
                                onChange={(newTags) => setEditForm({ ...editForm, category: newTags.join(',') })}
                                suggestions={allCategories}
                                placeholder="הוסף קטגוריה (למשל: יוניסקס)..."
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="text-sm text-gray-500">2 מ״ל</label>
                            <input
                                type="number"
                                value={editForm.price_2ml}
                                onChange={e => setEditForm({ ...editForm, price_2ml: Number(e.target.value) })}
                                className="border p-2 rounded w-full bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">5 מ״ל</label>
                            <input
                                type="number"
                                value={editForm.price_5ml}
                                onChange={e => setEditForm({ ...editForm, price_5ml: Number(e.target.value) })}
                                className="border p-2 rounded w-full bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">10 מ״ל</label>
                            <input
                                type="number"
                                value={editForm.price_10ml}
                                onChange={e => setEditForm({ ...editForm, price_10ml: Number(e.target.value) })}
                                className="border p-2 rounded w-full bg-gray-50"
                            />
                        </div>
                        <div className="md:col-span-3 mt-2">
                            <label className="text-sm text-gray-500 font-bold">מלאי (מ״ל)</label>
                            <input
                                type="number"
                                value={editForm.stock}
                                onChange={e => setEditForm({ ...editForm, stock: Number(e.target.value) })}
                                className="border p-2 rounded w-full bg-gray-50 bg-yellow-50"
                                placeholder="לדוגמה: 100"
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="text-sm text-gray-500">קישור לתמונה (Image URL)</label>
                        <input
                            value={editForm.image_url || ''}
                            onChange={e => setEditForm({ ...editForm, image_url: e.target.value })}
                            className="border p-2 rounded w-full bg-gray-50 text-left"
                            dir="ltr"
                            placeholder="/products/image.png or https://..."
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="text-sm text-gray-500">תווים עליונים</label>
                            <TagInput
                                tags={editForm.top_notes ? editForm.top_notes.split(',').filter(Boolean) : []}
                                onChange={(newTags) => setEditForm({ ...editForm, top_notes: newTags.join(',') })}
                                suggestions={[]}
                                placeholder="למשל: יסמין, ורד..."
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">תווי לב</label>
                            <TagInput
                                tags={editForm.middle_notes ? editForm.middle_notes.split(',').filter(Boolean) : []}
                                onChange={(newTags) => setEditForm({ ...editForm, middle_notes: newTags.join(',') })}
                                suggestions={[]}
                                placeholder="למשל: וניל, עץ..."
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-500">תווי בסיס</label>
                            <TagInput
                                tags={editForm.base_notes ? editForm.base_notes.split(',').filter(Boolean) : []}
                                onChange={(newTags) => setEditForm({ ...editForm, base_notes: newTags.join(',') })}
                                suggestions={[]}
                                placeholder="למשל: מאסק, אמבר..."
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="text-sm text-gray-500">תיאור מוצר</label>
                        <textarea
                            value={editForm.description || ''}
                            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                            className="border p-2 rounded w-full bg-gray-50 h-24"
                            placeholder="תיאור מלא של הבושם, תווים, וכו'..."
                        />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button onClick={handleCancel} className="bg-gray-200 text-black px-6 py-2 rounded font-bold">ביטול</button>
                        <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded font-bold">צור מוצר</button>
                    </div>
                </div>
            )
            }

            <div className="grid grid-cols-1 gap-4">
                {products.map((product) => (
                    <div key={product.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">

                        {editingId === product.id ? (
                            <div className="flex-1 w-full flex flex-col gap-4">
                                <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-gray-500">מותג</label>
                                        <input
                                            value={editForm.brand}
                                            onChange={e => setEditForm({ ...editForm, brand: e.target.value })}
                                            className="border p-2 rounded w-full bg-gray-50"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-gray-500">דגם</label>
                                        <input
                                            value={editForm.model}
                                            onChange={e => setEditForm({ ...editForm, model: e.target.value })}
                                            className="border p-2 rounded w-full bg-gray-50"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs text-gray-500">קטגוריות (לחץ Enter להוספה)</label>
                                        <TagInput
                                            tags={editForm.category ? editForm.category.split(',').filter(Boolean) : []}
                                            onChange={(newTags) => setEditForm({ ...editForm, category: newTags.join(',') })}
                                            suggestions={allCategories}
                                            placeholder="הוסף קטגוריה..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">2 מ״ל</label>
                                        <input
                                            type="number"
                                            value={editForm.price_2ml}
                                            onChange={e => setEditForm({ ...editForm, price_2ml: Number(e.target.value) })}
                                            className="border p-2 rounded w-full bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">5 מ״ל</label>
                                        <input
                                            type="number"
                                            value={editForm.price_5ml}
                                            onChange={e => setEditForm({ ...editForm, price_5ml: Number(e.target.value) })}
                                            className="border p-2 rounded w-full bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">10 מ״ל</label>
                                        <input
                                            type="number"
                                            value={editForm.price_10ml}
                                            onChange={e => setEditForm({ ...editForm, price_10ml: Number(e.target.value) })}
                                            className="border p-2 rounded w-full bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 text-red-600 font-bold">מלאי (מ״ל)</label>
                                        <input
                                            type="number"
                                            value={editForm.stock}
                                            onChange={e => setEditForm({ ...editForm, stock: Number(e.target.value) })}
                                            className="border p-2 rounded w-full bg-yellow-50 font-bold"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">קישור לתמונה</label>
                                    <input
                                        value={editForm.image_url || ''}
                                        onChange={e => setEditForm({ ...editForm, image_url: e.target.value })}
                                        className="border p-2 rounded w-full bg-gray-50 text-left"
                                        dir="ltr"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">תיאור</label>
                                    <textarea
                                        value={editForm.description || ''}
                                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                        className="border p-2 rounded w-full bg-gray-50 h-20 text-sm"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    <div>
                                        <label className="text-xs text-gray-500">עליונים</label>
                                        <TagInput
                                            tags={editForm.top_notes ? editForm.top_notes.split(',').filter(Boolean) : []}
                                            onChange={(newTags) => setEditForm({ ...editForm, top_notes: newTags.join(',') })}
                                            suggestions={[]}
                                            placeholder="..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">לב</label>
                                        <TagInput
                                            tags={editForm.middle_notes ? editForm.middle_notes.split(',').filter(Boolean) : []}
                                            onChange={(newTags) => setEditForm({ ...editForm, middle_notes: newTags.join(',') })}
                                            suggestions={[]}
                                            placeholder="..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">בסיס</label>
                                        <TagInput
                                            tags={editForm.base_notes ? editForm.base_notes.split(',').filter(Boolean) : []}
                                            onChange={(newTags) => setEditForm({ ...editForm, base_notes: newTags.join(',') })}
                                            suggestions={[]}
                                            placeholder="..."
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center gap-4 w-full">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.model} className="w-10 h-10 object-cover rounded" />
                                ) : (
                                    <div className="hidden md:flex w-10 h-10 bg-gray-100 rounded items-center justify-center text-lg">🧴</div>
                                )}
                                <div className="flex-1">
                                    <div className="font-bold text-lg">{product.brand}</div>
                                    <div className="text-gray-600">{product.model}</div>
                                </div>
                                <div className={`font-bold text-sm px-3 py-1 rounded shadow-sm ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    מלאי: {product.stock || 0}
                                </div>
                                <div className="font-mono text-sm bg-gray-50 px-3 py-1 rounded shadow-sm">
                                    {product.price_10ml} ₪
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 w-full md:w-auto">
                            {editingId === product.id ? (
                                <>
                                    <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold flex-1 md:flex-none">שמור</button>
                                    <button onClick={handleCancel} className="bg-gray-200 text-black px-4 py-2 rounded text-sm font-bold flex-1 md:flex-none">ביטול</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => startEdit(product)} className="border-2 border-black text-black hover:bg-black hover:text-white px-6 py-1.5 rounded text-sm font-bold transition w-full md:w-auto">
                                        ערוך
                                    </button>
                                    <button onClick={() => handleDelete(product.id)} className="border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-4 py-1.5 rounded text-sm font-bold transition w-full md:w-auto">
                                        מחק
                                    </button>
                                </>
                            )}
                        </div>

                    </div>
                ))}
            </div >

            {/* Pagination Controls */}
            {
                totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border rounded disabled:opacity-50"
                        >
                            הקודם
                        </button>
                        <span className="px-4 py-2 text-gray-600">
                            עמוד {currentPage} מתוך {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border rounded disabled:opacity-50"
                        >
                            הבא
                        </button>
                    </div>
                )
            }
        </div >
    );
}
