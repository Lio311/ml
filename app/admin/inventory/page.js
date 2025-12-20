"use client";
import React, { useState, useEffect } from 'react';
import { Package, Plus, History, AlertTriangle, CheckCircle } from 'lucide-react';

export default function AdminInventoryPage() {
    const [inventory, setInventory] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [size, setSize] = useState('2');
    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/admin/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    size: Number(size),
                    quantity: Number(quantity),
                    notes
                })
            });
            if (res.ok) {
                alert('המלאי עודכן בהצלחה!');
                setQuantity('');
                setNotes('');
                fetchData(); // Refresh
            } else {
                alert('שגיאה בעדכון המלאי');
            }
        } catch (error) {
            console.error(error);
            alert('שגיאה בתקשורת');
        } finally {
            setSubmitting(false);
        }
    };

    const getStock = (s) => inventory.find(i => i.size === s)?.quantity || 0;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <Package className="w-8 h-8" />
                ניהול מלאי בקבוקנים
            </h1>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[2, 5, 10].map(s => {
                    const count = getStock(s);
                    const isLow = count < 20;
                    return (
                        <div key={s} className={`p-6 rounded-xl border-2 shadow-sm transition-all ${isLow ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-gray-800">{s} מ"ל</h3>
                                {isLow ? <AlertTriangle className="text-red-500" /> : <CheckCircle className="text-green-500" />}
                            </div>
                            <div className={`text-5xl font-bold ${isLow ? 'text-red-600' : 'text-green-600'}`}>
                                {count}
                            </div>
                            <div className="mt-2 text-sm text-gray-500">
                                {isLow ? 'מלאי נמוך - מומלץ להזמין!' : 'מלאי תקין'}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Add Stock Form */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 bg-black text-white rounded-full p-1" />
                        הוספת רכש חדש / עדכון מלאי
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">גודל בקבוק (מ"ל)</label>
                            <select
                                value={size}
                                onChange={(e) => setSize(e.target.value)}
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-black outline-none"
                            >
                                <option value="2">2 מ"ל</option>
                                <option value="5">5 מ"ל</option>
                                <option value="10">10 מ"ל</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">כמות להוספה</label>
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

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition disabled:opacity-50"
                        >
                            {submitting ? 'מעדכן...' : 'עדכן מלאי'}
                        </button>
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
                            <thead className="bg-gray-50 border-b sticky top-0">
                                <tr>
                                    <th className="p-3">תאריך</th>
                                    <th className="p-3">גודל</th>
                                    <th className="p-3">כמות</th>
                                    <th className="p-3">הערות</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr><td colSpan="4" className="text-center p-4">טוען...</td></tr>
                                ) : history.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center p-4 text-gray-500">אין עדיין רכישות</td></tr>
                                ) : (
                                    history.map((h) => (
                                        <tr key={h.id}>
                                            <td className="p-3">{new Date(h.purchase_date).toLocaleDateString('he-IL')}</td>
                                            <td className="p-3 font-bold">{h.size} מ"ל</td>
                                            <td className="p-3 text-green-600">+{h.quantity}</td>
                                            <td className="p-3 text-gray-500 truncate max-w-[150px]">{h.notes || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
