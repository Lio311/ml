"use client";
import React, { useState } from 'react';
import { Mail, Calendar, User, Eye, X, Send, Cpu, Package } from 'lucide-react';
import { he } from 'date-fns/locale';
import { format } from 'date-fns';

export default function PendingEmailsClient({ initialEmails }) {
    const [emails, setEmails] = useState(initialEmails);
    const [selectedEmail, setSelectedEmail] = useState(null);

    const getIconForType = (type) => {
        if (type.includes('קמפיין')) return <Send className="w-4 h-4 text-blue-500" />;
        if (type.includes('המלצות')) return <Cpu className="w-4 h-4 text-purple-500" />;
        return <Package className="w-4 h-4 text-green-500" />;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'מבוסס אירוע (ללא תאריך מוגדר)';
        return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: he });
    };

    // Calculate time until send
    const getTimeUntil = (dateString) => {
        if (!dateString) return 'בהקדם האפשרי';
        const diff = new Date(dateString).getTime() - new Date().getTime();
        if (diff < 0) return 'אמור להישלח (ממתין לתור)';
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `בעוד ${days} ימים`;
        if (hours > 0) return `בעוד ${hours} שעות`;
        return 'בקרוב מאוד';
    };

    return (
        <div className="w-full">
            {emails.length === 0 ? (
                <div className="bg-white rounded-2xl shadow p-8 text-center">
                    <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">אין כרגע מיילים מתוזמנים בהמתנה.</p>
                </div>
            ) : (
                <>
                    {/* Desktop View: Table */}
                    <div className="hidden md:block bg-white rounded-2xl shadow overflow-hidden">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b">
                                    <th className="p-4 font-semibold text-gray-700">סוג</th>
                                    <th className="p-4 font-semibold text-gray-700">נמען / תיאור</th>
                                    <th className="p-4 font-semibold text-gray-700">תאריך שליחה מתוכנן</th>
                                    <th className="p-4 font-semibold text-gray-700">תצוגה מקדימה</th>
                                    <th className="p-4 font-semibold text-gray-700 text-center">פעולות</th>
                                </tr>
                            </thead>
                            <tbody>
                                {emails.map((email) => (
                                    <tr key={email.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {getIconForType(email.type)}
                                                <span className="font-medium text-gray-800">{email.type}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-gray-800">{email.recipient}</div>
                                            {email.customerName && <div className="text-sm text-gray-500">{email.customerName}</div>}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-gray-800">{formatDate(email.scheduledDate)}</div>
                                            <div className="text-xs text-blue-600 font-medium">{getTimeUntil(email.scheduledDate)}</div>
                                        </td>
                                        <td className="p-4 text-gray-600 truncate max-w-[200px]" title={email.contentPreview}>
                                            {email.contentPreview}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => setSelectedEmail(email)}
                                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full transition"
                                                title="צפייה בתוכן"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View: Cards */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {emails.map((email) => (
                            <div key={email.id} className="bg-white rounded-2xl shadow p-5 flex flex-col gap-3 relative overflow-hidden">
                                <div className="flex items-center gap-2 border-b pb-3">
                                    <div className="p-2 bg-gray-50 rounded-xl">
                                        {getIconForType(email.type)}
                                    </div>
                                    <div>
                                        <span className="font-bold text-gray-800 block leading-tight">{email.type}</span>
                                        <span className="text-xs text-gray-500 block">{email.customerName || email.recipient}</span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span className="truncate max-w-[150px]">{email.recipient}</span>
                                    </div>
                                    
                                </div>

                                <div className="flex items-center justify-between text-sm mt-1">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span>{formatDate(email.scheduledDate)}</span>
                                    </div>
                                    <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">{getTimeUntil(email.scheduledDate)}</span>
                                </div>

                                <div className="mt-2 flex items-center justify-between bg-gray-50 p-2 rounded-xl">
                                    <span className="text-xs text-gray-500 truncate pl-2">{email.contentPreview}</span>
                                    <button
                                        onClick={() => setSelectedEmail(email)}
                                        className="bg-white border shadow-sm text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium shrink-0"
                                    >
                                        <Eye className="w-3.5 h-3.5" /> צפייה
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Modal for Raw Content */}
            {selectedEmail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm z-[100]">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden relative">
                        <div className="flex items-center justify-between p-4 border-b bg-gray-50/80">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                {getIconForType(selectedEmail.type)}
                                צפייה מקדימה
                            </h2>
                            <button
                                onClick={() => setSelectedEmail(null)}
                                className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition text-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1">
                            <div className="mb-4 text-sm text-gray-600 border-b pb-4">
                                <p><strong>נמען:</strong> {selectedEmail.recipient}</p>
                                <p><strong>סוג:</strong> {selectedEmail.type}</p>
                                <p><strong>תיאור:</strong> {selectedEmail.contentPreview}</p>
                            </div>
                            
                            {selectedEmail.rawContent ? (
                                selectedEmail.type === 'קמפיין דיוור' ? (
                                    <div 
                                        className="prose prose-sm max-w-none border rounded-xl p-4 bg-gray-50"
                                        dangerouslySetInnerHTML={{ __html: selectedEmail.rawContent }} 
                                    />
                                ) : (
                                    <pre className="bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto text-left text-xs font-mono" dir="ltr">
                                        {selectedEmail.rawContent}
                                    </pre>
                                )
                            ) : (
                                <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-xl">
                                    אין תוכן זמין לתצוגה מקדימה בסוג מייל זה.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
