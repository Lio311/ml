"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, CheckCircle, XCircle, ChevronLeft, ChevronRight, User, Hash, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function EmailLogsClient({ initialLogs, currentPage, totalPages, totalCount }) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');

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
                <div className="bg-black text-white rounded-2xl p-4 shadow-xl flex flex-col justify-center order-1 md:order-2">
                    <div className="flex justify-between items-center md:block">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">סה\"כ מיילים</span>
                        <span className="text-2xl font-black block leading-none md:mt-1">{totalCount}</span>
                    </div>
                </div>
            </div>

            {/* Logs Main Container */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">נמען</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">סוג מייל</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">נושא</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">סטטוס</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">מספר הזמנה</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">תאריך ושעה</th>
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
                                            <div className="min-w-0">
                                                <div className="text-sm font-bold text-gray-900 leading-tight truncate">{log.recipient}</div>
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
                                        {log.order_id ? (
                                            <Link 
                                                href={`/admin/orders/${log.order_id}`}
                                                className="text-black font-black text-sm hover:underline hover:text-blue-600 transition-colors"
                                            >
                                                #{log.order_id}
                                            </Link>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center text-left">
                                        <div className="text-[11px] font-medium text-gray-500">
                                            {format(new Date(log.sent_at), 'dd/MM/yyyy', { locale: he })}
                                        </div>
                                        <div className="text-[13px] font-black text-gray-900 leading-none">
                                            {format(new Date(log.sent_at), 'HH:mm', { locale: he })}
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
                                    <div className="min-w-0">
                                        <div className="text-sm font-black text-gray-900 truncate">{log.recipient}</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border border-opacity-50 ${getTypeColor(log.type)}`}>
                                                {getTypeLabel(log.type)}
                                            </span>
                                            {log.order_id && (
                                                <Link href={`/admin/orders/${log.order_id}`} className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                                    #{log.order_id}
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-left shrink-0">
                                    <div className="text-[10px] font-black text-gray-900">
                                        {format(new Date(log.sent_at), 'HH:mm', { locale: he })}
                                    </div>
                                    <div className="text-[9px] font-bold text-gray-400">
                                        {format(new Date(log.sent_at), 'dd/MM/yy', { locale: he })}
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

                {filteredLogs.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="w-8 h-8" />
                        </div>
                        <h3 className="text-gray-900 font-bold">לא נמצאו מיילים</h3>
                        <p className="text-gray-400 text-sm">נסה לחפש נמען או נושא אחר.</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-4 md:px-6 py-4 rounded-2xl border border-gray-100 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">
                        {totalPages > 5 ? (
                            <span>עמוד {currentPage} - {totalPages}</span>
                        ) : (
                            <span>עמוד {currentPage} מתוך {totalPages}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 md:gap-2">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => router.push(`/admin/email-logs?page=${currentPage - 1}`)}
                            className={`p-2 rounded-lg transition-all ${currentPage === 1 
                                ? 'text-gray-200 cursor-not-allowed' 
                                : 'text-gray-700 hover:bg-gray-100 active:scale-95'}`}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <button 
                            disabled={currentPage === totalPages}
                            onClick={() => router.push(`/admin/email-logs?page=${currentPage + 1}`)}
                            className={`p-2 rounded-lg transition-all ${currentPage === totalPages 
                                ? 'text-gray-200 cursor-not-allowed' 
                                : 'text-gray-700 hover:bg-gray-100 active:scale-95'}`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
