'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2, Mail, CheckCircle2, XCircle, Search, Clock, Box } from 'lucide-react';
import Image from 'next/image';

export default function RecommendationsAdminPage() {
    const [pendingEmails, setPendingEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const fetchRecommendations = async () => {
        try {
            const res = await fetch('/api/admin/recommendations');
            if (res.ok) {
                const data = await res.json();
                setPendingEmails(data);
            } else {
                toast.error('שגיאה בטעינת המלצות ממתינות');
            }
        } catch (error) {
            toast.error('שגיאת רשת');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        setProcessingId(id);
        const loadingToast = toast.loading('שולח אימייל...');
        try {
            const res = await fetch('/api/admin/recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (res.ok) {
                toast.success('המייל נשלח בהצלחה!', { id: loadingToast });
                setPendingEmails(prev => prev.filter(item => item.id !== id));
            } else {
                toast.error('שגיאה בשליחה', { id: loadingToast });
            }
        } catch (error) {
            toast.error('שגיאת רשת', { id: loadingToast });
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id) => {
        if (!confirm('האם אתה בטוח שברצונך לדחות את שליחת המייל הזה?')) return;
        
        setProcessingId(id);
        try {
            const res = await fetch(`/api/admin/recommendations?id=${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success('נמחק בהצלחה');
                setPendingEmails(prev => prev.filter(item => item.id !== id));
            } else {
                toast.error('שגיאה במחיקה');
            }
        } catch (error) {
            toast.error('שגיאת רשת');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto" dir="rtl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                        אישור אימיילים להמלצות אישיות (AI)
                    </h1>
                    <p className="text-gray-500 mt-2 flex items-center">
                        <Mail className="w-4 h-4 ml-2" />
                        {pendingEmails.length} מיילים ממתינים לאישור שלך
                    </p>
                </div>
            </div>

            {pendingEmails.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900">הכל נקי!</h2>
                    <p className="text-gray-500 mt-2">אין כרגע המלצות שממתינות לאישור.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {pendingEmails.map((item) => {
                        const originalItems = typeof item.original_items === 'string' ? JSON.parse(item.original_items) : item.original_items || [];
                        const suggestedProducts = typeof item.suggested_products === 'string' ? JSON.parse(item.suggested_products) : item.suggested_products || [];
                        const email = item.customer_details?.email || 'ללא אימייל';
                        const firstName = item.customer_details?.first_name || 'לקוח';

                        return (
                            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
                                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-lg text-gray-900">{firstName}</span>
                                            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full font-medium tracking-wide">
                                                הזמנה #{item.order_id}
                                            </span>
                                        </div>
                                        <div className="text-gray-500 text-sm flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            {email}
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleReject(item.id)}
                                            disabled={processingId === item.id}
                                            className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            דחה
                                        </button>
                                        <button
                                            onClick={() => handleApprove(item.id)}
                                            disabled={processingId === item.id || !email}
                                            className="px-6 py-2 bg-gradient-to-l from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                                        >
                                            {processingId === item.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="w-4 h-4" />
                                            )}
                                            אשר מעבר ושליחה
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Original Order side */}
                                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                        <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-4 border-b border-gray-200 pb-2">
                                            <Box className="w-5 h-5 text-gray-500" />
                                            הזמנה מקורית (לפני חודש)
                                        </h3>
                                        <ul className="space-y-3">
                                            {originalItems.map((oi, idx) => (
                                                <li key={idx} className="flex items-center justify-between text-sm">
                                                    <span className="font-medium text-gray-900 truncate pr-2 max-w-[200px]">{oi.name}</span>
                                                    <span className="text-gray-500 min-w-max mr-2">{oi.price} ₪</span>
                                                </li>
                                            ))}
                                            {originalItems.length === 0 && (
                                                <li className="text-gray-400 text-sm italic">לא נמצא פירוט פריטים</li>
                                            )}
                                        </ul>
                                    </div>

                                    {/* Artificial Suggestions side */}
                                    <div className="bg-indigo-50/30 rounded-xl p-5 border border-indigo-100">
                                        <h3 className="font-bold text-indigo-900 flex items-center gap-2 mb-4 border-b border-indigo-100 pb-2">
                                            <Search className="w-5 h-5 text-indigo-600" />
                                            המלצות מותאמות לתבנית הריח
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {suggestedProducts.map((p, idx) => (
                                                <div key={idx} className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm text-center relative overflow-hidden group">
                                                    {p.image_url ? (
                                                        <div className="h-16 w-full flex justify-center items-center mb-2">
                                                            <img src={p.image_url} alt={p.name} className="h-full object-contain group-hover:scale-105 transition-transform" />
                                                        </div>
                                                    ) : (
                                                        <div className="h-16 w-full bg-gray-100 rounded mb-2 flex items-center justify-center">
                                                            <Box className="text-gray-300 w-6 h-6" />
                                                        </div>
                                                    )}
                                                    <div className="text-xs font-bold text-gray-900 truncate px-1" title={p.name}>{p.name}</div>
                                                    <div className="text-[10px] text-gray-500 truncate mt-1">{p.brand}</div>
                                                    <div className="mt-2 text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded inline-block truncate max-w-full">
                                                        {p.notes || 'תווים דומים'}
                                                    </div>
                                                </div>
                                            ))}
                                            {suggestedProducts.length === 0 && (
                                                <div className="text-indigo-400 text-sm italic col-span-full">לא נמצאו המלצות מספיק טובות</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
