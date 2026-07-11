"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { ChevronRight, ChevronLeft, Info, User, History } from 'lucide-react';

export default function AuditLogsClient({ initialLogs, totalCount, currentPage, limit }) {
    const router = useRouter();
    const [selectedLog, setSelectedLog] = useState(null);

    const totalPages = Math.ceil(totalCount / limit);

    const handlePageChange = (newPage) => {
        router.push(`/admin/audit-logs?page=${newPage}`);
    };

    const actionColors = {
        'delete_order': 'bg-red-100 text-red-700',
        'update_order_status': 'bg-blue-100 text-blue-700',
        'update_order': 'bg-blue-100 text-blue-700',
        'update_order_batch': 'bg-blue-100 text-blue-700',
        'create_order': 'bg-green-100 text-green-700',
        'update_product': 'bg-amber-100 text-amber-700',
        'delete_product': 'bg-red-100 text-red-700',
        'create_product': 'bg-green-100 text-green-700',
        'update_catalog': 'bg-indigo-100 text-indigo-700',
        'update_user_address': 'bg-purple-100 text-purple-700',
        'update_user_role': 'bg-purple-100 text-purple-700',
        'create_review': 'bg-teal-100 text-teal-700',
        'approve_recommendation_email': 'bg-emerald-100 text-emerald-700',
        'reject_recommendation_email': 'bg-rose-100 text-rose-700',
    };

    const actionLabels = {
        'delete_order': 'מחיקת הזמנה',
        'update_order_status': 'עדכון סטטוס הזמנה',
        'update_order': 'עדכון הזמנה',
        'update_order_batch': 'עדכון רצף הזמנות',
        'create_order': 'יצירת הזמנה',
        'update_product': 'עדכון מוצר',
        'delete_product': 'מחיקת מוצר',
        'create_product': 'יצירת מוצר',
        'update_catalog': 'עדכון קטלוג',
        'update_user_address': 'עדכון כתובת משתמש',
        'update_user_role': 'עדכון הרשאת משתמש',
        'create_review': 'יצירת ביקורת',
        'approve_recommendation_email': 'אישור המלצה',
        'reject_recommendation_email': 'דחיית המלצה',
        'default': 'פעולה כללית'
    };

    return (
        <div dir="rtl" className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Table View (Desktop) */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">תאריך</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">משתמש</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">פעולה</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ישות</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">פרטים</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {initialLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900">{log.user_name || 'מערכת'}</span>
                                                <span className="text-[10px] text-gray-400 font-mono">{log.user_id?.slice(-6)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${actionColors[log.action] || 'bg-gray-100 text-gray-600'}`}>
                                            {actionLabels[log.action] || log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className="font-medium text-gray-700">{log.entity_type}</span>
                                        {log.entity_id && <span className="text-xs text-gray-400 mr-1">#{log.entity_id}</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button 
                                            onClick={() => setSelectedLog(log)}
                                            className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition"
                                        >
                                            <Info className="w-4 h-4" />
                                            צפה
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Card View (Mobile) */}
                <div className="md:hidden divide-y divide-gray-100">
                    {initialLogs.map((log) => (
                        <div key={log.id} className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-900">{log.user_name || 'מערכת'}</span>
                                        <span className="text-[10px] text-gray-500">{format(new Date(log.created_at), 'dd/MM/yy HH:mm', { locale: he })}</span>
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${actionColors[log.action] || 'bg-gray-100 text-gray-600'}`}>
                                    {actionLabels[log.action] || log.action}
                                </span>
                            </div>
                            
                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                                <div className="text-xs text-gray-600">
                                    <span className="font-bold">{log.entity_type}</span>
                                    {log.entity_id && <span className="text-gray-400 mr-1">#{log.entity_id}</span>}
                                </div>
                                <button 
                                    onClick={() => setSelectedLog(log)}
                                    className="text-blue-600 font-bold text-xs flex items-center gap-1"
                                >
                                    פרטים <ChevronLeft className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                    <div className="text-xs text-gray-500 font-medium">
                        מציג {initialLogs.length} מתוך {totalCount} פעולות
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className="p-2 rounded-lg border bg-white disabled:opacity-50 hover:bg-gray-50 transition"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="flex items-center px-4 text-xs font-bold text-gray-700">
                            עמוד {currentPage} מתוך {totalPages}
                        </div>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            className="p-2 rounded-lg border bg-white disabled:opacity-50 hover:bg-gray-50 transition"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <History className="w-5 h-5 text-indigo-600" />
                                פרטי פעולה
                            </h2>
                            <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600 text-2xl font-light">&times;</button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">תאריך ושעה</label>
                                    <p className="text-gray-900 font-medium">{format(new Date(selectedLog.created_at), 'dd בMMMM yyyy, HH:mm', { locale: he })}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">משתמש מבצע</label>
                                    <p className="text-gray-900 font-bold">{selectedLog.user_name || 'מערכת'} <span className="text-xs text-gray-400 font-normal">({selectedLog.user_id})</span></p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">סוג ישות</label>
                                    <p className="text-gray-900 font-medium">{selectedLog.entity_type} {selectedLog.entity_id ? `#${selectedLog.entity_id}` : ''}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">כתובת IP</label>
                                    <p className="text-gray-400 font-mono text-xs">{selectedLog.ip_address}</p>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">מידע נוסף (JSON)</label>
                                <pre className="bg-gray-900 text-indigo-300 p-4 rounded-xl overflow-x-auto text-xs font-mono leading-relaxed max-h-[250px]">
                                    {JSON.stringify(selectedLog.details, null, 2)}
                                </pre>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button 
                                onClick={() => setSelectedLog(null)}
                                className="bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-100 transition shadow-sm"
                            >
                                סגור
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
