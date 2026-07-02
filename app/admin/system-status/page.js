"use client";

import { useState, useEffect } from "react";
import { Activity, Clock, Play, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Timer, Zap, Settings, Database, Key, Mail, Globe, Server } from "lucide-react";
import toast from "react-hot-toast";

export default function SystemStatusPage() {
    const [crons, setCrons] = useState([]);
    const [health, setHealth] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [tablesExist, setTablesExist] = useState(true);
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [runningCron, setRunningCron] = useState(null);

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/admin/system-status');
            if (res.ok) {
                const data = await res.json();
                setCrons(data.crons || []);
                setHealth(data.health || null);
                setTablesExist(data.tablesExist !== false);
            }
        } catch (e) {
            console.error("Failed to fetch system status:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchStatus(); }, []);

    const handleSetup = async () => {
        setIsSettingUp(true);
        try {
            const res = await fetch('/api/admin/error-logs/setup', { method: 'POST' });
            if (res.ok) {
                toast.success("הטבלאות נוצרו בהצלחה");
                setTablesExist(true);
                fetchStatus();
            } else {
                toast.error("שגיאה ביצירת הטבלאות");
            }
        } catch (e) {
            toast.error("שגיאה בתקשורת");
        } finally {
            setIsSettingUp(false);
        }
    };

    const handleRunCron = async (cron) => {
        setRunningCron(cron.name);
        toast.loading(`מריץ ${cron.label}...`, { id: `cron-${cron.name}` });
        try {
            const res = await fetch(cron.path);
            if (res.ok) {
                toast.success(`${cron.label} הושלם בהצלחה`, { id: `cron-${cron.name}` });
                fetchStatus();
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || `שגיאה ב-${cron.label}`, { id: `cron-${cron.name}` });
            }
        } catch (e) {
            toast.error(`שגיאה בהרצת ${cron.label}`, { id: `cron-${cron.name}` });
        } finally {
            setRunningCron(null);
        }
    };

    const getStatusIcon = (status) => {
        if (!status) return <Clock className="w-4 h-4 text-gray-300" />;
        if (status === 'running') return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
        if (status === 'success') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
        return <XCircle className="w-4 h-4 text-red-500" />;
    };

    const getStatusBadge = (status) => {
        if (!status) return { label: 'טרם הורץ', color: 'bg-gray-100 text-gray-500' };
        if (status === 'running') return { label: 'רץ כעת', color: 'bg-blue-100 text-blue-700' };
        if (status === 'success') return { label: 'תקין', color: 'bg-green-100 text-green-700' };
        return { label: 'שגיאה', color: 'bg-red-100 text-red-700' };
    };

    const timeAgo = (date) => {
        if (!date) return 'אף פעם';
        const diff = Date.now() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'כרגע';
        if (minutes < 60) return `לפני ${minutes} דקות`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `לפני ${hours} שעות`;
        const days = Math.floor(hours / 24);
        return `לפני ${days} ימים`;
    };

    const successCount = crons.filter(c => c.lastRun?.status === 'success').length;
    const errorCount = crons.filter(c => c.lastRun?.status === 'error').length;
    const neverRan = crons.filter(c => !c.lastRun).length;

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">סטטוס מערכת</h1>
                    <p className="text-sm text-gray-500 mt-1">ניטור אוטומציות, קרונים ואינטגרציות</p>
                </div>
                <div className="flex gap-2">
                    {!tablesExist && (
                        <button
                            onClick={handleSetup}
                            disabled={isSettingUp}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-2 rounded-xl transition disabled:opacity-50"
                        >
                            {isSettingUp ? 'מגדיר...' : 'הגדר טבלאות'}
                        </button>
                    )}
                    <button
                        onClick={fetchStatus}
                        className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">רענן</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                    <p className="text-2xl sm:text-3xl font-black text-green-600">{successCount}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 font-bold mt-1">תקינים</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                    <p className="text-2xl sm:text-3xl font-black text-red-600">{errorCount}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 font-bold mt-1">שגיאות</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                    <p className="text-2xl sm:text-3xl font-black text-gray-400">{neverRan}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 font-bold mt-1">טרם הורצו</p>
                </div>
            </div>

            {/* Health Checks Dashboard */}
            {!isLoading && health && (
                <div className="mb-8">
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-green-500" />
                        בריאות חיבורים (Health Checks)
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        <div className={`p-4 rounded-2xl border flex flex-col items-center text-center ${health.neon.status === 'success' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                            <Database className={`w-6 h-6 mb-2 ${health.neon.status === 'success' ? 'text-green-600' : 'text-red-600'}`} />
                            <h3 className="font-bold text-sm text-gray-900">מסד נתונים (Neon)</h3>
                            <p className={`text-xs mt-1 font-medium ${health.neon.status === 'success' ? 'text-green-700' : 'text-red-700'}`}>{health.neon.message}</p>
                        </div>
                        
                        <div className={`p-4 rounded-2xl border flex flex-col items-center text-center ${health.clerk.status === 'success' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                            <Key className={`w-6 h-6 mb-2 ${health.clerk.status === 'success' ? 'text-green-600' : 'text-red-600'}`} />
                            <h3 className="font-bold text-sm text-gray-900">אימות (Clerk)</h3>
                            <p className={`text-xs mt-1 font-medium ${health.clerk.status === 'success' ? 'text-green-700' : 'text-red-700'}`}>{health.clerk.message}</p>
                        </div>

                        <div className={`p-4 rounded-2xl border flex flex-col items-center text-center ${health.email.status === 'success' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                            <Mail className={`w-6 h-6 mb-2 ${health.email.status === 'success' ? 'text-green-600' : 'text-red-600'}`} />
                            <h3 className="font-bold text-sm text-gray-900">דוא״ל (Nodemailer)</h3>
                            <p className={`text-xs mt-1 font-medium ${health.email.status === 'success' ? 'text-green-700' : 'text-red-700'}`}>{health.email.message}</p>
                        </div>

                        <div className={`p-4 rounded-2xl border flex flex-col items-center text-center ${health.vercel.status === 'success' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                            <Server className={`w-6 h-6 mb-2 ${health.vercel.status === 'success' ? 'text-green-600' : 'text-red-600'}`} />
                            <h3 className="font-bold text-sm text-gray-900">שרת (Vercel)</h3>
                            <p className={`text-xs mt-1 font-medium ${health.vercel.status === 'success' ? 'text-green-700' : 'text-red-700'}`}>{health.vercel.message}</p>
                        </div>

                        <div className={`p-4 rounded-2xl border flex flex-col items-center text-center ${health.datagov.status === 'success' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                            <Globe className={`w-6 h-6 mb-2 ${health.datagov.status === 'success' ? 'text-green-600' : 'text-red-600'}`} />
                            <h3 className="font-bold text-sm text-gray-900">API מאגר ממשלתי</h3>
                            <p className={`text-xs mt-1 font-medium ${health.datagov.status === 'success' ? 'text-green-700' : 'text-red-700'}`}>{health.datagov.message}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Crons List */}
            <div className="mb-4">
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-500" />
                    אוטומציות יומיות ({crons.length})
                </h2>
            </div>

            {isLoading ? (
                <div className="text-center py-12 text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p>טוען...</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {crons.map((cron) => {
                        const badge = getStatusBadge(cron.lastRun?.status);
                        const isRunning = runningCron === cron.name;
                        
                        return (
                            <div key={cron.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all">
                                {/* Mobile: stacked / Desktop: row */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                    {/* Status icon + info */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                                            {getStatusIcon(cron.lastRun?.status)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-black text-gray-900 text-sm">{cron.label}</span>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${badge.color}`}>
                                                    {badge.label}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 mt-0.5 truncate">{cron.description}</p>
                                        </div>
                                    </div>

                                    {/* Schedule + Last run + Action */}
                                    <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 mr-13 sm:mr-0">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 justify-end">
                                                <Timer className="w-3 h-3" />
                                                {cron.scheduleLabel}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                {timeAgo(cron.lastRun?.started_at)}
                                            </p>
                                        </div>
                                        
                                        {/* Mobile schedule info */}
                                        <div className="flex items-center gap-3 text-[10px] text-gray-400 sm:hidden">
                                            <span className="flex items-center gap-1">
                                                <Timer className="w-3 h-3" />
                                                {cron.scheduleLabel}
                                            </span>
                                            <span>•</span>
                                            <span>{timeAgo(cron.lastRun?.started_at)}</span>
                                        </div>

                                        <button
                                            onClick={() => handleRunCron(cron)}
                                            disabled={isRunning}
                                            className="flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white text-[10px] font-black px-3 py-2 rounded-lg transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
                                        >
                                            <span className="hidden sm:inline">{isRunning ? 'מריץ...' : 'הרץ עכשיו'}</span>
                                            <span className="sm:hidden">{isRunning ? '...' : 'הרץ'}</span>
                                            {isRunning ? (
                                                <RefreshCw className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Play className="w-3 h-3" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Duration bar (if available) */}
                                {cron.lastRun?.duration_ms && (
                                    <div className="mt-2 pt-2 border-t border-gray-50">
                                        <p className="text-[9px] text-gray-400">
                                            זמן ריצה אחרון: {(cron.lastRun.duration_ms / 1000).toFixed(1)} שניות
                                            {cron.lastRun.message && <span className="mr-2">• {cron.lastRun.message}</span>}
                                        </p>
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
