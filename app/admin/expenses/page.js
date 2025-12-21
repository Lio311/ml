"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { useUser } from "@clerk/nextjs";

export default function AdminExpensesPage() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ description: "", amount: "", type: "monthly", date: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const { user } = useUser();
    const canEdit = user?.publicMetadata?.role === 'admin' || user?.emailAddresses[0]?.emailAddress === 'lior31197@gmail.com';

    useEffect(() => {
        fetchExpenses();
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
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
                alert("Failed to save expense");
            }
        } catch (error) {
            alert("Error saving expense");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure?")) return;
        try {
            const res = await fetch('/api/admin/expenses', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                setExpenses(prev => prev.filter(e => e.id !== id));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdit = (expense) => {
        setEditingId(expense.id);
        setFormData({
            description: expense.description,
            amount: expense.amount,
            type: expense.type,
            date: new Date(expense.date).toISOString().split('T')[0]
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ description: "", amount: "", type: "monthly", date: new Date().toISOString().split('T')[0] });
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
        <div className="p-8 w-full" dir="rtl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">ניהול הוצאות</h1>
            </div>

            {/* Add/Edit Form */}
            {canEdit && (
                <div className="bg-white p-6 rounded-xl shadow-sm border mb-8 transition-colors duration-200" style={{ borderColor: editingId ? '#3b82f6' : '#e5e7eb' }}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">{editingId ? 'ערוך הוצאה' : 'הוסף הוצאה חדשה'}</h2>
                        {editingId && (
                            <button onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-700 underline">
                                ביטול עריכה
                            </button>
                        )}
                    </div>
                    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-bold mb-1">תיאור ההוצאה</label>
                            <input
                                required
                                type="text"
                                className="input border p-2 rounded w-full"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="לדוגמה: שרתים, ארנונה..."
                            />
                        </div>
                        <div className="w-full md:w-32">
                            <label className="block text-sm font-bold mb-1">סכום (₪)</label>
                            <input
                                required
                                type="number"
                                min="0"
                                className="input border p-2 rounded w-full text-center"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>
                        <div className="w-full md:w-40">
                            <label className="block text-sm font-bold mb-1">סוג</label>
                            <select
                                className="input border p-2 rounded w-full"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="monthly">חודשי (חד פעמי)</option>
                                <option value="yearly">שנתי (מתחלק ל-12)</option>
                            </select>
                        </div>
                        <div className="w-full md:w-40">
                            <label className="block text-sm font-bold mb-1">תאריך</label>
                            <input
                                required
                                type="date"
                                className="input border p-2 rounded w-full text-center"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-black hover:bg-gray-800'} text-white px-6 py-2 rounded font-bold disabled:opacity-50 h-[42px] transition-colors`}
                        >
                            {isSubmitting ? '...' : (editingId ? 'עדכן' : 'הוסף')}
                        </button>
                    </form>
                </div>
            )}

            {/* Expenses List */}
            <div className="space-y-8">
                {Object.entries(groupedExpenses).map(([month, items]) => (
                    <div key={month} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="bg-gray-50 p-4 border-b font-bold flex justify-between">
                            <span>{month}</span>
                            <span className="text-gray-500 text-sm">סה״כ: ₪ {items.reduce((sum, item) => sum + parseFloat(item.amount), 0).toLocaleString()}</span>
                        </div>
                        <table className="w-full text-right">
                            <thead className="text-xs text-gray-400 bg-gray-50 border-b">
                                <tr>
                                    <th className="p-3">תאריך</th>
                                    <th className="p-3">תיאור</th>
                                    <th className="p-3 text-center">סוג</th>
                                    <th className="p-3 text-center">סכום</th>
                                    <th className="p-3 text-center">פעולות</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {items.map(expense => (
                                    <tr key={expense.id} className="hover:bg-gray-50">
                                        <td className="p-3 text-sm">{new Date(expense.date).toLocaleDateString('he-IL')}</td>
                                        <td className="p-3 font-medium">{expense.description}</td>
                                        <td className="p-3 text-center">
                                            <span className={`text-xs px-2 py-1 rounded-full ${expense.type === 'yearly' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {expense.type === 'yearly' ? 'שנתי' : 'חודשי'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center font-bold" dir="ltr">₪ {parseFloat(expense.amount).toLocaleString()}</td>
                                        <td className="p-3 text-center">
                                            {canEdit && (
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={() => handleEdit(expense)} className="text-blue-500 hover:text-blue-700 transition" title="ערוך">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                        </svg>
                                                    </button>
                                                    <button onClick={() => handleDelete(expense.id)} className="text-red-500 hover:text-red-700 transition" title="מחק">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
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
                ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
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
        </div>
    );
}
