"use client";

import { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, Search, MailX } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSubscribersPage() {
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchSubscribers();
    }, []);

    const fetchSubscribers = async () => {
        try {
            const res = await fetch('/api/admin/subscribers');
            if (res.ok) {
                const data = await res.json();
                setSubscribers(data.subscribers);
            } else {
                toast.error('שגיאה בטעינת מנויים');
            }
        } catch (err) {
            toast.error('שגיאת תקשורת');
        } finally {
            setLoading(false);
        }
    };

    const toggleSubscription = async (email, currentStatus) => {
        const action = currentStatus ? 'unsubscribe' : 'subscribe';
        const loadingToast = toast.loading('מעדכן סטטוס...');
        
        try {
            const res = await fetch('/api/admin/subscribers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, action })
            });

            if (res.ok) {
                toast.success('עודכן בהצלחה', { id: loadingToast });
                // Update local state
                setSubscribers(prev => prev.map(s => {
                    if (s.email === email) {
                        return { ...s, is_subscribed: !currentStatus, unsubscribed_at: currentStatus ? new Date().toISOString() : null };
                    }
                    return s;
                }));
            } else {
                toast.error('שגיאה בעדכון', { id: loadingToast });
            }
        } catch (err) {
            toast.error('שגיאת תקשורת', { id: loadingToast });
        }
    };

    const filteredSubscribers = subscribers.filter(s => 
        s.email.toLowerCase().includes(search.toLowerCase()) || 
        (s.first_name && s.first_name.toLowerCase().includes(search.toLowerCase())) ||
        (s.last_name && s.last_name.toLowerCase().includes(search.toLowerCase()))
    );

    const totalSubscribed = subscribers.filter(s => s.is_subscribed).length;
    const totalUnsubscribed = subscribers.filter(s => !s.is_subscribed).length;

    return (
        <div className="p-2 md:p-6" dir="rtl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <Mail className="text-blue-500" size={28} />
                        ניהול מנויי דיוור
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">צפה ונהל את רשימת התפוצה שלך, כולל לקוחות שהסירו את עצמם</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                        <Mail size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-gray-900">{subscribers.length}</div>
                        <div className="text-sm text-gray-500">סה"כ משתמשים ברשימה</div>
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-50 text-green-500 flex items-center justify-center">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-gray-900">{totalSubscribed}</div>
                        <div className="text-sm text-gray-500">מנויים פעילים</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                        <MailX size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-gray-900">{totalUnsubscribed}</div>
                        <div className="text-sm text-gray-500">הסירו את עצמם</div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center bg-gray-50/50">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="חיפוש לפי אימייל או שם..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl pr-10 pl-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>
                </div>

                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-bold whitespace-nowrap">משתמש</th>
                                <th className="px-6 py-4 font-bold whitespace-nowrap">אימייל</th>
                                <th className="px-6 py-4 font-bold whitespace-nowrap">סטטוס דיוור</th>
                                <th className="px-6 py-4 font-bold text-left whitespace-nowrap">פעולות</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex justify-center mb-2">
                                            <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        </div>
                                        טוען נתונים...
                                    </td>
                                </tr>
                            ) : filteredSubscribers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                        לא נמצאו תוצאות לחיפוש
                                    </td>
                                </tr>
                            ) : (
                                filteredSubscribers.map((sub, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-bold text-gray-900">{sub.first_name} {sub.last_name}</div>
                                            {sub.created_at && <div className="text-xs text-gray-400 mt-0.5">נוצר: {new Date(sub.created_at).toLocaleDateString('he-IL')}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap" dir="ltr">{sub.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {sub.is_subscribed ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-xs font-bold border border-green-200/50">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                    מנוי
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-200/50" title={sub.unsubscribed_at ? `הוסר ב-${new Date(sub.unsubscribed_at).toLocaleDateString('he-IL')}` : ''}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                                    הוסר
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-left whitespace-nowrap">
                                            <button
                                                onClick={() => toggleSubscription(sub.email, sub.is_subscribed)}
                                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                    sub.is_subscribed 
                                                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900' 
                                                        : 'bg-black text-white hover:bg-gray-800 shadow-sm'
                                                }`}
                                            >
                                                {sub.is_subscribed ? 'הסר דיוור' : 'החזר לדיוור'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="block md:hidden">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">
                            <div className="flex justify-center mb-2">
                                <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                            טוען נתונים...
                        </div>
                    ) : filteredSubscribers.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            לא נמצאו תוצאות לחיפוש
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredSubscribers.map((sub, idx) => (
                                <div key={idx} className="p-4 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-gray-900">{sub.first_name} {sub.last_name}</div>
                                            <div className="text-sm text-gray-600 mt-1" dir="ltr">{sub.email}</div>
                                        </div>
                                        {sub.is_subscribed ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-xs font-bold border border-green-200/50">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                מנוי
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-200/50">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                                הוסר
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <div className="text-xs text-gray-400">
                                            {sub.created_at ? `נוצר: ${new Date(sub.created_at).toLocaleDateString('he-IL')}` : ''}
                                        </div>
                                        <button
                                            onClick={() => toggleSubscription(sub.email, sub.is_subscribed)}
                                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                                sub.is_subscribed 
                                                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900' 
                                                    : 'bg-black text-white hover:bg-gray-800 shadow-sm'
                                            }`}
                                        >
                                            {sub.is_subscribed ? 'הסר דיוור' : 'החזר לדיוור'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
