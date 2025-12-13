"use client";

import { useState, useEffect } from 'react';

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [tempPhone, setTempPhone] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error(error);
            alert("שגיאה בטעינת המשתמשים");
        } finally {
            setLoading(false);
        }
    };

    const handleEditPhone = (user) => {
        setEditingId(user.id);
        setTempPhone(user.manualPhone || "");
    };

    const handleSavePhone = async (userId) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, manualPhone: tempPhone })
            });

            if (res.ok) {
                setUsers(users.map(u => u.id === userId ? { ...u, manualPhone: tempPhone } : u));
                setEditingId(null);
            } else {
                alert("שגיאה בשמירה");
            }
        } catch (error) {
            console.error(error);
            alert("שגיאה רשת");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm("האם אתה בטוח שברצונך למחוק את המשתמש? זוהי פעולה בלתי הפיכה.")) return;

        try {
            const res = await fetch(`/api/admin/users?userId=${userId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setUsers(users.filter(u => u.id !== userId));
            } else {
                alert("שגיאה במחיקה");
            }
        } catch (error) {
            console.error(error);
            alert("שגיאה רשת");
        }
    };

    if (loading) return <div className="p-8">טוען נתונים...</div>;

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-8">ניהול משתמשים ({users.length})</h1>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שם</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">אימייל</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">טלפון (לעריכה)</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">הזמנות</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">הצטרף ב</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פעולות</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                                    <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
                                    <div>
                                        <div className="font-bold">{user.firstName} {user.lastName}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {editingId === user.id ? (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={tempPhone}
                                                onChange={(e) => setTempPhone(e.target.value)}
                                                className="border rounded px-2 py-1 w-32 text-sm"
                                                placeholder="050..."
                                                autoFocus
                                            />
                                            <button onClick={() => handleSavePhone(user.id)} className="text-green-600 hover:text-green-800">✓</button>
                                            <button onClick={() => setEditingId(null)} className="text-red-600 hover:text-red-800">✗</button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 group">
                                            <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleEditPhone(user)}>
                                                <span className="text-sm">{user.manualPhone || "-"}</span>
                                                <span className="opacity-0 group-hover:opacity-100 text-gray-400 text-xs">✏️</span>
                                            </div>

                                            {user.manualPhone && (
                                                <a
                                                    href={`https://wa.me/972${user.manualPhone.replace(/\D/g, '').replace(/^0/, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-green-500 hover:scale-110 transition-transform"
                                                    title="שלח הודעה בוואטסאפ"
                                                >
                                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1.005.572 1.943.877 3.078.877 3.18 0 5.767-2.587 5.767-5.766.001-3.185-2.584-5.766-5.761-5.766l-.271.006h-.008zm11.969 5.86c0-6.627-5.373-12-12-12s-12 5.373-12 12 5.373 12 12 12c.597 0 1.183-.044 1.761-.125l-4.143 4.093h28.382v-3.968zm-5.46 3.018c-.283-.142-1.68-828-1.94-.923-.26-.094-.447-.141-.634.142-.189.283-.728.923-.895 1.109-.166.19-.333.214-.616.071-.284-.142-1.198-.442-2.283-1.409-.844-.753-1.413-1.684-1.579-1.967-.166-.282-.018-.435.124-.576.128-.127.283-.331.425-.496.142-.165.189-.283.284-.472s.047-.354-.024-.496c-.071-.142-.634-1.53-.87-2.094-.229-.548-.462-.473-.634-.482l-.539-.009c-.19 0-.495.071-.754.354-.26.283-.99 1.549-.99 3.036 0 1.488.756 2.385.871 2.551.116.165 1.989 3.035 4.819 4.258.673.29 1.198.463 1.611.594.685.217 1.309.186 1.802.113.551-.082 1.68-.686 1.917-1.348.236-.662.236-1.229.165-1.348-.07-.118-.26-.189-.543-.33z" />
                                                    </svg>
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-center">
                                    {user.ordersCount}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(user.createdAt).toLocaleDateString('he-IL')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <button
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-full text-xs font-bold"
                                    >
                                        מחק חשבון
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
