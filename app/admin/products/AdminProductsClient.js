"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TagInput from "../../components/TagInput";
import toast from 'react-hot-toast';

export default function AdminProductsClient({ products, initialSearch, totalProducts, filteredCount, currentPage, totalPages, currentLetter, currentView, currentSort, canEdit }) {

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
            name_he: product.name_he || '',
            price_2ml: product.price_2ml || 0,
            price_5ml: product.price_5ml || 0,
            price_10ml: product.price_10ml || 0,
            image_url: product.image_url || '',
            category: product.category || '',
            description: product.description || '',
            stock: product.stock || 0,
            top_notes: product.top_notes || '',
            middle_notes: product.middle_notes || '',
            base_notes: product.base_notes || '',
            in_lottery: product.in_lottery ?? true,
            cost_price: product.cost_price || 0,
            original_size: product.original_size || 100
        });
    };

    const startCreate = () => {
        setEditingId(null);
        setIsCreating(true);
        setEditForm({
            brand: '',
            model: '',
            name_he: '',
            price_2ml: 0,
            price_5ml: 0,
            price_10ml: 0,
            image_url: '',
            category: '',
            description: '',
            stock: 0,
            top_notes: '',
            middle_notes: '',
            base_notes: '',
            in_lottery: true,
            cost_price: 0,
            original_size: 100
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
                toast.error('שגיאה בשמירה');
            }
        } catch (e) {
            toast.error('שגיאה בתקשורת');
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setIsCreating(false);
    };

    const handleDelete = (id) => {
        toast((t) => (
            <div className="flex flex-col gap-2">
                <p className="font-medium text-sm">האם אתה בטוח שברצונך למחוק מוצר זה?</p>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            deleteProduct(id);
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

    const deleteProduct = async (id) => {
        try {
            const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('המוצר נמחק בהצלחה');
                router.refresh();
            } else {
                toast.error('שגיאה במחיקת המוצר');
            }
        } catch (e) {
            console.error(e);
            toast.error('שגיאה בתקשורת');
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
                    חסרים במלאי
                </button>
                <button
                    onClick={() => router.push('/admin/products?view=stock_list')}
                    className={`pb-2 px-4 font-bold transition ${currentView === 'stock_list' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                >
                    דו״ח מלאי
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
                    {canEdit && (
                        <button onClick={startCreate} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 transition">
                            + מוצר חדש
                        </button>
                    )}
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
                            <label className="text-sm font-bold">מותג</label>
                            <input
                                value={editForm.brand}
                                onChange={e => setEditForm({ ...editForm, brand: e.target.value })}
                                className="border p-2 rounded w-full bg-white"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold">דגם</label>
                            <input
                                value={editForm.model}
                                onChange={e => setEditForm({ ...editForm, model: e.target.value })}
                                className="border p-2 rounded w-full bg-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-sm font-bold">שם בעברית (ל-SEO)</label>
                            <input
                                value={editForm.name_he}
                                onChange={e => setEditForm({ ...editForm, name_he: e.target.value })}
                                className="border p-2 rounded w-full bg-white"
                                placeholder="לדוגמה: קריד אוונטוס..."
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold">קטגוריות (לחץ Enter להוספה)</label>
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
                            <label className="text-sm font-bold">2 מ״ל</label>
                            <input
                                type="number"
                                value={editForm.price_2ml}
                                onChange={e => setEditForm({ ...editForm, price_2ml: Number(e.target.value) })}
                                className="border p-2 rounded w-full bg-white"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold">5 מ״ל</label>
                            <input
                                type="number"
                                value={editForm.price_5ml}
                                onChange={e => setEditForm({ ...editForm, price_5ml: Number(e.target.value) })}
                                className="border p-2 rounded w-full bg-white"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold">10 מ״ל</label>
                            <input
                                type="number"
                                value={editForm.price_10ml}
                                onChange={e => setEditForm({ ...editForm, price_10ml: Number(e.target.value) })}
                                className="border p-2 rounded w-full bg-white"
                            />
                        </div>
                        <div className="md:col-span-3 mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-bold">מחיר עלות (ש״ח) *</label>
                                <input
                                    type="number"
                                    required
                                    value={editForm.cost_price}
                                    onChange={e => setEditForm({ ...editForm, cost_price: Number(e.target.value) })}
                                    className="border p-2 rounded w-full bg-white"
                                    placeholder="לדוגמה: 50"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold">גודל מקור (מ״ל) *</label>
                                <input
                                    type="number"
                                    required
                                    value={editForm.original_size}
                                    onChange={e => setEditForm({ ...editForm, original_size: Number(e.target.value) })}
                                    className="border p-2 rounded w-full bg-white"
                                    placeholder="לדוגמה: 50"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-3 mt-2">
                            <label className="text-sm font-bold">מלאי (מ״ל)</label>
                            <input
                                type="number"
                                value={editForm.stock}
                                onChange={e => setEditForm({ ...editForm, stock: Number(e.target.value) })}
                                className="border p-2 rounded w-full bg-white"
                                placeholder="לדוגמה: 100"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="text-sm font-bold">קישור לתמונה (Image URL)</label>
                        <input
                            value={editForm.image_url || ''}
                            onChange={e => setEditForm({ ...editForm, image_url: e.target.value })}
                            className="border p-2 rounded w-full bg-white text-left"
                            dir="ltr"
                            placeholder="/products/image.png or https://..."
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="text-sm font-bold">תווים עליונים</label>
                            <TagInput
                                tags={editForm.top_notes ? editForm.top_notes.split(',').filter(Boolean) : []}
                                onChange={(newTags) => setEditForm({ ...editForm, top_notes: newTags.join(',') })}
                                suggestions={[]}
                                placeholder="למשל: יסמין, ורד..."
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold">תווי לב</label>
                            <TagInput
                                tags={editForm.middle_notes ? editForm.middle_notes.split(',').filter(Boolean) : []}
                                onChange={(newTags) => setEditForm({ ...editForm, middle_notes: newTags.join(',') })}
                                suggestions={[]}
                                placeholder="למשל: וניל, עץ..."
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold">תווי בסיס</label>
                            <TagInput
                                tags={editForm.base_notes ? editForm.base_notes.split(',').filter(Boolean) : []}
                                onChange={(newTags) => setEditForm({ ...editForm, base_notes: newTags.join(',') })}
                                suggestions={[]}
                                placeholder="למשל: מאסק, אמבר..."
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="text-sm font-bold">תיאור מוצר</label>
                        <textarea
                            value={editForm.description || ''}
                            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                            className="border p-2 rounded w-full bg-white h-24"
                            placeholder="תיאור מלא של הבושם, תווים, וכו'..."
                        />
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                        <input
                            type="checkbox"
                            checked={editForm.in_lottery ?? true}
                            onChange={e => setEditForm({ ...editForm, in_lottery: e.target.checked })}
                            className="w-5 h-5 accent-red-600 cursor-pointer"
                        />
                        <label className="text-sm font-bold select-none">לכלול במאגר ההגרלות? (רנדומלי)</label>
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
                                        <label className="text-xs font-bold">מותג</label>
                                        <input
                                            value={editForm.brand}
                                            onChange={e => setEditForm({ ...editForm, brand: e.target.value })}
                                            className="border p-2 rounded w-full bg-white"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs font-bold">דגם</label>
                                        <input
                                            value={editForm.model}
                                            onChange={e => setEditForm({ ...editForm, model: e.target.value })}
                                            className="border p-2 rounded w-full bg-white"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold">שם בעברית</label>
                                        <input
                                            value={editForm.name_he}
                                            onChange={e => setEditForm({ ...editForm, name_he: e.target.value })}
                                            className="border p-2 rounded w-full bg-white"
                                            placeholder="עברית..."
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs font-bold">קטגוריות</label>
                                        <TagInput
                                            tags={editForm.category ? editForm.category.split(',').filter(Boolean) : []}
                                            onChange={(newTags) => setEditForm({ ...editForm, category: newTags.join(',') })}
                                            suggestions={allCategories}
                                            placeholder="הוסף קטגוריה..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold">2 מ״ל</label>
                                        <input
                                            type="number"
                                            value={editForm.price_2ml}
                                            onChange={e => setEditForm({ ...editForm, price_2ml: Number(e.target.value) })}
                                            className="border p-2 rounded w-full bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold">5 מ״ל</label>
                                        <input
                                            type="number"
                                            value={editForm.price_5ml}
                                            onChange={e => setEditForm({ ...editForm, price_5ml: Number(e.target.value) })}
                                            className="border p-2 rounded w-full bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold">10 מ״ל</label>
                                        <input
                                            type="number"
                                            value={editForm.price_10ml}
                                            onChange={e => setEditForm({ ...editForm, price_10ml: Number(e.target.value) })}
                                            className="border p-2 rounded w-full bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold">מלאי (מ״ל)</label>
                                        <input
                                            type="number"
                                            value={editForm.stock}
                                            onChange={e => setEditForm({ ...editForm, stock: Number(e.target.value) })}
                                            className="border p-2 rounded w-full bg-white"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs font-bold">עלות (ש״ח)</label>
                                        <input
                                            type="number"
                                            value={editForm.cost_price}
                                            onChange={e => setEditForm({ ...editForm, cost_price: Number(e.target.value) })}
                                            className="border p-2 rounded w-full bg-white"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-xs font-bold">גודל מקור</label>
                                        <input
                                            type="number"
                                            value={editForm.original_size}
                                            onChange={e => setEditForm({ ...editForm, original_size: Number(e.target.value) })}
                                            className="border p-2 rounded w-full bg-white"
                                        />
                                    </div>
                                </div>



                                <div>
                                    <label className="text-xs font-bold">קישור לתמונה</label>
                                    <input
                                        value={editForm.image_url || ''}
                                        onChange={e => setEditForm({ ...editForm, image_url: e.target.value })}
                                        className="border p-2 rounded w-full bg-white text-left"
                                        dir="ltr"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold">תיאור</label>
                                    <textarea
                                        value={editForm.description || ''}
                                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                        className="border p-2 rounded w-full bg-white h-20 text-sm"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    <div>
                                        <label className="text-xs font-bold">עליונים</label>
                                        <TagInput
                                            tags={editForm.top_notes ? editForm.top_notes.split(',').filter(Boolean) : []}
                                            onChange={(newTags) => setEditForm({ ...editForm, top_notes: newTags.join(',') })}
                                            suggestions={[]}
                                            placeholder="..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold">לב</label>
                                        <TagInput
                                            tags={editForm.middle_notes ? editForm.middle_notes.split(',').filter(Boolean) : []}
                                            onChange={(newTags) => setEditForm({ ...editForm, middle_notes: newTags.join(',') })}
                                            suggestions={[]}
                                            placeholder="..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold">בסיס</label>
                                        <TagInput
                                            tags={editForm.base_notes ? editForm.base_notes.split(',').filter(Boolean) : []}
                                            onChange={(newTags) => setEditForm({ ...editForm, base_notes: newTags.join(',') })}
                                            suggestions={[]}
                                            placeholder="..."
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-4 ml-1">
                                    <input
                                        type="checkbox"
                                        checked={editForm.in_lottery ?? true}
                                        onChange={e => setEditForm({ ...editForm, in_lottery: e.target.checked })}
                                        className="w-4 h-4 accent-red-600 cursor-pointer"
                                    />
                                    <label className="text-xs font-bold select-none">לכלול במאגר ההגרלות? (רנדומלי)</label>
                                </div>
                                <div className="flex gap-2 justify-end mt-4">
                                    <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold flex-1 md:flex-none">שמור</button>
                                    <button onClick={handleCancel} className="bg-gray-200 text-black px-4 py-2 rounded text-sm font-bold flex-1 md:flex-none">ביטול</button>
                                </div>
                            </div >
                        ) : (
                            <div className="flex-1 flex items-center gap-4 w-full">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.model} className="w-10 h-10 object-contain rounded" />
                                ) : (
                                    <div className="hidden md:flex w-10 h-10 bg-gray-100 rounded items-center justify-center text-lg"></div>
                                )}
                                <div className="flex-1 flex flex-col">
                                    <div className="flex items-center gap-3">
                                        <div className="font-bold text-lg">{product.brand}</div>
                                        <div className={`font-bold text-xs px-2 py-0.5 rounded shadow-sm ${(product.stock || 0) <= 20 ? 'bg-red-100 text-red-800' :
                                            (product.stock || 0) <= 50 ? 'bg-orange-100 text-orange-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                            מלאי: {product.stock || 0} מ״ל
                                        </div>
                                        {(() => {
                                            const profitPerMl = Math.round((product.price_2ml / 2) - ((product.cost_price || 0) / (product.original_size || 100)));
                                            const isNegative = profitPerMl < 0;
                                            return (
                                                <div
                                                    className={`font-mono text-xs px-2 py-0.5 rounded shadow-sm border ${isNegative
                                                        ? 'bg-red-50 text-red-700 border-red-200'
                                                        : 'bg-green-50 text-green-700 border-green-200'
                                                        }`}
                                                    title="רווח ל-1 מ״ל"
                                                    dir="ltr"
                                                >
                                                    ₪ {isNegative ? `-${Math.abs(profitPerMl)}` : profitPerMl}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                    <div className="text-gray-600 text-sm">{product.model}</div>
                                </div>
                            </div>
                        )
                        }

                        {editingId !== product.id && canEdit && (
                            <div className="flex gap-2 w-full md:w-auto">
                                <button onClick={() => startEdit(product)} className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs hover:bg-blue-700 font-bold transition whitespace-nowrap">
                                    עדכן
                                </button>
                                <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-700 text-xs font-bold border border-red-200 px-4 py-1.5 rounded hover:bg-white transition">
                                    מחק
                                </button>
                            </div>
                        )}


                    </div >
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
