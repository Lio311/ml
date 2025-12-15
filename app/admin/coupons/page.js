"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState([]);
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
                            <th className="p-4 text-right">קוד קופון</th>
                            <th className="p-4 text-right">הנחה</th>
                            <th className="p-4 text-right">תוקף (שעון עצר)</th>
                            <th className="p-4 text-right">משויך ל-</th>
                            <th className="p-4 text-right">סטטוס</th>
                            <th className="p-4 text-right">פעולות</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr><td colSpan="6" className="p-8 text-center">טוען...</td></tr>
                        ) : coupons.length === 0 ? (
                            <tr><td colSpan="6" className="p-8 text-center text-gray-500">אין קופונים במערכת</td></tr>
                        ) : (
                            coupons.map(coupon => (
                                <CouponRow key={coupon.id} coupon={coupon} onDelete={handleDelete} onEdit={handleEdit} />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

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
                                        className="input border p-2 rounded w-full disabled:bg-gray-100"
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
                                        className="input border p-2 rounded w-full"
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
                                        placeholder={editingId ? "הזן כדי לעדכן תוקף" : "ללא הגבלה"}
                                        className="input border p-2 rounded w-full"
                                        value={formData.expires_in_hours}
                                        onChange={e => setFormData({ ...formData, expires_in_hours: e.target.value })}
                                    />
                                    {!editingId && <span className="text-xs text-gray-400">השאר ריק לתמיד</span>}
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

    useEffect(() => {
        if (!coupon.expires_at) {
            setTimeLeft(null);
            return;
        }

        const updateTimer = () => {
            const now = new Date().getTime();
            const expiry = new Date(coupon.expires_at).getTime();
            const diff = expiry - now;

            if (diff <= 0) {
                setTimeLeft('פג תוקף');
            } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [coupon.expires_at]);

    return (
        <tr className="hover:bg-gray-50 transition group">
            <td className="p-4 font-mono font-bold text-blue-600 select-all">{coupon.code}</td>
            <td className="p-4">{coupon.discount_percent}%</td>
            <td className="p-4 font-mono">
                {coupon.expires_at ? (
                    <span className={timeLeft === 'פג תוקף' ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>
                        {timeLeft}
                    </span>
                ) : (
                    <span className="text-gray-400">תמיד</span>
                )}
            </td>
            <td className="p-4 text-sm">{coupon.email || '-'}</td>
            <td className="p-4">
                <span className={`px-2 py-1 rounded-full text-xs ${coupon.status === 'active' && timeLeft !== 'פג תוקף' ? 'bg-green-100 text-green-800' :
                        coupon.status === 'redeemed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                    }`}>
                    {coupon.status === 'redeemed' ? 'מומש' : (timeLeft === 'פג תוקף' ? 'פג תוקף' : 'פעיל')}
                </span>
            </td>
            <td className="p-4 flex gap-2">
                <button
                    onClick={() => onEdit(coupon)}
                    className="text-blue-500 hover:bg-blue-50 p-2 rounded opacity-0 group-hover:opacity-100 transition"
                    title="ערוך"
                >
                    ✏️
                </button>
                <button
                    onClick={() => onDelete(coupon.id)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded opacity-0 group-hover:opacity-100 transition"
                    title="מחק"
                >
                    🗑️
                </button>
            </td>
        </tr>
    );
}
