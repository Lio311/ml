"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState([]);
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 5;
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Edit State
    const [editingId, setEditingId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        discount_percent: 5,
        expires_in_hours: '',
        email: ''
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

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

    const handleDelete = async (id) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק קופון זה?')) return;
        try {
            const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setCoupons(prev => prev.filter(c => c.id !== id));
            }
        } catch (err) {
            alert('שגיאה במחיקה');
        }
    };

    // Prepare Edit
    const handleEdit = (coupon) => {
        setEditingId(coupon.id);

        let expiresInHours = '';
        if (coupon.expires_at) {
            // Calculate approximate hours left or original duration? 
            // Usually simpler to just show what's there? 
            // But the API expects "expires_in_hours" to ADD time to now? 
            // Wait, my PUT API accepts "expires_at" timestamp directly.
            // But my Form inputs "hours".
            // So if editing, I should probably ask for "Extend by X hours" or "Set new Date"?
            // Keeping it simple: If editing, "expires_in_hours" will be treated as "Set expiry to NOW + X hours".
            // So I leave it empty initially.
        }

        setFormData({
            code: coupon.code,
            discount_percent: coupon.discount_percent,
            expires_in_hours: '', // Reset, user enters new duration if they want to change
            email: coupon.email || ''
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const url = editingId ? `/api/admin/coupons/${editingId}` : '/api/admin/coupons';
            const method = editingId ? 'PUT' : 'POST';

            // Prepare Body
            // If editing, we only send what changed or everything?
            // The API handles full updates? 
            // My PUT API takes { discount_percent, expires_at }
            // So I need to convert expires_in_hours to expires_at IS provided.

            let payload = { ...formData };
            if (payload.expires_in_hours) {
                payload.expires_at = new Date(Date.now() + payload.expires_in_hours * 60 * 60 * 1000);
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
                alert(data.error || 'שגיאה');
            }
        } catch (err) {
            alert('שגיאה');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ code: '', discount_percent: 5, expires_in_hours: '', email: '' });
    };

    const openCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    // Auto-generate code
    const generateCode = () => {
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        setFormData(prev => ({ ...prev, code: `SALE-${random}` }));
    };

    return (
        <div className="container mx-auto py-8 text-right" dir="rtl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">ניהול קופונים</h1>
                <div className="flex gap-4">
                    <Link href="/admin" className="btn btn-ghost">חזרה</Link>
                    <button onClick={openCreateModal} className="btn btn-primary bg-black text-white px-6 py-2 rounded-lg">
                        + קופון חדש
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b text-gray-500 text-sm">
                        <tr>
                            <th className="p-4 text-center">קוד קופון</th>
                            <th className="p-4 text-center">הנחה</th>
                            <th className="p-4 text-center">תוקף (שעון עצר)</th>
                            <th className="p-4 text-center">משויך ל-</th>
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
                                    <CouponRow key={coupon.id} coupon={coupon} onDelete={handleDelete} onEdit={handleEdit} />
                                ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {Math.ceil(coupons.length / ITEMS_PER_PAGE) > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8 mb-12">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 transition"
                    >
                        הקודם
                    </button>
                    <span className="text-sm font-bold text-gray-600">
                        עמוד {page} מתוך {Math.ceil(coupons.length / ITEMS_PER_PAGE)}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(Math.ceil(coupons.length / ITEMS_PER_PAGE), p + 1))}
                        disabled={page === Math.ceil(coupons.length / ITEMS_PER_PAGE)}
                        className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 transition"
                    >
                        הבא
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-6">{editingId ? 'עריכת קופון' : 'יצירת קופון חדש'}</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">קוד קופון</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        disabled={!!editingId} // Disable code edit
                                        className="input border p-2 rounded w-full disabled:bg-gray-100 placeholder-right"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    />
                                    {!editingId && <button type="button" onClick={generateCode} className="text-sm text-blue-600 font-bold whitespace-nowrap">ג'נרט</button>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1">אחוז הנחה</label>
                                    <input
                                        type="number"
                                        required
                                        min="1" max="100"
                                        className="input border p-2 rounded w-full text-center"
                                        value={formData.discount_percent}
                                        onChange={e => setFormData({ ...formData, discount_percent: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">
                                        {editingId ? 'הארך תוקף (שעות)' : 'תוקף (שעות)'}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder={editingId ? "הזן כדי לעדכן" : "ללא הגבלה"}
                                        className="input border p-2 rounded w-full text-center"
                                        value={formData.expires_in_hours}
                                        onChange={e => setFormData({ ...formData, expires_in_hours: e.target.value })}
                                    />
                                    {!editingId && <span className="text-xs text-gray-400 block text-center mt-1">השאר ריק לתמיד</span>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-1">מייל לקוח (ורסיאני)</label>
                                <input
                                    type="email"
                                    placeholder="אופציונלי - לשיוך אישי"
                                    className="input border p-2 rounded w-full"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
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

function CouponRow({ coupon, onDelete, onEdit }) {
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
            <td className="p-4 text-sm text-center">{coupon.email || '-'}</td>
            <td className="p-4 text-center">
                <span className={`px-2 py-1 rounded-full text-xs font-bold inline-block min-w-[60px] ${isActive ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                    {isActive ? 'פעיל' : (isRedeemed ? 'מומש' : 'לא פעיל')}
                </span>
            </td>
            <td className="p-4 flex gap-2 justify-center">
                <button
                    onClick={() => onEdit(coupon)}
                    className="text-blue-500 hover:bg-blue-50 p-2 rounded opacity-0 group-hover:opacity-100 transition"
                    title="ערוך"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                </button>
                <button
                    onClick={() => onDelete(coupon.id)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded opacity-0 group-hover:opacity-100 transition"
                    title="מחק"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                </button>
            </td>
        </tr>
    );
}
