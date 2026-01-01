"use client";
import React, { useState, useEffect } from 'react';
import { Package, Plus, History, AlertTriangle, CheckCircle, Trash2, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminInventoryPage() {
    const [inventory, setInventory] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [size, setSize] = useState('2');
    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');
    const [editingId, setEditingId] = useState(null); // ID of item being edited
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/admin/inventory');
            const data = await res.json();
            if (data.inventory) setInventory(data.inventory);
            if (data.history) setHistory(data.history);
        } catch (error) {
            console.error("Failed to fetch inventory", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (item) => {
        setSize(String(item.size));
        setQuantity(String(item.quantity));
        setNotes(item.notes || '');
        setEditingId(item.id);
        // Scroll to form?
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setQuantity('');
        setNotes('');
        setSize('2');
    };

    const handleDeleteClick = (id) => {
        toast((t) => (
            <div className="flex flex-col gap-2">
                <p className="font-medium text-sm">האם אתה בטוח שברצונך למחוק רשומה זו? המלאי יתעדכן בהתאם.</p>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            executeDelete(id);
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

    const executeDelete = async (id) => {

        try {
            const res = await fetch('/api/admin/inventory', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (res.ok) {
                toast.success('הרשומה נמחקה והמלאי עודכן!');
                fetchData();
            } else {
                toast.error('שגיאה במחיקה');
            }
        } catch (error) {
            console.error('Delete error', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const method = editingId ? 'PUT' : 'POST';
            const payload = {
                id: editingId, // Only for PUT
                size: Number(size),
                quantity: Number(quantity),
                notes
            };

            const res = await fetch('/api/admin/inventory', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success(editingId ? 'הרשומה עודכנה בהצלחה!' : 'המלאי עודכן בהצלחה!');
                handleCancelEdit(); // Reset form
                fetchData(); // Refresh
            } else {
                toast.error('שגיאה בעדכון');
            }
        } catch (error) {
            console.error(error);
            toast.error('שגיאה בתקשורת');
        } finally {
            setSubmitting(false);
        }
    };

    const getStock = (s) => inventory.find(i => i.size === s)?.quantity || 0;

    const BOTTLE_Types = [
        { id: 2, label: '2 מ"ל' },
        { id: 5, label: '5 מ"ל' },
        { id: 10, label: '10 מ"ל' },
        { id: 11, label: '10 מ"ל יוקרתי' },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <Package className="w-8 h-8" />
                ניהול מלאי בקבוקנים
            </h1>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {BOTTLE_Types.map(type => {
                    const count = getStock(type.id);
                    const isLow = count < 20;
                    const isLuxury = type.id === 11;

                    return (
                        <div key={type.id} className={`p-6 rounded-xl border-2 shadow-sm transition-all 
                            ${isLuxury
                                ? 'bg-amber-50 border-amber-200'
                                : isLow ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                            }`}>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className={`text-lg font-bold ${isLuxury ? 'text-amber-800' : 'text-gray-800'}`}>{type.label}</h3>
                                {isLow ? <AlertTriangle className="text-red-500" /> : <CheckCircle className={isLuxury ? "text-amber-600" : "text-green-500"} />}
                            </div>
                            <div className={`text-4xl font-bold ${isLuxury ? 'text-amber-600' : isLow ? 'text-red-600' : 'text-green-600'}`}>
                                {count}
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                                {isLow ? 'מלאי נמוך!' : 'מלאי תקין'}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Add/Edit Form */}
                <div className={`p-6 rounded-xl shadow-sm border transition-colors ${editingId ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        {editingId ? <Edit2 className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 bg-black text-white rounded-full p-1" />}
                        {editingId ? 'עריכת רשומה' : 'הוספת רכש חדש / עדכון מלאי'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">סוג בקבוק</label>
                            <select
                                value={size}
                                onChange={(e) => setSize(e.target.value)}
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-black outline-none bg-white"
                            >
                                {BOTTLE_Types.map(t => (
                                    <option key={t.id} value={t.id}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">כמות {editingId ? '(המספר החדש)' : 'להוספה'}</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="לדוגמה: 100"
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-black outline-none"
                                required
                                min="1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">הערות / תאריך קניה</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="לדוגמה: הזמנה מאלי אקספרס, הגיע ב-1.1.25"
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-black outline-none"
                                rows="3"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className={`flex-1 py-3 rounded-lg font-bold text-white transition disabled:opacity-50 ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-black hover:bg-gray-800'}`}
                            >
                                {submitting ? 'מעדכן...' : editingId ? 'עדכן רשומה' : 'עדכן מלאי'}
                            </button>

                            {editingId && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="px-4 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* History Table */}
                <div className="bg-white p-6 rounded-xl shadow-sm border overflow-hidden">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <History className="w-5 h-5" />
                        היסטוריית רכישות אחרונות
                    </h2>
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-gray-50 border-b sticky top-0 z-10">
                                <tr>
                                    <th className="p-3">תאריך</th>
                                    <th className="p-3">סוג</th>
                                    <th className="p-3">כמות</th>
                                    <th className="p-3">הערות</th>
                                    <th className="p-3 w-20">פעולות</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr><td colSpan="5" className="text-center p-4">טוען...</td></tr>
                                ) : history.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center p-4 text-gray-500">אין עדיין רכישות</td></tr>
                                ) : (
                                    history.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map((h) => {
                                        const typeLabel = BOTTLE_Types.find(t => t.id === h.size)?.label || h.size;
                                        return (
                                            <tr key={h.id} className="hover:bg-gray-50 group">
                                                <td className="p-3 whitespace-nowrap">{new Date(h.purchase_date).toLocaleDateString('he-IL')}</td>
                                                <td className="p-3 font-bold">{typeLabel}</td>
                                                <td className="p-3 text-green-600 ltr" dir="ltr">+{h.quantity}</td>
                                                <td className="p-3 text-gray-500 truncate max-w-[100px]" title={h.notes}>{h.notes || '-'}</td>
                                                <td className="p-3 flex gap-2">
                                                    <button
                                                        onClick={() => handleEditClick(h)}
                                                        className="text-blue-500 hover:bg-blue-50 p-1 rounded"
                                                        title="ערוך"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(h.id)}
                                                        className="text-red-500 hover:bg-red-50 p-1 rounded"
                                                        title="מחק"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    {Math.ceil(history.length / ITEMS_PER_PAGE) > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-6">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 transition"
                            >
                                הקודם
                            </button>
                            <span className="text-sm font-bold text-gray-600">
                                עמוד {page} מתוך {Math.ceil(history.length / ITEMS_PER_PAGE)}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(Math.ceil(history.length / ITEMS_PER_PAGE), p + 1))}
                                disabled={page === Math.ceil(history.length / ITEMS_PER_PAGE)}
                                className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50 transition"
                            >
                                הבא
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
