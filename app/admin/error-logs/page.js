"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, RefreshCw, XCircle, Clock, ChevronDown, ChevronUp, Trash2, Server, AlertOctagon } from "lucide-react";
import toast from "react-hot-toast";

export default function ErrorLogsPage() {
    const [errors, setErrors] = useState([]);
    const [stats, setStats] = useState({ total: 0, last_24h: 0, last_7d: 0, unique_endpoints: 0 });
    const [topEndpoints, setTopEndpoints] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [tableExists, setTableExists] = useState(true);
    const [isSettingUp, setIsSettingUp] = useState(false);

    const fetchErrors = async () => {
        try {
            const res = await fetch('/api/admin/error-logs/list');
            if (res.ok) {
                const data = await res.json();
                setErrors(data.errors || []);
                setStats(data.stats || {});
                setTopEndpoints(data.topEndpoints || []);
                setTableExists(data.tableExists !== false);
            }
        } catch (e) {
            console.error("Failed to fetch errors:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchErrors(); }, []);

    const handleSetup = async () => {
        setIsSettingUp(true);
        try {
            const res = await fetch('/api/admin/error-logs/setup', { method: 'POST' });
            if (res.ok) {
                toast.success("הטבלאות נוצרו בהצלחה");
                setTableExists(true);
                fetchErrors();
            }
        } catch (e) {
            toast.error("שגיאה");
        } finally {
            setIsSettingUp(false);
        }
    };

    const timeAgo = (date) => {
        if (!date) return '';
        const diff = Date.now() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'כרגע';
        if (minutes < 60) return `לפני ${minutes} דקות`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `לפני ${hours} שעות`;
        const days = Math.floor(hours / 24);
        return `לפני ${days} ימים`;
    };

    const getMethodColor = (method) => {
        switch (method) {
            case 'GET': return 'bg-blue-100 text-blue-700';
            case 'POST': return 'bg-green-100 text-green-700';
            case 'PUT': return 'bg-yellow-100 text-yellow-700';
            case 'DELETE': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">ניטור שגיאות</h1>
                    <p className="text-sm text-gray-500 mt-1">מעקב אחר שגיאות API בזמן אמת</p>
                </div>
                <div className="flex gap-2">
                    {!tableExists && (
                        <button
                            onClick={handleSetup}
                            disabled={isSettingUp}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-2 rounded-xl transition disabled:opacity-50"
                        >
                            {isSettingUp ? 'מגדיר...' : 'הגדר טבלאות'}
                        </button>
                    )}
                    <button
                        onClick={fetchErrors}
                        className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">רענן</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                    <p className="text-2xl sm:text-3xl font-black text-gray-900">{stats.total || 0}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 font-bold mt-1">סה"כ שגיאות</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                    <p className="text-2xl sm:text-3xl font-black text-red-600">{stats.last_24h || 0}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 font-bold mt-1">24 שעות אחרונות</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                    <p className="text-2xl sm:text-3xl font-black text-orange-600">{stats.last_7d || 0}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 font-bold mt-1">7 ימים אחרונים</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                    <p className="text-2xl sm:text-3xl font-black text-blue-600">{stats.unique_endpoints || 0}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 font-bold mt-1">endpoints שונים</p>
                </div>
            </div>

            {/* Top Failing Endpoints */}
            {topEndpoints.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6">
                    <h2 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-3 flex items-center gap-1">
                        <AlertOctagon className="w-3.5 h-3.5" />
                        Endpoints בעייתיים (7 ימים אחרונים)
                    </h2>
                    <div className="space-y-2">
                        {topEndpoints.map((ep, i) => (
                            <div key={i} className="flex items-center justify-between bg-white rounded-xl p-2.5 border border-red-100">
                                <span className="text-xs font-bold text-gray-800 truncate flex-1 min-w-0" dir="ltr">{ep.endpoint}</span>
                                <div className="flex items-center gap-2 flex-shrink-0 mr-2">
                                    <span className="text-[10px] text-gray-400">{timeAgo(ep.last_error)}</span>
                                    <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full">{ep.count}x</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Error List */}
            <div className="mb-4">
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <Server className="w-4 h-4 text-gray-400" />
                    שגיאות אחרונות ({errors.length})
                </h2>
            </div>

            {isLoading ? (
                <div className="text-center py-12 text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p>טוען...</p>
                </div>
            ) : errors.length === 0 ? (
                <div className="text-center py-16 bg-green-50 rounded-2xl border border-green-100">
                    <p className="text-green-600 text-lg font-bold mb-1">אין שגיאות!</p>
                    <p className="text-sm text-green-500">המערכת פועלת בצורה תקינה</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {errors.map((err) => {
                        const isExpanded = expandedId === err.id;
                        return (
                            <div key={err.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                                <div
                                    className="flex items-center gap-3 p-3 cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : err.id)}
                                >
                                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${getMethodColor(err.request_method)}`}>
                                                {err.request_method || 'GET'}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                                                {err.status_code}
                                            </span>
                                            <span className="text-xs font-bold text-gray-800 truncate" dir="ltr">{err.endpoint}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">{err.error_message}</p>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-[10px] text-gray-400 hidden sm:inline">{timeAgo(err.created_at)}</span>
                                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="px-3 pb-3 border-t border-gray-50 pt-2 space-y-2">
                                        <div className="bg-gray-50 rounded-lg p-2.5">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">שגיאה</p>
                                            <p className="text-xs text-gray-800 break-all leading-relaxed">{err.error_message}</p>
                                        </div>
                                        
                                        {err.error_stack && (
                                            <div className="bg-gray-900 rounded-lg p-2.5 overflow-x-auto">
                                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Stack Trace</p>
                                                <pre className="text-[10px] text-green-400 whitespace-pre-wrap break-all font-mono leading-relaxed" dir="ltr">
                                                    {err.error_stack}
                                                </pre>
                                            </div>
                                        )}
                                        
                                        <div className="flex flex-wrap gap-2 text-[9px] text-gray-400">
                                            <span>IP: {err.ip_address || '—'}</span>
                                            <span>•</span>
                                            <span>{new Date(err.created_at).toLocaleString('he-IL')}</span>
                                            {err.user_agent && (
                                                <>
                                                    <span>•</span>
                                                    <span className="truncate max-w-[200px]" dir="ltr">{err.user_agent}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
