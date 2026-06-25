"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { useUser } from "@clerk/nextjs";
import toast from 'react-hot-toast';
import CustomDropdown from '../../components/ui/CustomDropdown';
import ModernDateTimePicker from '../../components/ui/ModernDateTimePicker';

export default function AdminExpensesPage() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ description: "", amount: "", type: "monthly", date: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const { user } = useUser();
    const isAdmin = user?.emailAddresses[0]?.emailAddress === process.env.ADMIN_EMAIL;
    const canEdit = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'viewer' || isAdmin;

    useEffect(() => {
        fetchExpenses();
        // Set default date to today
        const today = new Date().toISOString();
        setFormData(prev => ({ ...prev, date: today }));
    }, []);

    const fetchExpenses = async () => {
        try {
            const res = await fetch('/api/admin/expenses');
            if (res.ok) {
                setExpenses(await res.json());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const method = editingId ? 'PUT' : 'POST';
            const body = editingId ? { ...formData, id: editingId } : formData;

            const res = await fetch('/api/admin/expenses', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                fetchExpenses();
                resetForm();
            } else {
                toast.error("Failed to save expense");
            }
        } catch (error) {
            toast.error("Error saving expense");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (id) => {
        toast((t) => (
            <div className="flex flex-col gap-2">
                <p className="font-medium text-sm">האם אתה בטוח שברצונך למחוק הוצאה זו?</p>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            deleteExpense(id);
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

    const deleteExpense = async (id) => {
        try {
            const res = await fetch(`/api/admin/expenses?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('ההוצאה נמחקה');
                fetchExpenses();
            } else {
                toast.error('שגיאה במחיקה');
            }
        } catch (e) {
            toast.error('שגיאה בתקשורת');
        }
    };

    const handleEdit = (expense) => {
        setEditingId(expense.id);
        setFormData({
            description: expense.description,
            amount: expense.amount,
            type: expense.type,
            date: expense.date
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ description: "", amount: "", type: "monthly", date: new Date().toISOString() });
    };

    const ITEMS_PER_PAGE = 5;
    const [page, setPage] = useState(1);

    // Pagination Logic: Slice expenses first, then group them.
    // NOTE: This paginate Items, not Groups. So a group might be split across pages.
    const paginatedExpenses = expenses.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(expenses.length / ITEMS_PER_PAGE);

    const groupedExpenses = paginatedExpenses.reduce((groups, expense) => {
        const date = new Date(expense.date);
        const key = `${date.toLocaleString('he-IL', { month: 'long' })} ${date.getFullYear()}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(expense);
        return groups;
    }, {});

    return (
        <div className="p-4 md:p-8 w-full min-h-screen text-right" dir="rtl">
            <div className="flex justify-between items-center mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">ניהול הוצאות</h1>
            </div>

            {/* Add/Edit Form */}
            {canEdit && (
                <div className={`p-5 md:p-8 rounded-2xl shadow-sm border-2 transition-all duration-300 mb-8 md:mb-12 ${editingId ? 'bg-blue-50 border-blue-200 ring-4 ring-blue-50/50' : 'bg-white border-gray-100'}`}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg md:text-xl font-bold text-gray-900">{editingId ? 'ערוך הוצאה' : 'הוסף הוצאה חדשה'}</h2>
                        {editingId && (
                            <button onClick={resetForm} className="text-xs font-bold text-blue-600 hover:text-blue-800 underline transition-colors">
                                ביטול עריכה
                            </button>
                        )}
                    </div>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                            <div className="md:col-span-12 lg:col-span-5 space-y-1.5">
                                <label className="block text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">תיאור ההוצאה</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full border-gray-200 border-2 rounded-2xl px-4 h-[60px] focus:border-black focus:ring-0 outline-none transition-all text-right text-sm font-bold bg-white"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="לדוגמה: שרתים, ארנונה..."
                                />
                            </div>
                            <div className="md:col-span-4 lg:col-span-2 space-y-1.5">
                                <label className="block text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">סכום (₪)</label>
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    className="w-full border-gray-200 border-2 rounded-2xl px-4 h-[60px] focus:border-black focus:ring-0 outline-none transition-all text-center text-lg font-black bg-white"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    onWheel={(e) => e.target.blur()}
                                />
                            </div>
                            <div className="md:col-span-4 lg:col-span-2 space-y-1.5">
                                <label className="block text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">סוג</label>
                                <CustomDropdown
                                    options={[
                                        { value: 'monthly', label: 'חודשי (חד פ.)' },
                                        { value: 'yearly', label: 'שנתי (ל-12)' },
                                    ]}
                                    value={formData.type}
                                    onChange={(v) => setFormData({ ...formData, type: v })}
                                    fullWidth
                                    className="h-[60px] !rounded-2xl"
                                />
                            </div>
                            <div className="md:col-span-4 lg:col-span-2 space-y-1.5">
                                <label className="block text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">תאריך</label>
                                <ModernDateTimePicker
                                    value={formData.date}
                                    onChange={(v) => setFormData({ ...formData, date: v })}
                                    placeholder="בחר תאריך"
                                    className="h-[60px]"
                                />
                            </div>
                            <div className="md:col-span-12 lg:col-span-1">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full h-[60px] rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 ${editingId ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' : 'bg-black hover:bg-gray-800 shadow-gray-100'}`}
                                >
                                    {isSubmitting ? '...' : (editingId ? 'עדכן' : 'הוסף')}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Expenses List */}
            <div className="space-y-8 md:space-y-12">
                {Object.entries(groupedExpenses).map(([month, items]) => (
                    <div key={month} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50/80 p-5 md:p-6 border-b border-gray-100 flex justify-between items-center">
                            <span className="text-lg md:text-xl font-black text-gray-900">{month}</span>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">סה״כ הוצאות</span>
                                <span className="text-sm md:text-base font-black text-gray-600"><span dir="ltr">₪ {items.reduce((sum, item) => sum + parseFloat(item.amount), 0).toLocaleString()}</span></span>
                            </div>
                        </div>
                        
                        {/* Desktop View Table */}
                        <div className="hidden md:block overflow-x-auto custom-scrollbar">
                            <table className="w-full text-right" dir="rtl">
                                <thead className="text-[10px] md:text-xs text-gray-400 uppercase font-black bg-gray-50/30 border-b border-gray-50">
                                    <tr>
                                        <th className="p-4">תאריך</th>
                                        <th className="p-4">תיאור</th>
                                        <th className="p-4 text-center">סוג</th>
                                        <th className="p-4 text-center">סכום</th>
                                        <th className="p-4 text-center">פעולות</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {items.map(expense => (
                                        <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4 text-xs font-bold text-gray-500 whitespace-nowrap">
                                                {new Date(expense.date).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                            </td>
                                            <td className="p-4 text-sm font-bold text-gray-900">{expense.description}</td>
                                            <td className="p-4 text-center">
                                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${expense.type === 'yearly' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {expense.type === 'yearly' ? 'שנתי' : 'חודשי'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center font-black text-gray-900"><span dir="ltr">₪ {parseFloat(expense.amount).toLocaleString()}</span></td>
                                            <td className="p-4">
                                                {canEdit && (
                                                    <div className="flex justify-center gap-2">
                                                        <button onClick={() => handleEdit(expense)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all" title="ערוך">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                            </svg>
                                                        </button>
                                                        <button onClick={() => handleDelete(expense.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" title="מחק">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile View Card Layout */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {items.map(expense => (
                                <div key={expense.id} className="p-5 flex flex-col gap-4 bg-white hover:bg-gray-50/30 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1 flex-1">
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></span>
                                                {new Date(expense.date).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                            </div>
                                            <div className="font-black text-gray-900 text-[15px] leading-snug">
                                                {expense.description}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end shrink-0">
                                            <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black uppercase mb-2 tracking-widest border ${expense.type === 'yearly' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                                {expense.type === 'yearly' ? 'שנתי' : 'חודשי'}
                                            </span>
                                            <div className="text-lg font-black text-white px-3 py-1 bg-gray-800 rounded-xl shadow-inner"><span dir="ltr">₪ {parseFloat(expense.amount).toLocaleString()}</span></div>
                                        </div>
                                    </div>

                                    {canEdit && (
                                        <div className="flex gap-3 pt-4 border-t border-gray-50 mt-1">
                                            <button onClick={() => handleEdit(expense)} className="flex-1 h-11 bg-blue-50 text-blue-600 rounded-2xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm border border-blue-100/50">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                </svg>
                                                ערוך
                                            </button>
                                            <button onClick={() => handleDelete(expense.id)} className="flex-1 h-11 bg-red-50 text-red-500 rounded-2xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm border border-red-100/50">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                </svg>
                                                מחק
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-12 py-8 border-t border-gray-100">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="w-12 h-12 flex items-center justify-center border-2 border-gray-100 rounded-2xl hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm active:scale-95"
                    >
                        →
                    </button>
                    <div className="bg-gray-100 px-5 py-2.5 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">
                         <span dir="ltr">{page} / {totalPages}</span>
                    </div>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="w-12 h-12 flex items-center justify-center border-2 border-gray-100 rounded-2xl hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm active:scale-95"
                    >
                        ←
                    </button>
                </div>
            )}
        </div>
    );
}
