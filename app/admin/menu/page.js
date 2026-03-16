"use client";

import { useState, useEffect } from 'react';
import { useUser } from "@clerk/nextjs";


export default function AdminMenuPage() {
    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const { user } = useUser();
    const canEdit = user?.publicMetadata?.role === 'admin' || user?.emailAddresses[0]?.emailAddress === process.env.ADMIN_EMAIL;


    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (data.menu) {
                setMenu(data.menu.sort((a, b) => a.order - b.order));
            }
        } catch (error) {
            console.error('Fetch Menu Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (id) => {
        setMenu(menu.map(item =>
            item.id === id ? { ...item, visible: !item.visible } : item
        ));
    };

    const handleLabelChange = (id, newLabel) => {
        setMenu(menu.map(item =>
            item.id === id ? { ...item, label: newLabel } : item
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');

        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ menu })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage('השינויים נשמרו בהצלחה!');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage(`שגיאה: ${data.error || 'לא ידוע'}`);
            }
        } catch (error) {
            console.error('Save Menu Error:', error);
            setMessage('שגיאה בשמירת השינויים');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">טוען...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto" dir="rtl">
            <h1 className="text-3xl font-bold mb-8">ניהול תפריט ראשי</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm">
                            <tr>
                                <th className="px-6 py-4 font-bold text-center">שם העמוד (ID)</th>
                                <th className="px-6 py-4 font-bold text-center">סטטוס תצוגה</th>
                                <th className="px-6 py-4 font-bold text-center">שינוי שם (Label)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {menu.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-bold text-center text-gray-400 font-mono">{item.id}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => canEdit && handleToggle(item.id)}
                                            disabled={!canEdit}
                                            className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all border ${item.visible
                                                ? 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100'
                                                : 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100'
                                                } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {item.visible ? 'מוצג' : 'מוסתר'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {canEdit ? (
                                            <input
                                                type="text"
                                                value={item.label}
                                                onChange={(e) => handleLabelChange(item.id, e.target.value)}
                                                className="border border-gray-200 rounded-lg px-4 py-2 w-full max-w-xs text-sm focus:ring-2 focus:ring-blue-100 outline-none text-center bg-gray-50 focus:bg-white transition-all shadow-sm"
                                                placeholder="שם העמוד בתפריט..."
                                            />
                                        ) : (
                                            <span className="text-gray-900 text-sm font-bold">{item.label}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View Card Layout */}
                <div className="md:hidden divide-y divide-gray-100">
                    {menu.map((item) => (
                        <div key={item.id} className="p-5 bg-white space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="space-y-0.5">
                                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">מזהה עמוד:</div>
                                    <div className="text-sm font-mono font-bold text-gray-900">{item.id}</div>
                                </div>
                                <button
                                    onClick={() => canEdit && handleToggle(item.id)}
                                    disabled={!canEdit}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all border shadow-sm ${item.visible
                                        ? 'bg-green-50 text-green-700 border-green-100 active:bg-green-200'
                                        : 'bg-red-50 text-red-700 border-red-100 active:bg-red-200'
                                        } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {item.visible ? 'מוצג' : 'מוסתר'}
                                </button>
                            </div>

                            <div className="space-y-2 pt-2">
                                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">שם העמוד בתפריט:</label>
                                {canEdit ? (
                                    <input
                                        type="text"
                                        value={item.label}
                                        onChange={(e) => handleLabelChange(item.id, e.target.value)}
                                        className="border border-gray-200 rounded-xl px-4 py-3 w-full text-base focus:ring-2 focus:ring-blue-100 outline-none bg-gray-50 focus:bg-white transition-all shadow-sm"
                                        placeholder="למשל: דף הבית"
                                    />
                                ) : (
                                    <div className="text-lg font-bold text-gray-900 px-1">{item.label}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-8 flex items-center">
                <div className="flex-1 text-sm font-bold text-green-600">
                    {message}
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving || !canEdit}
                    className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {saving ? 'שומר...' : (canEdit ? 'שמור שינויים' : 'אין הרשאת עריכה')}
                </button>
            </div>
        </div>
    );
}
