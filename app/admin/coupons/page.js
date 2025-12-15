"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleCreate = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/admin/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                setShowModal(false);
                setFormData({ code: '', discount_percent: 5, expires_in_hours: '', email: '' });
                fetchCoupons();
            } else {
                alert(data.error || 'שגיאה ביצירה');
            }
        } catch (err) {
            alert('שגיאה');
        } finally {
            setIsSubmitting(false);
        }
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
                    <button onClick={() => setShowModal(true)} className="btn btn-primary bg-black text-white px-6 py-2 rounded-lg">
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
                                <CouponRow key={coupon.id} coupon={coupon} onDelete={handleDelete} />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-6">יצירת קופון חדש</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">קוד קופון</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        className="input border p-2 rounded w-full"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    />
                                    <button type="button" onClick={generateCode} className="text-sm text-blue-600 font-bold whitespace-nowrap">ג'נרט</button>
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
                                    <label className="block text-sm font-bold mb-1">תוקף (שעות)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="ללא הגבלה"
                                        className="input border p-2 rounded w-full"
                                        value={formData.expires_in_hours}
                                        onChange={e => setFormData({ ...formData, expires_in_hours: e.target.value })}
                                    />
                                    <span className="text-xs text-gray-400">השאר ריק לתמיד</span>
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
                                    {isSubmitting ? 'יוצר...' : 'צור קופון'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function CouponRow({ coupon, onDelete }) {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (!coupon.expires_at) return;

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
            <td className="p-4">
                <button onClick={() => onDelete(coupon.id)} className="text-red-500 hover:bg-red-50 p-2 rounded opacity-0 group-hover:opacity-100 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                </button>
            </td>
        </tr>
    );
}
