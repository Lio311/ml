"use client";
import React, { useState, useEffect } from 'react';
import { Package, Plus, History, AlertTriangle, CheckCircle, Trash2, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import CustomDropdown from '../../components/ui/CustomDropdown';

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
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 text-right" dir="rtl">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-gray-900">
                <Package className="w-7 h-7 md:w-8 md:h-8" />
                ניהול מלאי בקבוקנים
            </h1>

            {/* Status Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {BOTTLE_Types.map(type => {
                    const count = getStock(type.id);
                    const isLow = count < 20;
                    const isLuxury = type.id === 11;

                    return (
                        <div key={type.id} className={`p-4 md:p-6 rounded-2xl border-2 shadow-sm transition-all flex flex-col justify-between
                            ${isLuxury
                                ? 'bg-amber-50 border-amber-200'
                                : isLow ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                            }`}>
                            <div className="flex justify-between items-start mb-2 md:mb-4">
                                <h3 className={`text-xs md:text-lg font-bold ${isLuxury ? 'text-amber-800' : 'text-gray-800'} leading-tight`}>{type.label}</h3>
                                {isLow ? <AlertTriangle className="text-red-500 w-4 h-4 md:w-5 md:h-5" /> : <CheckCircle className={`${isLuxury ? "text-amber-600" : "text-green-500"} w-4 h-4 md:w-5 md:h-5`} />}
                            </div>
                            <div>
                                <div className={`text-2xl md:text-4xl font-black ${isLuxury ? 'text-amber-600' : isLow ? 'text-red-600' : 'text-green-600'}`}>
                                    {count}
                                </div>
                                <div className="mt-1 text-[10px] md:text-xs font-bold uppercase tracking-wider text-gray-400">
                                    {isLow ? 'מלאי נמוך!' : 'מלאי תקין'}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Add/Edit Form */}
                <div className={`p-5 md:p-8 rounded-2xl shadow-sm border transition-all duration-300 ${editingId ? 'bg-blue-50/50 border-blue-200 ring-4 ring-blue-50' : 'bg-white border-gray-100'}`}>
                    <h2 className="text-lg md:text-xl font-bold mb-6 flex items-center gap-3 text-gray-900">
                        {editingId ? <Edit2 className="w-5 h-5 text-blue-600" /> : <div className="bg-black text-white rounded-xl p-1.5"><Plus className="w-4 h-4" /></div>}
                        {editingId ? 'עריכת רשומה' : 'הוספת רכש חדש / עדכון מלאי'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">סוג בקבוק</label>
                            <CustomDropdown
                                options={BOTTLE_Types.map(t => ({ value: String(t.id), label: t.label }))}
                                value={size}
                                onChange={setSize}
                                fullWidth
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">כמות {editingId ? '(המספר החדש)' : 'להוספה'}</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                onWheel={(e) => e.target.blur()}
                                placeholder="לדוגמה: 100"
                                className="w-full border-gray-200 border-2 rounded-xl p-3 focus:border-black focus:ring-0 outline-none transition-colors font-bold text-lg"
                                required
                                min="1"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">הערות / תאריך קניה</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="לדוגמה: הזמנה מאלי אקספרס, הגיע ב-1.1.25"
                                className="w-full border-gray-200 border-2 rounded-xl p-3 focus:border-black focus:ring-0 outline-none transition-colors text-sm"
                                rows="3"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className={`flex-1 py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 ${editingId ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-black hover:bg-gray-800 shadow-gray-200'}`}
                            >
                                {submitting ? 'מעדכן...' : editingId ? 'עדכן רשומה' : 'עדכן מלאי'}
                            </button>

                            {editingId && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="px-5 border-2 border-gray-200 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all font-bold"
                                >
                                    ביטול
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* History Section */}
                <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <h2 className="text-lg md:text-xl font-bold mb-6 flex items-center gap-3 text-gray-900">
                        <History className="w-5 h-5 text-gray-400" />
                        היסטוריית רכישות אחרונות
                    </h2>
                    
                    {/* Desktop History Table */}
                    <div className="hidden md:block overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-gray-50/80 text-gray-400 text-[10px] uppercase font-bold sticky top-0 z-10 border-b">
                                <tr>
                                    <th className="p-4">תאריך</th>
                                    <th className="p-4">סוג</th>
                                    <th className="p-4">כמות</th>
                                    <th className="p-4">הערות</th>
                                    <th className="p-4 w-24 text-center">פעולות</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan="5" className="text-center p-8 text-gray-400 italic">טוען נתונים...</td></tr>
                                ) : history.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center p-8 text-gray-400 italic">אין עדיין רכישות מתועדות</td></tr>
                                ) : (
                                    history.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map((h) => {
                                        const typeLabel = BOTTLE_Types.find(t => t.id === h.size)?.label || h.size;
                                        return (
                                            <tr key={h.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="p-4 whitespace-nowrap text-gray-500 font-medium">
                                                    {new Date(h.purchase_date).toLocaleDateString('he-IL')}
                                                </td>
                                                <td className="p-4 font-bold text-gray-900">{typeLabel}</td>
                                                <td className="p-4 text-green-600 font-black ltr" dir="ltr">+{h.quantity}</td>
                                                <td className="p-4 text-gray-400 truncate max-w-[150px] text-xs" title={h.notes}>
                                                    {h.notes || '—'}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex justify-center gap-1">
                                                        <button
                                                            onClick={() => handleEditClick(h)}
                                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="ערוך"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(h.id)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="מחק"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile History Card Layout */}
                    <div className="md:hidden space-y-4 overflow-y-auto max-h-[600px] pb-6 custom-scrollbar">
                        {loading ? (
                            <div className="text-center p-12 text-gray-400 italic font-medium">טוען נתונים...</div>
                        ) : history.length === 0 ? (
                            <div className="text-center p-12 text-gray-400 italic font-medium">אין רכישות מתועדות</div>
                        ) : (
                            history.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map((h) => {
                                const typeLabel = BOTTLE_Types.find(t => t.id === h.size)?.label || h.size;
                                return (
                                    <div key={h.id} className="p-5 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-4 transform transition-all active:scale-[0.98]">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/50"></span>
                                                    {new Date(h.purchase_date).toLocaleDateString('he-IL')}
                                                </div>
                                                <div className="font-black text-gray-900 text-base leading-tight">{typeLabel}</div>
                                            </div>
                                            <div className="text-xl font-black text-green-600 bg-green-50 border border-green-100 px-3 py-1 rounded-xl shadow-sm" dir="ltr">+{h.quantity}</div>
                                        </div>
                                        
                                        {h.notes && (
                                            <div className="text-[11px] text-gray-500 bg-gray-50/50 p-3 rounded-2xl border border-gray-100/50 leading-relaxed font-medium">
                                                <span className="text-[9px] font-black uppercase tracking-widest opacity-40 block mb-0.5">הערות:</span>
                                                {h.notes}
                                            </div>
                                        )}
                                        
                                        <div className="flex gap-3 pt-2 border-t border-gray-50 mt-1">
                                            <button
                                                onClick={() => handleEditClick(h)}
                                                className="flex-1 h-11 bg-blue-50 text-blue-600 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 border border-blue-100/50 active:scale-95 transition-all"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                                ערוך
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(h.id)}
                                                className="flex-1 h-11 bg-red-50 text-red-500 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 border border-red-100/50 active:scale-95 transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                מחק
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {Math.ceil(history.length / ITEMS_PER_PAGE) > 1 && (
                        <div className="flex justify-center items-center gap-3 mt-auto pt-6 border-t border-gray-50">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="w-10 h-10 flex items-center justify-center border-2 border-gray-100 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-all font-bold text-gray-600"
                            >
                                →
                            </button>
                            <div className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-2 rounded-lg">
                                 {page} מתוך {Math.ceil(history.length / ITEMS_PER_PAGE)}
                            </div>
                            <button
                                onClick={() => setPage(p => Math.min(Math.ceil(history.length / ITEMS_PER_PAGE), p + 1))}
                                disabled={page === Math.ceil(history.length / ITEMS_PER_PAGE)}
                                className="w-10 h-10 flex items-center justify-center border-2 border-gray-100 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-all font-bold text-gray-600"
                            >
                                ←
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
