'use client';

import { useState, useEffect } from 'react';
import { Mail, RefreshCw, AlertCircle, CheckCircle2, Clock, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserEmailHistory({ userId }) {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [resendingId, setResendingId] = useState(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch(`/api/admin/users/${userId}/email-logs`);
                if (res.ok) {
                    const data = await res.json();
                    setLogs(data.logs || []);
                }
            } catch (error) {
                console.error("Failed to fetch email logs", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (userId) {
            fetchLogs();
        }
    }, [userId]);

    const handleResend = async (logId) => {
        if (!confirm('האם אתה בטוח שברצונך לשלוח שוב את המייל הזה?')) return;
        
        setResendingId(logId);
        try {
            const res = await fetch(`/api/admin/email-logs/${logId}/resend`, {
                method: 'POST'
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                toast.success('המייל נשלח בהצלחה!');
            } else {
                toast.error(data.error || 'שגיאה בשליחת המייל');
            }
        } catch (error) {
            console.error('Error resending email', error);
            toast.error('שגיאה בשליחת המייל');
        } finally {
            setResendingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="text-center py-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <Mail className="w-8 h-8 text-gray-300 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-gray-400 font-medium tracking-tight">לא נשלחו מיילים ללקוח זה</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-64 custom-scrollbar">
                <table className="w-full text-right" dir="rtl">
                    <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="p-4 w-12 text-center">סטטוס</th>
                            <th className="p-4">נושא</th>
                            <th className="p-4">נמען</th>
                            <th className="p-4">תאריך</th>
                            <th className="p-4 text-center">פעולות</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="p-4 text-center">
                                    {log.status === 'sent' ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                                    ) : log.status === 'failed' ? (
                                        <AlertCircle className="w-4 h-4 text-red-500 mx-auto" />
                                    ) : (
                                        <Clock className="w-4 h-4 text-amber-500 mx-auto" />
                                    )}
                                </td>
                                <td className="p-4 text-xs font-bold text-gray-800 max-w-[200px] truncate" title={log.subject}>
                                    {log.subject || 'ללא נושא'}
                                </td>
                                <td className="p-4 text-xs font-medium text-gray-500 truncate max-w-[150px]" dir="ltr">
                                    {log.recipient}
                                </td>
                                <td className="p-4 text-xs font-bold text-gray-600 whitespace-nowrap">
                                    <span dir="ltr">{new Date(log.sent_at).toLocaleString('he-IL', {
                                        day: '2-digit', month: '2-digit', year: '2-digit',
                                        hour: '2-digit', minute: '2-digit'
                                    })}</span>
                                </td>
                                <td className="p-4 text-center">
                                    <button
                                        onClick={() => handleResend(log.id)}
                                        disabled={resendingId === log.id}
                                        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50"
                                        title="שלח שוב"
                                    >
                                        {resendingId === log.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <RefreshCw className="w-3.5 h-3.5" />
                                        )}
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
