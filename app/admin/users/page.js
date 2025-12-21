'use client';

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export default function AdminUsersPage() {
    const { user } = useUser();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);

    // State
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Fetch Users
    useEffect(() => {
        fetch('/api/admin/users')
            .then(res => res.json())
            .then(data => {
                setUsers(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleRoleUpdate = async (userId, newRole) => {
        if (!confirm(`האם אתה בטוח שברצונך לשנות את הרשאת המשתמש ל-${newRole}?`)) return;

        setUpdating(userId);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: newRole })
            });

            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
                alert("ההרשאה עודכנה בהצלחה");
            } else {
                alert("שגיאה בעדכון ההרשאה");
            }
        } catch (e) {
            console.error(e);
            alert("שגיאה בעדכון ההרשאה");
        } finally {
            setUpdating(null);
        }
    };

    const roleLabels = {
        'admin': 'מנהל',
        'deputy': 'סגן מנהל',
        'warehouse': 'מחסנאי',
        'customer': 'לקוח'
    };

    const roleColors = {
        'admin': 'bg-red-100 text-red-800 border-red-200',
        'deputy': 'bg-purple-100 text-purple-800 border-purple-200',
        'warehouse': 'bg-orange-100 text-orange-800 border-orange-200',
        'customer': 'bg-gray-100 text-gray-800 border-gray-200'
    };

    if (loading) return <div className="p-8 text-center text-gray-500">טוען משתמשים...</div>;

    const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
    const displayedUsers = users.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    return (
        <div className="p-8 max-w-5xl mx-auto" dir="rtl">
            <h1 className="text-3xl font-bold mb-8">ניהול זהויות והרשאות</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-right border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 font-bold text-gray-700">משתמש</th>
                            <th className="px-6 py-4 font-bold text-gray-700">אימייל</th>
                            <th className="px-6 py-4 font-bold text-gray-700 text-center">נוצר בתאריך</th>
                            <th className="px-6 py-4 font-bold text-gray-700 text-center">תפקיד נוכחי</th>
                            <th className="px-6 py-4 font-bold text-gray-700 text-center">פעולות</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {displayedUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50/50 transition duration-150">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{u.firstName} {u.lastName}</div>
                                    <div className="text-xs text-gray-400 font-mono mt-0.5">{u.id}</div>
                                </td>
                                <td className="px-6 py-4 text-gray-600 font-mono text-sm">
                                    {u.email}
                                </td>
                                <td className="px-6 py-4 text-center text-gray-500 text-sm">
                                    {new Date(u.createdAt).toLocaleDateString('he-IL')}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm inline-block min-w-[80px] ${u.role === 'admin' ? 'bg-red-100 text-red-700 border border-red-200' :
                                        u.role === 'warehouse' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                            'bg-gray-100 text-gray-700 border border-gray-200'
                                        }`}>
                                        {u.role === 'admin' ? 'מנהל' :
                                            u.role === 'warehouse' ? 'מחסנאי' :
                                                'לקוח'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {user?.publicMetadata?.role === 'admin' && ( // Only admins can edit
                                        <div className="flex items-center justify-center gap-2">
                                            <select
                                                disabled={updating === u.id}
                                                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-black outline-none bg-white cursor-pointer hover:border-gray-400 transition"
                                                defaultValue=""
                                                onChange={(e) => {
                                                    if (e.target.value) handleRoleUpdate(u.id, e.target.value);
                                                    e.target.value = ""; // Reset select
                                                }}
                                            >
                                                <option value="" disabled>פעולות</option>
                                                {u.role !== 'admin' && <option value="admin">👮‍♂️ מנהל</option>}
                                                {u.role !== 'warehouse' && <option value="warehouse">📦 מחסנאי</option>}
                                                {u.role !== 'customer' && <option value="customer">👤 לקוח</option>}
                                            </select>
                                            {updating === u.id && <span className="text-xs text-gray-500 animate-pulse">מעדכן...</span>}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination & Count Footer */}
            <div className="flex justify-between items-center mt-6 mb-12">
                <div className="flex items-center gap-4">
                    {totalPages > 1 && (
                        <>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
                            >
                                הקודם
                            </button>
                            <span>עמוד {page} מתוך {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
                            >
                                הבא
                            </button>
                        </>
                    )}
                </div>

                <div className="text-gray-500 text-sm font-bold">
                    סה״כ {users.length} משתמשים
                </div>
            </div>
        </div>
    );
}
