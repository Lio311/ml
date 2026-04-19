"use client";

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Check, X, Plus, Edit2, Trash2 } from 'lucide-react';

export default function InfluencerClient() {
    const [influencers, setInfluencers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        base_salary: 0,
        commission_percent: 10
    });

    useEffect(() => {
        fetchInfluencers();
    }, []);

    const fetchInfluencers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/influencers');
            if (res.ok) {
                const data = await res.json();
                setInfluencers(data);
            }
        } catch (err) {
            console.error(err);
            toast.error("שגיאה בטעינת משפיענים");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const url = editingId ? `/api/admin/influencers/${editingId}` : '/api/admin/influencers';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success(editingId ? 'המשפיען עודכן' : 'משפיען חדש נוסף');
                setShowModal(false);
                resetForm();
                fetchInfluencers();
            } else {
                toast.error('שגיאה בשמירה');
            }
        } catch (err) {
            toast.error('שגיאה בתקשורת');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק משפיען זה?')) return;
        try {
            const res = await fetch(`/api/admin/influencers/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('המשפיען נמחק');
                fetchInfluencers();
            }
        } catch (err) {
            toast.error('שגיאה במחיקה');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', base_salary: 0, commission_percent: 10 });
        setEditingId(null);
    };

    const openEdit = (inf) => {
        setFormData({
            name: inf.name,
            base_salary: inf.base_salary,
            commission_percent: inf.commission_percent
        });
        setEditingId(inf.id);
        setShowModal(true);
    };

    const calculatePay = (inf) => {
        const sales = parseFloat(inf.total_sales || 0);
        const commission = (sales * (parseFloat(inf.commission_percent) / 100)) * 0.82;
        return parseFloat(inf.base_salary || 0) + commission;
    };

    const isProfitable = (inf) => {
        const sales = parseFloat(inf.total_sales || 0);
        const pay = calculatePay(inf);
        return sales >= 2 * pay;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8 px-4">
                <h1 className="text-3xl font-black tracking-tight text-gray-900">ניהול משפיענים</h1>
                <button 
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-black text-white px-6 py-2.5 rounded-2xl font-black shadow-xl hover:bg-gray-800 transition flex items-center gap-2 text-sm uppercase tracking-widest"
                >
                    <Plus className="w-4 h-4" /> משפיען חדש
                </button>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right" dir="rtl">
                        <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                            <tr>
                                <th className="p-5 text-center">שם</th>
                                <th className="p-5 text-center">שכר בסיס</th>
                                <th className="p-5 text-center">עמלה (%)</th>
                                <th className="p-5 text-center">קופון משויך</th>
                                <th className="p-5 text-center">שימושים</th>
                                <th className="p-5 text-center">סה"כ מכירות (נטו)</th>
                                <th className="p-5 text-center">שכר משפיען</th>
                                <th className="p-5 text-center">משתלם</th>
                                <th className="p-5 text-center">פעולות</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 font-bold">
                            {loading ? (
                                <tr><td colSpan="9" className="p-10 text-center text-gray-400">טוען...</td></tr>
                            ) : influencers.length === 0 ? (
                                <tr><td colSpan="9" className="p-10 text-center text-gray-400 italic">אין משפיענים רשומים</td></tr>
                            ) : influencers.map((inf) => (
                                <tr key={inf.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="p-5 text-center text-gray-900">{inf.name}</td>
                                    <td className="p-5 text-center text-gray-600">₪ {parseFloat(inf.base_salary).toLocaleString()}</td>
                                    <td className="p-5 text-center text-blue-600">{inf.commission_percent}%</td>
                                    <td className="p-5 flex justify-center py-5">
                                        {inf.coupon_code ? (
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-black border border-blue-100">
                                                {inf.coupon_code}
                                            </span>
                                        ) : (
                                            <span className="text-gray-300 font-light">—</span>
                                        )}
                                    </td>
                                    <td className="p-5 text-center text-gray-600">{inf.usage_count || 0}</td>
                                    <td className="p-5 text-center text-gray-900">₪ {parseFloat(inf.total_sales || 0).toLocaleString()}</td>
                                    <td className="p-5 text-center text-indigo-600">₪ {calculatePay(inf).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                    <td className="p-5 text-center">
                                        <div className="flex justify-center">
                                            {inf.usage_count > 0 ? (
                                                isProfitable(inf) ? (
                                                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 border border-green-100 shadow-sm" title="משתלם">
                                                        <Check className="w-4 h-4" strokeWidth={3} />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 border border-red-100 shadow-sm" title="לא משתלם">
                                                        <X className="w-4 h-4" strokeWidth={3} />
                                                    </div>
                                                )
                                            ) : (
                                                <span className="text-gray-300 font-light">—</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-5 text-center">
                                        <div className="flex justify-center gap-2 transition-opacity">
                                            <button onClick={() => openEdit(inf)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(inf.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -translate-y-16 translate-x-16 -z-10"></div>
                        
                        <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                            {editingId ? 'עריכת משפיען' : 'משפיען חדש'}
                        </h2>

                        <form onSubmit={handleSave} className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">שם המשפיען</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-black transition-all font-bold"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">שכר בסיס</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-black transition-all font-bold pr-10"
                                            value={formData.base_salary}
                                            onChange={e => setFormData({ ...formData, base_salary: e.target.value })}
                                        />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm font-black">₪</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">עמלה (%)</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-black transition-all font-bold pr-10"
                                            value={formData.commission_percent}
                                            onChange={e => setFormData({ ...formData, commission_percent: e.target.value })}
                                        />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm font-black">%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6">
                                <button 
                                    type="submit"
                                    className="flex-1 bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-gray-800 transition shadow-black/20 active:scale-95"
                                >
                                    {editingId ? 'עדכן משפיען' : 'צור משפיען'}
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition active:scale-95"
                                >
                                    ביטול
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
