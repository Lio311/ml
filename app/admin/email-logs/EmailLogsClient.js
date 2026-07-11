"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, CheckCircle, XCircle, ChevronLeft, ChevronRight, User, Hash, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function EmailLogsClient({ initialLogs, currentPage, totalPages, totalCount }) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const getTypeColor = (type) => {
        switch(type) {
            case 'order_confirmation': return 'bg-green-100 text-green-700 border-green-200';
            case 'cart_recovery': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'review_request': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'reward': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'recommendations': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'educational': return 'bg-pink-100 text-pink-700 border-pink-200';
            case 'admin_alert': return 'bg-red-100 text-red-700 border-red-200';
            case 'contact_form': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'campaign': 
            case 'manual_campaign': return 'bg-blue-600 text-white border-blue-700';
            case 'nurture_3_days': 
            case 'nurture_10_days': 
            case 'nurture_25_days': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
            case 'monthly_recommendation': return 'bg-teal-100 text-teal-700 border-teal-200';
            case 'back_in_stock': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'status_update':
            case 'order_updated': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'welcome': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'admin_order_alert':
            case 'admin_user_alert':
            case 'contact_form_alert': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const getTypeLabel = (type) => {
        switch(type) {
            case 'order_confirmation': return 'אישור הזמנה';
            case 'cart_recovery': return 'שחזור סל';
            case 'review_request': return 'בקשת ביקורת';
            case 'reward': return 'קופון מתנה';
            case 'recommendations': return 'המלצות';
            case 'educational': return 'טיפים ושימוש';
            case 'admin_alert': return 'התראת מנהל';
            case 'contact_form': return 'פניית צור קשר';
            case 'manual_review_request': return 'בקשת ביקורת ידנית';
            case 'campaign': return 'דיוור קמפיין';
            case 'nurture_3_days': return 'טיפוח - 3 ימים';
            case 'nurture_10_days': return 'טיפוח - 10 ימים';
            case 'nurture_25_days': return 'טיפוח - 25 ימים';
            case 'monthly_recommendation': return 'המלצה חודשית';
            case 'back_in_stock': return 'חזר למלאי';
            case 'status_update': return 'עדכון סטטוס';
            case 'order_updated': return 'עדכון הזמנה';
            case 'welcome': return 'ברוכים הבאים';
            case 'admin_order_alert': return 'התראת הזמנה למנהל';
            case 'admin_user_alert': return 'התראת משתמש למנהל';
            case 'contact_form_alert': return 'התראת טופס צור קשר';
            case 'system': return 'מערכת';
            case 'manual_campaign': return 'דיוור קמפיין';
            default: return type || 'מערכת';
        }
    };

    const filteredLogs = initialLogs.filter(log => 
        log.recipient.toLowerCase().includes(searchTerm.toLowerCase()) || 
        log.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Search and Stats */}
            <div className="flex flex-col md:grid md:grid-cols-4 gap-4">
                <div className="md:col-span-3 order-2 md:order-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex items-center gap-3 pr-4 focus-within:ring-2 focus-within:ring-black/5 transition-all">
                        <Mail className="w-5 h-5 text-gray-400 shrink-0" />
                        <input 
                            type="text" 
                            placeholder="חיפוש לפי נמען או נושא..." 
                            className="bg-transparent border-none focus:ring-0 text-sm font-medium w-full text-right outline-none h-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="bg-black text-white rounded-2xl p-2 px-4 shadow-xl flex items-center justify-center order-1 md:order-2 h-full min-h-[56px]">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-0.5">סה"כ מיילים:</span>
                        <span className="text-xl font-black leading-none">{totalCount}</span>
                    </div>
                </div>
            </div>

            {/* Logs Main Container */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-right table-fixed">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 w-1/3 text-[10px] font-black text-gray-400 uppercase tracking-widest">נמען</th>
                                <th className="px-6 py-4 w-28 text-[10px] font-black text-gray-400 uppercase tracking-widest">סוג מייל</th>
                                <th className="px-6 py-4 w-1/4 text-[10px] font-black text-gray-400 uppercase tracking-widest">נושא</th>
                                <th className="px-6 py-4 w-24 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">סטטוס</th>
                                <th className="px-6 py-4 w-24 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">שיוך</th>
                                <th className="px-6 py-4 w-32 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">תאריך ושעה</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs shrink-0">
                                                {log.recipient[0].toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-bold text-gray-900 leading-tight break-all line-clamp-2" title={log.recipient}>{log.recipient}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${getTypeColor(log.type)}`}>
                                            {getTypeLabel(log.type)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-700 max-w-xs truncate" title={log.subject}>
                                            {log.subject}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {log.status === 'sent' ? (
                                            <div className="flex items-center justify-center gap-1 text-green-600 font-bold text-xs">
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                <span>נשלח</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-0.5" title={log.error_message}>
                                                <div className="flex items-center gap-1 text-red-600 font-bold text-xs">
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    <span>נכשל</span>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {log.campaign_id ? (
                                            <div className="flex flex-col items-center">
                                                <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">קמפיין</span>
                                                <span className="text-black font-black text-sm">#{log.campaign_id}</span>
                                            </div>
                                        ) : log.order_id ? (
                                            <div className="flex flex-col items-center">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">הזמנה</span>
                                                <span className="text-black font-black text-sm">
                                                    #{log.order_id}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center text-left">
                                        <div className="text-[11px] font-medium text-gray-500">
                                            {mounted ? format(new Date(log.sent_at), 'dd/MM/yyyy', { locale: he }) : '--/--/----'}
                                        </div>
                                        <div className="text-[13px] font-black text-gray-900 leading-none">
                                            {mounted ? format(new Date(log.sent_at), 'HH:mm', { locale: he }) : '--:--'}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-100">
                    {filteredLogs.map((log) => (
                        <div key={log.id} className="p-4 active:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-extrabold text-sm shrink-0 border border-gray-200">
                                        {log.recipient[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-black text-gray-900 break-all line-clamp-2" title={log.recipient}>{log.recipient}</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border border-opacity-50 ${getTypeColor(log.type)}`}>
                                                {getTypeLabel(log.type)}
                                            </span>
                                            {log.campaign_id && (
                                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 italic">
                                                    קמפיין #{log.campaign_id}
                                                </span>
                                            )}
                                            {log.order_id && (
                                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                                    הזמנה #{log.order_id}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-left shrink-0">
                                    <div className="text-[10px] font-black text-gray-900">
                                        {mounted ? format(new Date(log.sent_at), 'HH:mm', { locale: he }) : '--:--'}
                                    </div>
                                    <div className="text-[9px] font-bold text-gray-400">
                                        {mounted ? format(new Date(log.sent_at), 'dd/MM/yy', { locale: he }) : '--/--/--'}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-3 mb-3 border border-gray-100/50">
                                <div className="text-xs font-bold text-gray-700 leading-snug line-clamp-2">
                                    {log.subject}
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                {log.status === 'sent' ? (
                                    <div className="flex items-center gap-1.5 text-green-600 font-black text-[10px] bg-green-50 px-2 py-1 rounded-lg">
                                        <CheckCircle className="w-3 h-3" />
                                        <span>נשלח בהצלחה</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-red-600 font-black text-[10px] bg-red-50 px-2 py-1 rounded-lg">
                                        <XCircle className="w-3 h-3" />
                                        <span>נכשל</span>
                                    </div>
                                )}
                                
                                <button className="text-[10px] font-black text-gray-400 flex items-center gap-1">
                                    פרטים נוספים <ChevronLeft className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination (Audit Log Style) */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                    <div className="text-xs text-gray-500 font-medium">
                        מציג {initialLogs.length} מתוך {totalCount} מיילים
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => router.push(`/admin/email-logs?page=${Math.max(1, currentPage - 1)}${searchTerm ? `&q=${encodeURIComponent(searchTerm)}` : ''}`)}
                            disabled={currentPage <= 1}
                            className="p-2 rounded-lg border bg-white disabled:opacity-50 hover:bg-gray-50 transition"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="flex items-center px-4 text-xs font-bold text-gray-700">
                            עמוד {currentPage} מתוך {totalPages}
                        </div>
                        <button
                            onClick={() => router.push(`/admin/email-logs?page=${Math.min(totalPages, currentPage + 1)}${searchTerm ? `&q=${encodeURIComponent(searchTerm)}` : ''}`)}
                            disabled={currentPage >= totalPages}
                            className="p-2 rounded-lg border bg-white disabled:opacity-50 hover:bg-gray-50 transition"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
