"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "@/app/components/CImage";
import TagInput from "../../components/TagInput";
import ModernDateTimePicker from "../../components/ui/ModernDateTimePicker";
import toast from 'react-hot-toast';
import AdminFilterBar from "../../components/admin/AdminFilterBar";

export default function AdminProductsClient({ products, initialSearch, totalProducts, filteredCount, counts, currentPage, totalPages, currentLetter, currentView, currentSort, canEdit }) {

    const router = useRouter();
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [availableNotes, setAvailableNotes] = useState([]);

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const res = await fetch("/api/fragrance-notes");
                if (res.ok) {
                    const data = await res.json();
                    setAvailableNotes(data);
                }
            } catch (error) {
                console.error("Error fetching notes:", error);
            }
        };
        fetchNotes();
    }, []);

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
            brand_he: product.brand_he || '',
            model_he: product.model_he || '',
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
            original_size: product.original_size || 100,
            seasons: product.seasons || '',
            perfumers: product.perfumers || '',
            country: product.country || '',
            active: product.active ?? true,
            discount_percentage: product.discount_percentage || 0,
            discount_sizes: product.discount_sizes || [],
            discount_end_date: product.discount_end_date || ''
        });
    };

    const startCreate = () => {
        setEditingId(null);
        setIsCreating(true);
        setEditForm({
            brand: '',
            model: '',
            name_he: '',
            brand_he: '',
            model_he: '',
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
            original_size: 100,
            seasons: '',
            perfumers: '',
            country: '',
            active: true,
            discount_percentage: 0,
            discount_sizes: [],
            discount_end_date: ''
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
            const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
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
        if (!letter) {
            router.push('/admin/products');
            return;
        }
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
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
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
            <div className="flex gap-4 border-b mb-6 overflow-x-auto scrollbar-hide">
                <button
                    onClick={() => router.push('/admin/products?view=all')}
                    className={`pb-2 px-4 font-bold transition whitespace-nowrap ${currentView === 'all' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black'}`}
                >
                    כל המוצרים ({counts?.all || 0})
                </button>
                <button
                    onClick={() => router.push('/admin/products?view=on_sale')}
                    className={`pb-2 px-4 font-bold transition whitespace-nowrap ${currentView === 'on_sale' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-green-600'}`}
                >
                    מבצעים ({counts?.on_sale || 0})
                </button>
                <button
                    onClick={() => router.push('/admin/products?view=out_of_stock')}
                    className={`pb-2 px-4 font-bold transition whitespace-nowrap ${currentView === 'out_of_stock' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-red-600'}`}
                >
                    חסרים במלאי ({counts?.out_of_stock || 0})
                </button>
                <button
                    onClick={() => router.push('/admin/products?view=drafts')}
                    className={`pb-2 px-4 font-bold transition whitespace-nowrap ${currentView === 'drafts' ? 'border-b-2 border-gray-600 text-gray-600' : 'text-gray-500 hover:text-gray-600'}`}
                >
                    טיוטות ({counts?.drafts || 0})
                </button>
                <button
                    onClick={() => router.push('/admin/products?view=stock_list')}
                    className={`pb-2 px-4 font-bold transition whitespace-nowrap ${currentView === 'stock_list' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                >
                    דו״ח מלאי
                </button>
            </div>

            {/* Sorting Controls (Visible mainly in Stock List or All) */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    <span className="text-sm text-gray-500 self-center whitespace-nowrap">מיון מלאי:</span>
                    <button
                        onClick={() => router.push(`/admin/products?view=${currentView}&sort=stock_desc`)}
                        className={`px-3 py-1 rounded-lg text-xs md:text-sm border whitespace-nowrap shadow-sm transition ${currentSort === 'stock_desc' ? 'bg-black text-white border-black' : 'bg-white text-black hover:border-black'}`}
                    >
                        גבוה לנמוך
                    </button>
                    <button
                        onClick={() => router.push(`/admin/products?view=${currentView}&sort=stock_asc`)}
                        className={`px-3 py-1 rounded-lg text-xs md:text-sm border whitespace-nowrap shadow-sm transition ${currentSort === 'stock_asc' ? 'bg-black text-white border-black' : 'bg-white text-black hover:border-black'}`}
                    >
                        נמוך לגבוה
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    {canEdit && (
                        <button onClick={startCreate} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition shadow-md w-full md:w-auto text-sm md:text-base">
                            + מוצר חדש
                        </button>
                    )}
                    <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="חפש מוצר..."
                            className="border p-2 rounded-xl w-full md:w-64 bg-gray-50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-blue-100"
                        />
                        <button className="bg-black text-white px-5 py-2 rounded-xl font-bold shadow-sm hover:bg-gray-800 transition">חפש</button>
                    </form>
                </div>
            </div>

            {/* A-Z Filter */}
            <AdminFilterBar
                selectedLetter={currentLetter}
                onSelect={handleLetterClick}
                className="mb-8"
            />

            {isCreating && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-blue-200 mb-8">
                    <h3 className="text-xl font-bold mb-4">יצירת מוצר חדש</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">מותג</label>
                            <input
                                value={editForm.brand}
                                onChange={e => setEditForm({ ...editForm, brand: e.target.value })}
                                className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white focus:border-black outline-none transition-colors font-bold text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">דגם</label>
                            <input
                                value={editForm.model}
                                onChange={e => setEditForm({ ...editForm, model: e.target.value })}
                                className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white focus:border-black outline-none transition-colors font-bold text-sm"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">שם המותג בעברית</label>
                            <input
                                value={editForm.brand_he}
                                onChange={e => setEditForm({ ...editForm, brand_he: e.target.value })}
                                className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white focus:border-black outline-none transition-colors font-bold text-sm"
                                placeholder="..."
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">שם הדגם בעברית</label>
                            <input
                                value={editForm.model_he}
                                onChange={e => setEditForm({ ...editForm, model_he: e.target.value })}
                                className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white focus:border-black outline-none transition-colors font-bold text-sm"
                                placeholder="..."
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">שם SEO (עברית)</label>
                            <input
                                value={editForm.name_he}
                                onChange={e => setEditForm({ ...editForm, name_he: e.target.value })}
                                className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white focus:border-black outline-none transition-colors font-bold text-sm"
                                placeholder="לדוגמה: קריד אוונטוס..."
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">קטגוריות (לחץ Enter להוספה)</label>
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
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">2 מ״ל</label>
                            <input
                                type="number"
                                value={editForm.price_2ml}
                                onChange={e => setEditForm({ ...editForm, price_2ml: Number(e.target.value) })}
                                onWheel={(e) => e.target.blur()}
                                className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white focus:border-black outline-none transition-colors font-bold text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">5 מ״ל</label>
                            <input
                                type="number"
                                value={editForm.price_5ml}
                                onChange={e => setEditForm({ ...editForm, price_5ml: Number(e.target.value) })}
                                onWheel={(e) => e.target.blur()}
                                className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white focus:border-black outline-none transition-colors font-bold text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">10 מ״ל</label>
                            <input
                                type="number"
                                value={editForm.price_10ml}
                                onChange={e => setEditForm({ ...editForm, price_10ml: Number(e.target.value) })}
                                onWheel={(e) => e.target.blur()}
                                className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white focus:border-black outline-none transition-colors font-bold text-sm"
                            />
                        </div>
                        <div className="md:col-span-3 mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">מחיר עלות (ש״ח) *</label>
                                <input
                                    type="number"
                                    required
                                    value={editForm.cost_price}
                                    onChange={e => setEditForm({ ...editForm, cost_price: Number(e.target.value) })}
                                    onWheel={(e) => e.target.blur()}
                                    className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white focus:border-black outline-none transition-colors font-bold text-sm"
                                    placeholder="לדוגמה: 50"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">גודל מקור (מ״ל) *</label>
                                <input
                                    type="number"
                                    required
                                    value={editForm.original_size}
                                    onChange={e => setEditForm({ ...editForm, original_size: Number(e.target.value) })}
                                    onWheel={(e) => e.target.blur()}
                                    className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white focus:border-black outline-none transition-colors font-bold text-sm"
                                    placeholder="לדוגמה: 50"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-3 mt-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">מלאי (מ״ל)</label>
                            <input
                                type="number"
                                value={editForm.stock}
                                onChange={e => setEditForm({ ...editForm, stock: Number(e.target.value) })}
                                onWheel={(e) => e.target.blur()}
                                className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white focus:border-black outline-none transition-colors font-bold text-sm"
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
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">תיאור מוצר</label>
                        <textarea
                            value={editForm.description || ''}
                            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                            className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white h-32 focus:border-black outline-none transition-colors text-sm font-medium shadow-sm"
                            placeholder="תיאור מלא של הבושם, תווים, וכו'..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div>
                            <label className="text-sm font-bold block mb-2">עונות (בחר לפחות אחת)</label>
                            <div className="flex flex-wrap gap-3">
                                {['חורף', 'סתיו', 'אביב', 'קיץ'].map(s => (
                                    <label key={s} className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border hover:border-black transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={(editForm.seasons || '').split(',').includes(s)}
                                            onChange={(e) => {
                                                const current = (editForm.seasons || '').split(',').filter(Boolean);
                                                const next = e.target.checked 
                                                    ? [...current, s] 
                                                    : current.filter(x => x !== s);
                                                setEditForm({ ...editForm, seasons: next.join(',') });
                                            }}
                                            className="w-4 h-4 accent-black"
                                        />
                                        <span className="text-sm font-bold">{s}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-bold block mb-2">מדינת מוצא</label>
                            <input
                                value={editForm.country || ''}
                                onChange={e => setEditForm({ ...editForm, country: e.target.value })}
                                className="border p-2 rounded w-full bg-white shadow-sm focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                placeholder="למשל: צרפת, איטליה, אומן..."
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-sm font-bold block mb-2">פרפיומר (Perfumer) - לחץ Enter להוספה</label>
                            <TagInput
                                tags={editForm.perfumers ? editForm.perfumers.split(',').filter(Boolean) : []}
                                onChange={(newTags) => setEditForm({ ...editForm, perfumers: newTags.join(',') })}
                                suggestions={[]}
                                placeholder="לדוגמה: Olivier Polge, Jean-Claude Ellena..."
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 mb-4 p-4 rounded-xl bg-gray-50/50 border border-gray-100">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={editForm.in_lottery ?? true}
                                onChange={e => setEditForm({ ...editForm, in_lottery: e.target.checked })}
                                className="w-5 h-5 accent-red-600 cursor-pointer rounded"
                            />
                            <label className="text-sm font-bold select-none">לכלול במאגר ההגרלות? (רנדומלי)</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={editForm.active === false}
                                onChange={e => setEditForm({ ...editForm, active: !e.target.checked })}
                                className="w-5 h-5 accent-gray-500 cursor-pointer rounded"
                            />
                            <label className="text-sm font-bold select-none text-gray-700">מצב טיוטה (לא יופיע בקטלוג)</label>
                        </div>
                        
                        <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-100">
                            <h4 className="text-sm font-black text-green-800 uppercase tracking-widest mb-3">ניהול מבצע (Promotion)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-green-700 uppercase tracking-widest block mb-1">אחוז הנחה (%)</label>
                                    <input
                                        type="number"
                                        value={editForm.discount_percentage}
                                        onChange={e => setEditForm({ ...editForm, discount_percentage: Number(e.target.value) })}
                                        className="border-2 border-green-200 rounded-2xl px-4 h-[60px] w-full bg-white focus:border-green-500 outline-none transition-all font-bold text-sm"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[10px] font-black text-green-700 uppercase tracking-widest block mb-1">תאריך סיום (אופציונלי):</label>
                                    <ModernDateTimePicker 
                                        value={editForm.discount_end_date}
                                        onChange={val => setEditForm({ ...editForm, discount_end_date: val })}
                                        placeholder="בחר תאריך סיום..."
                                        className="h-[60px]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-green-700 uppercase tracking-widest block mb-1">חל על הגדלים:</label>
                                    <div className="flex gap-4 mt-1">
                                        {['2ml', '5ml', '10ml'].map(size => (
                                            <label key={size} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={(editForm.discount_sizes || []).includes(size)}
                                                    onChange={(e) => {
                                                        const current = editForm.discount_sizes || [];
                                                        const next = e.target.checked 
                                                            ? [...current, size] 
                                                            : current.filter(s => s !== size);
                                                        setEditForm({ ...editForm, discount_sizes: next });
                                                    }}
                                                    className="w-4 h-4 accent-green-600"
                                                />
                                                <span className="text-xs font-bold text-green-800">{size}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button onClick={handleCancel} className="bg-gray-200 text-black px-6 py-2 rounded font-bold">ביטול</button>
                        <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded font-bold">צור מוצר</button>
                    </div>
                </div>
            )
            }

            <div className="grid grid-cols-1 gap-4 mb-8">
                {products.map((product) => (
                    <div key={product.id} className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 transition-all hover:shadow-md hover:border-gray-200">

                        {editingId === product.id ? (
                            <div className="flex-1 w-full flex flex-col gap-4">
                                <div className="grid grid-cols-1 md:grid-cols-7 gap-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 mb-2">
                                    <div className="md:col-span-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">מותג</label>
                                        <input
                                            value={editForm.brand}
                                            onChange={e => setEditForm({ ...editForm, brand: e.target.value })}
                                            className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white focus:border-black outline-none transition-colors font-bold text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">דגם</label>
                                        <input
                                            value={editForm.model}
                                            onChange={e => setEditForm({ ...editForm, model: e.target.value })}
                                            className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white focus:border-black outline-none transition-colors font-bold text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">מותג (עברית)</label>
                                        <input
                                            value={editForm.brand_he}
                                            onChange={e => setEditForm({ ...editForm, brand_he: e.target.value })}
                                            className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white focus:border-black outline-none transition-colors font-bold text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">דגם (עברית)</label>
                                        <input
                                            value={editForm.model_he}
                                            onChange={e => setEditForm({ ...editForm, model_he: e.target.value })}
                                            className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white focus:border-black outline-none transition-colors font-bold text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">SEO (עברית)</label>
                                        <input
                                            value={editForm.name_he}
                                            onChange={e => setEditForm({ ...editForm, name_he: e.target.value })}
                                            className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white focus:border-black outline-none transition-colors font-bold text-sm"
                                            placeholder="עברית..."
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">קטגוריות</label>
                                        <TagInput
                                            tags={editForm.category ? editForm.category.split(',').filter(Boolean) : []}
                                            onChange={(newTags) => setEditForm({ ...editForm, category: newTags.join(',') })}
                                            suggestions={allCategories}
                                            placeholder="הוסף קטגוריה..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 md:col-span-2 gap-2">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">2 מ״ל</label>
                                            <input
                                                type="number"
                                                value={editForm.price_2ml}
                                                onChange={e => setEditForm({ ...editForm, price_2ml: Number(e.target.value) })}
                                                onWheel={(e) => e.target.blur()}
                                                className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white focus:border-black outline-none transition-colors font-bold text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">5 מ״ל</label>
                                            <input
                                                type="number"
                                                value={editForm.price_5ml}
                                                onChange={e => setEditForm({ ...editForm, price_5ml: Number(e.target.value) })}
                                                onWheel={(e) => e.target.blur()}
                                                className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white focus:border-black outline-none transition-colors font-bold text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">10 מ״ל</label>
                                            <input
                                                type="number"
                                                value={editForm.price_10ml}
                                                onChange={e => setEditForm({ ...editForm, price_10ml: Number(e.target.value) })}
                                                onWheel={(e) => e.target.blur()}
                                                className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white focus:border-black outline-none transition-colors font-bold text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">מלאי (מ״ל)</label>
                                        <input
                                            type="number"
                                            value={editForm.stock}
                                            onChange={e => setEditForm({ ...editForm, stock: Number(e.target.value) })}
                                            onWheel={(e) => e.target.blur()}
                                            className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white focus:border-black outline-none transition-colors font-bold text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">עלות (ש״ח)</label>
                                        <input
                                            type="number"
                                            value={editForm.cost_price}
                                            onChange={e => setEditForm({ ...editForm, cost_price: Number(e.target.value) })}
                                            onWheel={(e) => e.target.blur()}
                                            className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white focus:border-black outline-none transition-colors font-bold text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">גודל מקור</label>
                                        <input
                                            type="number"
                                            value={editForm.original_size}
                                            onChange={e => setEditForm({ ...editForm, original_size: Number(e.target.value) })}
                                            onWheel={(e) => e.target.blur()}
                                            className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white focus:border-black outline-none transition-colors font-bold text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">קישור לתמונה</label>
                                        <input
                                            value={editForm.image_url || ''}
                                            onChange={e => setEditForm({ ...editForm, image_url: e.target.value })}
                                            className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white focus:border-black outline-none transition-colors text-xs text-left"
                                            dir="ltr"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">תיאור</label>
                                        <textarea
                                            value={editForm.description || ''}
                                            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                            className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white h-24 focus:border-black outline-none transition-colors text-sm font-medium"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">תווים עליונים</label>
                                            <TagInput
                                                tags={editForm.top_notes ? editForm.top_notes.split(',').filter(Boolean) : []}
                                                onChange={(newTags) => setEditForm({ ...editForm, top_notes: newTags.join(',') })}
                                                suggestions={availableNotes}
                                                placeholder="..."
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">תווי לב</label>
                                            <TagInput
                                                tags={editForm.middle_notes ? editForm.middle_notes.split(',').filter(Boolean) : []}
                                                onChange={(newTags) => setEditForm({ ...editForm, middle_notes: newTags.join(',') })}
                                                suggestions={availableNotes}
                                                placeholder="..."
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">תווי בסיס</label>
                                            <TagInput
                                                tags={editForm.base_notes ? editForm.base_notes.split(',').filter(Boolean) : []}
                                                onChange={(newTags) => setEditForm({ ...editForm, base_notes: newTags.join(',') })}
                                                suggestions={availableNotes}
                                                placeholder="..."
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100 w-fit">
                                            <input
                                                type="checkbox"
                                                checked={editForm.in_lottery ?? true}
                                                onChange={e => setEditForm({ ...editForm, in_lottery: e.target.checked })}
                                                className="w-5 h-5 accent-black cursor-pointer rounded-lg"
                                            />
                                            <label className="text-xs font-black uppercase tracking-widest select-none text-gray-700">כלול בהגרלות רנדומליות</label>
                                        </div>
                                        <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100 w-fit">
                                            <input
                                                type="checkbox"
                                                checked={editForm.active === false}
                                                onChange={e => setEditForm({ ...editForm, active: !e.target.checked })}
                                                className="w-5 h-5 accent-gray-500 cursor-pointer rounded-lg"
                                            />
                                            <label className="text-xs font-black uppercase tracking-widest select-none text-gray-700">מצב טיוטה (מוסתר)</label>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-4 bg-white rounded-2xl border border-gray-100">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">עונות</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['חורף', 'סתיו', 'אביב', 'קיץ'].map(s => (
                                                    <label key={s} className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors border-2 border-transparent has-[:checked]:border-black has-[:checked]:bg-gray-50">
                                                        <input
                                                            type="checkbox"
                                                            checked={(editForm.seasons || '').split(',').includes(s)}
                                                            onChange={(e) => {
                                                                const current = (editForm.seasons || '').split(',').filter(Boolean);
                                                                const next = e.target.checked 
                                                                    ? [...current, s] 
                                                                    : current.filter(x => x !== s);
                                                                setEditForm({ ...editForm, seasons: next.join(',') });
                                                            }}
                                                            className="w-3.5 h-3.5 accent-black"
                                                        />
                                                        <span className="text-[11px] font-black">{s}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">מדינת מוצא</label>
                                            <input
                                                value={editForm.country || ''}
                                                onChange={e => setEditForm({ ...editForm, country: e.target.value })}
                                                className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white focus:border-black outline-none transition-colors font-bold text-sm"
                                                placeholder="מדינה..."
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">פרפיומרים (Perfumers)</label>
                                            <TagInput
                                                tags={editForm.perfumers ? editForm.perfumers.split(',').filter(Boolean) : []}
                                                onChange={(newTags) => setEditForm({ ...editForm, perfumers: newTags.join(',') })}
                                                suggestions={availableNotes}
                                                placeholder="..."
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 p-4 bg-green-50 rounded-2xl border border-green-100">
                                        <h4 className="text-[10px] font-black text-green-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                            ניהול מבצע (Promotion)
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <label className="text-[9px] font-black text-green-700 uppercase tracking-widest block mb-1 opacity-70">אחוז הנחה (%)</label>
                                                <input
                                                    type="number"
                                                    value={editForm.discount_percentage}
                                                    onChange={e => setEditForm({ ...editForm, discount_percentage: Number(e.target.value) })}
                                                    onWheel={(e) => e.target.blur()}
                                                    className="border-2 border-green-100 rounded-2xl px-4 h-[60px] w-full bg-white focus:border-green-600 outline-none transition-all font-black text-sm text-green-600"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="text-[9px] font-black text-green-700 uppercase tracking-widest block mb-1 opacity-70">תאריך סיום (אופציונלי):</label>
                                                <ModernDateTimePicker 
                                                    value={editForm.discount_end_date}
                                                    onChange={val => setEditForm({ ...editForm, discount_end_date: val })}
                                                    placeholder="בחר תאריך סיום..."
                                                    className="h-[60px]"
                                                />
                                                <p className="text-[8px] text-green-500 mt-1">השאר ריק למבצע ללא הגבלת זמן</p>
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black text-green-700 uppercase tracking-widest block mb-1 opacity-70">גדלים במבצע:</label>
                                                <div className="flex flex-wrap gap-2 mt-1.5">
                                                    {['2ml', '5ml', '10ml'].map(size => (
                                                        <label key={size} className="flex items-center gap-2 cursor-pointer group bg-white/50 p-1.5 px-3 rounded-lg border border-green-50 hover:bg-white transition-colors">
                                                            <input
                                                                type="checkbox"
                                                                checked={(editForm.discount_sizes || []).includes(size)}
                                                                onChange={(e) => {
                                                                    const current = editForm.discount_sizes || [];
                                                                    const next = e.target.checked 
                                                                        ? [...current, size] 
                                                                        : current.filter(s => s !== size);
                                                                    setEditForm({ ...editForm, discount_sizes: next });
                                                                }}
                                                                className="w-4 h-4 accent-green-600"
                                                            />
                                                            <span className="text-xs font-black text-green-800 group-hover:text-green-600 transition-colors">{size}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-gray-100">
                                    <button onClick={handleCancel} className="bg-gray-100 text-gray-600 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-gray-200 transition-colors">ביטול</button>
                                    <button onClick={handleSave} className="bg-black text-white px-10 py-3 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-gray-800 transition-all shadow-md active:scale-95">שמור שינויים</button>
                                </div>
                            </div >
                        ) : (
                            <div className="flex-1 flex items-center gap-4 md:gap-6 w-full rtl">
                                {product.image_url ? (
                                    <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 bg-white rounded-[1.5rem] border border-gray-100 overflow-hidden shadow-sm shadow-gray-100/50 relative">
                                        <Image src={product.image_url} alt={product.model} fill className="object-contain p-1" sizes="(max-width: 768px) 64px, 80px" />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 bg-gray-50 rounded-[1.5rem] border border-gray-100 flex items-center justify-center text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                        no img
                                    </div>
                                )}
                                <div className="flex-1 flex flex-col min-w-0 space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-black text-lg md:text-xl text-gray-900 leading-none truncate">{product.brand}</h3>
                                        <div className={`font-black text-[9px] md:text-[10px] px-2.5 py-1 rounded-full uppercase tracking-widest border shadow-sm ${(product.stock || 0) <= 20 ? 'bg-red-50 text-red-700 border-red-100/50' :
                                            (product.stock || 0) <= 50 ? 'bg-orange-50 text-orange-700 border-orange-100/50' :
                                                'bg-green-50 text-green-700 border-green-100/50'
                                            }`}>
                                            מלאי: {product.stock || 0} מ״ל
                                        </div>
                                        {product.discount_percentage > 0 && (!product.discount_end_date || new Date(product.discount_end_date) > new Date()) && (
                                            <div className="font-black text-[9px] md:text-[10px] px-2.5 py-1 rounded-full uppercase tracking-widest border shadow-sm bg-emerald-50 text-emerald-700 border-emerald-100/50">
                                                {product.discount_percentage}% הנחה
                                            </div>
                                        )}
                                        {product.active === false && (
                                            <div className="font-black text-[9px] md:text-[10px] px-2.5 py-1 rounded-full uppercase tracking-widest border shadow-sm bg-gray-800 text-white border-gray-900">
                                                טיוטה
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-gray-500 font-bold text-sm md:text-base leading-tight line-clamp-1">
                                        {product.brand_he || product.brand} • {product.model_he || product.model}
                                    </div>
                                    <div className="flex items-center gap-2 md:gap-3">
                                        {(() => {
                                            const costPerMl = (product.cost_price || 0) / (product.original_size || 100);
                                            const profit2ml = Math.round((product.price_2ml || 0) - (costPerMl * 2));
                                            const profit5ml = Math.round((product.price_5ml || 0) - (costPerMl * 5));
                                            const profit10ml = Math.round((product.price_10ml || 0) - (costPerMl * 10));

                                            return (
                                                <>
                                                    <span className="text-[10px] font-black text-pink-600 bg-pink-50 px-2.5 py-1 rounded-xl border border-pink-100 flex items-center gap-2 shadow-sm">
                                                        <span dir="ltr">₪ {profit2ml.toLocaleString()}</span>
                                                        <span className="text-[8px] opacity-40 font-bold">(2ml)</span>
                                                    </span>
                                                    <span className="text-[10px] font-black text-violet-600 bg-violet-50 px-2.5 py-1 rounded-xl border border-violet-100 flex items-center gap-2 shadow-sm">
                                                        <span dir="ltr">₪ {profit5ml.toLocaleString()}</span>
                                                        <span className="text-[8px] opacity-40 font-bold">(5ml)</span>
                                                    </span>
                                                    <span className="text-[10px] font-black text-fuchsia-600 bg-fuchsia-50 px-2.5 py-1 rounded-xl border border-fuchsia-100 flex items-center gap-2 shadow-sm">
                                                        <span dir="ltr">₪ {profit10ml.toLocaleString()}</span>
                                                        <span className="text-[8px] opacity-40 font-bold">(10ml)</span>
                                                    </span>
                                                </>
                                            );
                                        })()}
                                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest opacity-60">רווח ליחידת מידה</div>
                                    </div>
                                </div>
                            </div>
                        )
                        }

                        {editingId !== product.id && canEdit && (
                            <div className="flex md:flex-col gap-2 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                                <button onClick={() => startEdit(product)} className="flex-1 bg-black text-white px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-md hover:bg-gray-800 transition-all active:scale-95">
                                    עדכן מוצר
                                </button>
                                <button onClick={() => handleDelete(product.id)} className="flex-1 md:flex-none text-red-500 hover:text-red-700 bg-red-50 rounded-2xl border border-red-100/50 px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors hover:bg-red-100/50">
                                    מחק
                                </button>
                            </div>
                        )}
                    </div >
                ))}
            </div >

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-12 py-8 border-t border-gray-100">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`w-12 h-12 flex items-center justify-center border-2 border-gray-100 rounded-[1.25rem] transition-all hover:bg-gray-50 active:shadow-inner active:scale-95 ${currentPage === 1 ? 'opacity-30 pointer-events-none' : 'shadow-sm'}`}
                    >
                        →
                    </button>
                    
                    <div className="bg-gray-100 px-6 py-2.5 rounded-2xl text-[11px] font-black text-gray-500 uppercase tracking-widest leading-none shadow-sm border border-gray-200/50">
                        עמוד <span dir="ltr">{currentPage} / {totalPages}</span>
                    </div>

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`w-12 h-12 flex items-center justify-center border-2 border-gray-100 rounded-[1.25rem] transition-all hover:bg-gray-50 active:shadow-inner active:scale-95 ${currentPage === totalPages ? 'opacity-30 pointer-events-none' : 'shadow-sm'}`}
                    >
                        ←
                    </button>
                </div>
            )}
        </div >
    );
}
