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
        <div className="mt-4 border-t border-gray-100 pt-4">
            <h4 className="text-xs font-black text-gray-700 mb-3 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                היסטורית מיילים
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-2.5 bg-white border border-gray-100 rounded-lg hover:border-blue-100 hover:shadow-sm transition-all group">
                        <div className="flex items-start gap-2.5 overflow-hidden">
                            <div className="mt-0.5">
                                {log.status === 'sent' ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : log.status === 'failed' ? (
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                ) : (
                                    <Clock className="w-4 h-4 text-amber-500" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-800 truncate" title={log.subject}>
                                    {log.subject || 'ללא נושא'}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                                    <span dir="ltr">{new Date(log.sent_at).toLocaleString('he-IL', {
                                        day: '2-digit', month: '2-digit', year: '2-digit',
                                        hour: '2-digit', minute: '2-digit'
                                    })}</span>
                                    <span>•</span>
                                    <span className="truncate max-w-[120px]" dir="ltr">{log.recipient}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mr-2">
                            <button
                                onClick={() => handleResend(log.id)}
                                disabled={resendingId === log.id}
                                className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50"
                                title="שלח שוב"
                            >
                                {resendingId === log.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-3.5 h-3.5" />
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
