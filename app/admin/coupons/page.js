"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from "@clerk/nextjs";
import ObjectTagInput from '@/app/components/ObjectTagInput';
import toast from 'react-hot-toast';


export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState([]);
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 6;
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useUser();
    const canEdit = user?.publicMetadata?.role === 'admin' || user?.emailAddresses[0]?.emailAddress === 'lior31197@gmail.com';

    // Data for selectors
    const [products, setProducts] = useState([]);
    const [brands, setBrands] = useState([]);
    const [usersList, setUsersList] = useState([]); // Users for Shayichut

    // Edit State
    const [editingId, setEditingId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        discount_percent: 5,
        expires_in_hours: '',
        email: '',
        // Limitations
        allowed_sizes: [],
        allowed_categories: [], // Reverted to Categories
        allowed_brands: [],
        allowed_products: [], // IDs
        allowed_users: [], // New User Affiliation
        min_cart_total: 0
    });

    useEffect(() => {
        fetchCoupons();
        fetchAuxData();
    }, []);

    const fetchAuxData = async () => {
        try {
            const [prodRes, brandRes, userRes] = await Promise.all([
                fetch('/api/products?limit=1000'),
                fetch('/api/brands'),
                fetch('/api/admin/users') // Reuse existing users endpoint (GET)
            ]);

            if (prodRes.ok) {
                const data = await prodRes.json();
                setProducts(data.products || []);
            }
            if (brandRes.ok) setBrands(await brandRes.json());
            if (userRes.ok) setUsersList(await userRes.json());

        } catch (e) {
            console.error("Failed to load aux data", e);
        }
    };

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/coupons');
            if (res.ok) {
                setCoupons(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        toast((t) => (
            <div className="flex flex-col gap-2">
                <p className="font-medium text-sm">האם אתה בטוח שברצונך למחוק קופון זה?</p>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            deleteCoupon(id);
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

    const deleteCoupon = async (id) => {
        if (loading) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('הקופון נמחק בהצלחה');
                fetchCoupons();
            } else {
                toast.error('שגיאה במחיקת הקופון');
            }
        } catch (error) {
            console.error(error);
            toast.error('שגיאה בתקשורת');
        } finally {
            setLoading(false);
        }
    };

    // Prepare Edit
    const handleEdit = (coupon) => {
        setEditingId(coupon.id);

        // Parse limitations
        const limits = coupon.limitations || {};

        setFormData({
            code: coupon.code,
            discount_percent: coupon.discount_percent,
            expires_in_hours: '',
            email: coupon.email || '',
            allowed_sizes: limits.allowed_sizes || [],
            allowed_categories: limits.allowed_categories || [],
            allowed_brands: limits.allowed_brands || [],
            allowed_products: limits.allowed_products || [],
            allowed_users: limits.allowed_users || [],
            min_cart_total: limits.min_cart_total || 0
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const url = editingId ? `/api/admin/coupons/${editingId}` : '/api/admin/coupons';
            const method = editingId ? 'PUT' : 'POST';

            let payload = {
                code: formData.code,
                discount_percent: Number(formData.discount_percent),
                email: formData.email,
                limitations: {
                    allowed_sizes: formData.allowed_sizes.length > 0 ? formData.allowed_sizes : null,
                    allowed_categories: formData.allowed_categories.length > 0 ? formData.allowed_categories : null,
                    allowed_brands: formData.allowed_brands.length > 0 ? formData.allowed_brands : null,
                    allowed_products: formData.allowed_products.length > 0 ? formData.allowed_products : null,
                    allowed_users: formData.allowed_users.length > 0 ? formData.allowed_users : null,
                    min_cart_total: Number(formData.min_cart_total) || 0
                }
            };

            if (formData.expires_in_hours) {
                payload.expires_at = new Date(Date.now() + formData.expires_in_hours * 60 * 60 * 1000);
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok) {
                setShowModal(false);
                resetForm();
                fetchCoupons();
            } else {
                toast.error(data.error || 'שגיאה');
            }
        } catch (err) {
            toast.error('שגיאה');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            code: '', discount_percent: 5, expires_in_hours: '', email: '',
            allowed_sizes: [], allowed_categories: [], allowed_brands: [], allowed_products: [], allowed_users: [], min_cart_total: 0
        });
    };

    const openCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    const generateCode = () => {
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        setFormData(prev => ({ ...prev, code: `SALE-${random}` }));
    };

    // Enforce Hierarchy: Product > Brand/Category
    // If specific products are selected, clear brands and categories
    useEffect(() => {
        if (formData.allowed_products.length > 0) {
            if (formData.allowed_brands.length > 0 || formData.allowed_categories.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    allowed_brands: [],
                    allowed_categories: []
                }));
            }
        }
    }, [formData.allowed_products]);

    // Helper for multi-select
    const toggleSelection = (field, value) => {
        // Prevent selecting categories if products are selected
        if (field === 'allowed_categories' && formData.allowed_products.length > 0) return;

        setFormData(prev => {
            const current = prev[field];
            if (current.includes(value)) {
                return { ...prev, [field]: current.filter(v => v !== value) };
            } else {
                return { ...prev, [field]: [...current, value] };
            }
        });
    };

    const totalPages = Math.ceil(coupons.length / ITEMS_PER_PAGE);

    return (
        <div className="container mx-auto py-8 text-right" dir="rtl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">ניהול קופונים</h1>
                <div className="flex gap-4">
                    <Link href="/admin" className="btn btn-ghost">חזרה</Link>
                    {canEdit && (
                        <button onClick={openCreateModal} className="btn btn-primary bg-black text-white px-6 py-2 rounded-lg">
                            + קופון חדש
                        </button>
                    )}
                </div>

            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b text-gray-500 text-sm">
                        <tr>
                            <th className="p-4 text-center">קוד קופון</th>
                            <th className="p-4 text-center">הנחה</th>
                            <th className="p-4 text-center">תוקף (שעון עצר)</th>
                            <th className="p-4 text-center">הגבלות</th>
                            <th className="p-4 text-center">סטטוס</th>
                            <th className="p-4 text-center">פעולות</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr><td colSpan="6" className="p-8 text-center">טוען...</td></tr>
                        ) : coupons.length === 0 ? (
                            <tr><td colSpan="6" className="p-8 text-center text-gray-500">אין קופונים במערכת</td></tr>
                        ) : (
                            coupons
                                .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
                                .map(coupon => (
                                    <CouponRow key={coupon.id} coupon={coupon} onDelete={handleDelete} onEdit={handleEdit} canEdit={canEdit} />
                                ))
                        )}

                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8 mb-12">
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 py-2">
                    {/* Added mr-64 to shift left, reduced padding for compactness */}
                    <div className="bg-white p-6 rounded-xl w-full max-w-5xl shadow-2xl relative mr-64 max-h-[95vh] overflow-y-auto custom-scrollbar">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 left-4 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                        <h2 className="text-xl font-bold mb-6">{editingId ? 'עריכת קופון' : 'יצירת קופון חדש'}</h2>
                        <form onSubmit={handleSave} className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left Column: Basic Info */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg text-gray-800 border-b pb-2 mb-4">פרטים כלליים</h3>

                                    <div>
                                        <label className="block text-sm font-bold mb-1">קוד קופון</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                required
                                                disabled={!!editingId}
                                                className="input border p-2 rounded w-full disabled:bg-gray-200"
                                                value={formData.code}
                                                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            />
                                            {!editingId && <button type="button" onClick={generateCode} className="text-sm text-blue-600 font-bold whitespace-nowrap">ג'נרט</button>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold mb-1">הנחה (%)</label>
                                        <input
                                            type="number"
                                            required
                                            min="1" max="100"
                                            className="input border p-2 rounded w-full"
                                            value={formData.discount_percent}
                                            onChange={e => setFormData({ ...formData, discount_percent: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold mb-1">{editingId ? 'הארך תוקף (שעות)' : 'תוקף (שעות)'}</label>
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder={editingId ? "הזן כדי לעדכן" : "ללא הגבלה"}
                                            className="input border p-2 rounded w-full"
                                            value={formData.expires_in_hours}
                                            onChange={e => setFormData({ ...formData, expires_in_hours: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold mb-1">מינימום סל (בש"ח)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="input border p-2 rounded w-full"
                                            value={formData.min_cart_total}
                                            onChange={e => setFormData({ ...formData, min_cart_total: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Right Column: Advanced Filters */}
                                <div className="space-y-4 bg-gray-50 p-6 rounded-xl">
                                    <h3 className="font-bold text-lg text-gray-800 border-b pb-2 mb-4">הגבלות ופילטרים (אופציונלי)</h3>

                                    {/* Categories */}
                                    <div className={`mb-4 ${formData.allowed_products.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <label className="block text-sm font-bold mb-2">
                                            תקף לקטגוריות:
                                            {formData.allowed_products.length > 0 && <span className="text-xs text-red-500 mr-2">(מבוטל בגלל בחירת מוצרים ספציפיים)</span>}
                                        </label>
                                        <div className="flex gap-3 flex-wrap">
                                            {['men', 'women', 'unisex'].map(c => (
                                                <label key={c} className="flex items-center gap-2 bg-white px-3 py-1 rounded cursor-pointer border hover:border-black transition">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.allowed_categories.includes(c)}
                                                        onChange={() => toggleSelection('allowed_categories', c)}
                                                        disabled={formData.allowed_products.length > 0}
                                                    />
                                                    <span className="text-sm">
                                                        {c === 'men' ? 'גברים' : c === 'women' ? 'נשים' : 'יוניסקס'}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Sizes */}
                                    <div>
                                        <label className="block text-sm font-bold mb-2">תקף לגדלים:</label>
                                        <div className="flex gap-3 flex-wrap">
                                            {[2, 5, 10, 11].map(s => (
                                                <label key={s} className="flex items-center gap-2 bg-white px-3 py-1 rounded cursor-pointer border hover:border-black transition">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.allowed_sizes.includes(s)}
                                                        onChange={() => toggleSelection('allowed_sizes', s)}
                                                    />
                                                    <span className="text-sm">{s === 11 ? '10 מ"ל יוקרתי' : s + ' מ"ל'}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* User Affiliation */}
                                    <div>
                                        <label className="block text-sm font-bold mb-2">שייכות (משתמשים):</label>
                                        <ObjectTagInput
                                            options={usersList.map(u => ({ id: u.email, label: `${u.firstName || ''} ${u.lastName || ''}`, subLabel: u.email }))}
                                            value={formData.allowed_users}
                                            onChange={(newVal) => setFormData(prev => ({ ...prev, allowed_users: newVal }))}
                                            placeholder="חפש משתמש..."
                                        />
                                    </div>

                                    {/* Brands */}
                                    <div className={`mb-4 ${formData.allowed_products.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <label className="block text-sm font-bold mb-2">
                                            מותגים ספציפיים:
                                            {formData.allowed_products.length > 0 && <span className="text-xs text-red-500 mr-2">(מבוטל בגלל בחירת מוצרים ספציפיים)</span>}
                                        </label>
                                        <ObjectTagInput
                                            options={brands.map(b => ({ id: b.name, label: b.name }))}
                                            value={formData.allowed_brands}
                                            onChange={(newVal) => setFormData(prev => ({ ...prev, allowed_brands: newVal }))}
                                            placeholder="חפש מותג..."
                                        />
                                    </div>

                                    {/* Products */}
                                    <div>
                                        <label className="block text-sm font-bold mb-2">מוצרים ספציפיים:</label>
                                        <ObjectTagInput
                                            options={products.map(p => ({ id: p.id, label: p.name, subLabel: p.brand }))}
                                            value={formData.allowed_products}
                                            onChange={(newVal) => setFormData(prev => ({ ...prev, allowed_products: newVal }))}
                                            placeholder="חפש מוצר..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8 border-t pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 hover:bg-gray-100 rounded">ביטול</button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-black text-white rounded font-bold hover:bg-gray-800"
                                >
                                    {isSubmitting ? 'שומר...' : (editingId ? 'עדכן קופון' : 'צור קופון')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function CouponRow({ coupon, onDelete, onEdit, canEdit }) {

    const [timeLeft, setTimeLeft] = useState(null);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!coupon.expires_at) {
            setTimeLeft(null);
            setIsExpired(false);
            return;
        }

        const updateTimer = () => {
            const now = new Date().getTime();
            const expiry = new Date(coupon.expires_at).getTime();
            const diff = expiry - now;

            if (diff <= 0) {
                setTimeLeft('פג תוקף');
                setIsExpired(true);
            } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
                setIsExpired(false);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [coupon.expires_at]);

    // Determine status logic per user request
    const isActive = coupon.status === 'active' && !isExpired;
    const isRedeemed = coupon.status === 'redeemed';
    const limits = coupon.limitations || {};
    const activeFilters = [];
    if (limits.allowed_sizes?.length > 0) activeFilters.push('גודל');
    if (limits.allowed_categories?.length > 0) activeFilters.push('קטגוריה');
    if (limits.allowed_brands?.length > 0) activeFilters.push('מותג');
    if (limits.allowed_products?.length > 0) activeFilters.push('מוצר');
    if (limits.allowed_users?.length > 0) activeFilters.push('שייכות');
    if (limits.min_cart_total > 0) activeFilters.push('מינימום סל');

    return (
        <tr className="hover:bg-gray-50 transition group">
            <td className="p-4 font-mono font-bold text-blue-600 select-all text-center">{coupon.code}</td>
            <td className="p-4 text-center">{coupon.discount_percent}%</td>
            <td className="p-4 font-mono text-center">
                {coupon.expires_at ? (
                    <span className={isExpired ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>
                        {timeLeft}
                    </span>
                ) : (
                    <span className="text-gray-400">תמיד</span>
                )}
            </td>
            <td className="p-4 text-center text-xs text-gray-500 max-w-[200px] truncate" title={activeFilters.join(', ')}>
                {activeFilters.length > 0 ? activeFilters.join(', ') : 'כל האתר'}
            </td>
            <td className="p-4 text-center">
                <span className={`px-2 py-1 rounded-full text-xs font-bold inline-block min-w-[60px] ${isActive ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                    {isActive ? 'פעיל' : (isRedeemed ? 'מומש' : 'לא פעיל')}
                </span>
            </td>
            <td className="p-4 flex gap-2 justify-center">
                {canEdit ? (
                    <>
                        <button
                            onClick={() => onEdit(coupon)}
                            className="text-blue-500 hover:bg-blue-50 p-2 rounded transition"
                            title="ערוך"
                        >
                            <Edit2Icon />
                        </button>
                        <button
                            onClick={() => onDelete(coupon.id)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded transition"
                            title="מחק"
                        >
                            <TrashIcon />
                        </button>
                    </>
                ) : (
                    <span className="text-gray-400 text-xs">צפייה בלבד</span>
                )}
            </td>

        </tr>
    );
}

function Edit2Icon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
        </svg>
    )
}

function TrashIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
    )
}
