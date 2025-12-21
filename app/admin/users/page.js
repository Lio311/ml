'use client';

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export default function AdminUsersPage() {
    const { user } = useUser();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);

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

    const currentUserRole = user?.publicMetadata?.role;
    const canEdit = currentUserRole === 'admin' || user?.emailAddresses[0]?.emailAddress === 'lior31197@gmail.com';

    // Pagination Logic
    const [currentPage, setCurrentPage] = useState(1);
    const USERS_PER_PAGE = 10;
    const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
    const paginatedUsers = users.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">ניהול זהויות והרשאות</h1>
                {/* Total count removed from here to prevent overlap */}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-center" dir="rtl">
                        <thead className="bg-gray-50 text-gray-500 text-sm">
                            <tr>
                                <th className="p-4 text-center">משתמש</th>
                                <th className="p-4 text-center">אימייל</th>
                                <th className="p-4 text-center">נוצר בתאריך</th>
                                <th className="p-4 text-center">תפקיד נוכחי</th>
                                <th className="p-4 text-center">פעולות</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {paginatedUsers.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50">
                                    <td className="p-4">
                                        <div className="font-bold">{u.firstName} {u.lastName}</div>
                                        <div className="text-xs text-gray-400 font-mono">{u.id}</div>
                                    </td>
                                    <td className="p-4 text-sm">{u.email}</td>
                                    <td className="p-4 text-sm text-gray-500">
                                        {new Date(u.createdAt).toLocaleDateString('he-IL')}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${roleColors[u.role] || roleColors['customer']}`}>
                                            {roleLabels[u.role] || u.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">

                                        {canEdit ? (
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleRoleUpdate(u.id, e.target.value)}
                                                disabled={updating === u.id}
                                                className="bg-white border text-sm rounded px-2 py-1 cursor-pointer hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                            >
                                                <option value="admin">מנהל</option>
                                                <option value="deputy">סגן מנהל</option>
                                                <option value="warehouse">מחסנאי</option>
                                                <option value="customer">לקוח</option>
                                            </select>
                                        ) : (
                                            <span className="text-xs text-gray-400">צפייה בלבד</span>
                                        )}
                                        {updating === u.id && <span className="mr-2 text-xs text-blue-500 animate-pulse">מעדכן...</span>}
                                    </td>
                                </tr>
                            ))}
                            {paginatedUsers.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400">
                                        לא נמצאו משתמשים...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer with Pagination and Total Count */}
                <div className="p-4 border-t bg-gray-50 flex justify-between items-center" dir="rtl">
                    <div className="text-sm text-gray-500 font-medium">
                        סה״כ {users.length} משתמשים
                        <span className="mx-2 text-gray-300">|</span>
                        מציג {((currentPage - 1) * USERS_PER_PAGE) + 1} - {Math.min(currentPage * USERS_PER_PAGE, users.length)}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            הקודם
                        </button>
                        <div className="px-3 py-1 text-sm bg-white border rounded font-bold text-gray-700">
                            {currentPage} / {totalPages || 1}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            הבא
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
