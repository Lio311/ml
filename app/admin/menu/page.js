"use client";

import { useState, useEffect } from 'react';
import { useUser } from "@clerk/nextjs";


export default function AdminMenuPage() {
    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const { user } = useUser();
    const canEdit = user?.publicMetadata?.role === 'admin' || user?.emailAddresses[0]?.emailAddress === 'lior31197@gmail.com';


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
            if (res.ok) {
                setMessage('השינויים נשמרו בהצלחה!');
                setTimeout(() => setMessage(''), 3000);
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
                <table className="w-full text-right border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-bold text-gray-700 text-center">שם העמוד</th>
                            <th className="px-6 py-4 font-bold text-gray-700 text-center">סטטוס תצוגה</th>
                            <th className="px-6 py-4 font-bold text-gray-700 text-center">שינוי שם</th>
                        </tr>
                    </thead>
                    <tbody>
                        {menu.map((item) => (
                            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition">
                                <td className="px-6 py-4 text-sm font-medium text-center">{item.id}</td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={() => canEdit && handleToggle(item.id)}
                                        disabled={!canEdit}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${item.visible
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                            : 'bg-red-100 text-red-700 hover:bg-red-200'
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
                                            className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm focus:ring-2 focus:ring-black outline-none text-center"
                                            placeholder="שם העמוד בתפריט..."
                                        />
                                    ) : (
                                        <span className="text-gray-700 text-sm font-bold">{item.label}</span>
                                    )}
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 flex items-center justify-between">
                <button
                    onClick={handleSave}
                    disabled={saving || !canEdit}
                    className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {saving ? 'שומר...' : (canEdit ? 'שמור שינויים' : 'אין הרשאת עריכה')}
                </button>


                {message && (
                    <span className={`text-sm font-bold ${message.includes('שגיאה') ? 'text-red-600' : 'text-green-600'}`}>
                        {message}
                    </span>
                )}
            </div>
        </div>
    );
}
