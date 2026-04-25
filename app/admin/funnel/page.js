"use client";

import { useEffect, useState, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Target, Globe, MousePointer2, Activity, CheckCircle2, TrendingDown, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

const STEPS = [
    { key: 'page_visit', label: 'כניסות לאתר', shortLabel: 'כניסות', icon: Globe, color: '#6366f1', bgLight: 'bg-indigo-50', textColor: 'text-indigo-600' },
    { key: 'add_to_cart', label: 'הוספה לסל', shortLabel: 'סל', icon: MousePointer2, color: '#a855f7', bgLight: 'bg-purple-50', textColor: 'text-purple-600' },
    { key: 'checkout_started', label: 'התחלת צ׳קאאוט', shortLabel: 'צ׳קאאוט', icon: Activity, color: '#3b82f6', bgLight: 'bg-blue-50', textColor: 'text-blue-600' },
    { key: 'order_completed', label: 'הזמנה הושלמה', shortLabel: 'הזמנה', icon: CheckCircle2, color: '#10b981', bgLight: 'bg-emerald-50', textColor: 'text-emerald-600' },
];

const PERIODS = [
    { days: 7, label: 'שבוע' },
    { days: 14, label: 'שבועיים' },
    { days: 30, label: 'חודש' },
    { days: 90, label: '3 חודשים' },
];

function rate(from, to) {
    if (!from || from === 0) return 0;
    return ((to / from) * 100);
}

function fmtRate(val) {
    return val.toFixed(1) + '%';
}

export default function FunnelPage() {
    const [data, setData] = useState(null);
    const [days, setDays] = useState(30);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async (d) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/analytics/funnel?days=${d}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const json = await res.json();
            setData(json);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(days); }, [days, fetchData]);

    const changePeriod = (d) => { setDays(d); };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh]">
            <Loader2 className="w-10 h-10 animate-spin text-gray-300 mb-4" />
            <span className="text-gray-400 font-semibold">טוען נתוני משפך...</span>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center max-w-md mx-auto mt-20">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <p className="text-red-600 font-bold mb-2">שגיאה בטעינת נתונים</p>
                <p className="text-red-400 text-sm">{error}</p>
                <button onClick={() => fetchData(days)} className="mt-4 text-sm text-blue-600 hover:underline font-bold">נסה שוב</button>
            </div>
        </div>
    );

    if (!data) return null;

    const funnel = data.funnel;
    const daily = data.daily || [];
    const totalConv = rate(funnel.page_visit, funnel.order_completed);

    // Build step-to-step conversion rates
    const stepData = STEPS.map((step, i) => {
        const value = funnel[step.key] || 0;
        const prevValue = i > 0 ? (funnel[STEPS[i - 1].key] || 0) : null;
        const convRate = prevValue !== null ? rate(prevValue, value) : null;
        const dropoff = prevValue !== null ? prevValue - value : null;
        const dropoffPct = prevValue !== null && prevValue > 0 ? ((dropoff / prevValue) * 100) : null;
        const barWidth = funnel.page_visit > 0 ? Math.max(8, (value / funnel.page_visit) * 100) : 8;
        return { ...step, value, convRate, dropoff, dropoffPct, barWidth };
    });

    // Find biggest drop
    const biggestDrop = stepData.reduce((max, s) => {
        if (s.dropoffPct !== null && (max === null || s.dropoffPct > max.dropoffPct)) return s;
        return max;
    }, null);

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Target className="w-8 h-8 text-indigo-500" />
                        משפך המרה
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">מעקב אחרי מסע הלקוח — מכניסה ועד רכישה</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => fetchData(days)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
                        <RefreshCw size={18} />
                    </button>
                    <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                        {PERIODS.map(p => (
                            <button key={p.days} onClick={() => changePeriod(p.days)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${days === p.days ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Overall Conversion + Insight */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Gauge */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 flex flex-col items-center justify-center">
                    <div className="relative w-36 h-36 flex items-center justify-center mb-4">
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="72" cy="72" r="62" fill="transparent" stroke="#e2e8f0" strokeWidth="10" />
                            <circle cx="72" cy="72" r="62" fill="transparent"
                                stroke="url(#funnelGauge)" strokeWidth="12"
                                strokeDasharray={2 * Math.PI * 62}
                                strokeDashoffset={2 * Math.PI * 62 * (1 - Math.min(1, totalConv / 100))}
                                strokeLinecap="round" />
                            <defs>
                                <linearGradient id="funnelGauge" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="100%" stopColor="#10b981" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-gray-900">{fmtRate(totalConv)}</span>
                        </div>
                    </div>
                    <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">שיעור המרה כולל</h4>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">כניסה → הזמנה</p>
                </div>

                {/* Biggest Dropoff Insight */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-2xl bg-red-50">
                            <TrendingDown className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">צוואר בקבוק</h4>
                            <p className="text-[10px] text-gray-400 font-bold">Biggest Drop-off Point</p>
                        </div>
                    </div>
                    {biggestDrop ? (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-black text-red-600">{fmtRate(biggestDrop.dropoffPct)}</span>
                                <span className="text-sm text-gray-500 font-semibold">נושרים</span>
                            </div>
                            <p className="text-sm text-gray-600">
                                <span className="font-bold">{biggestDrop.dropoff?.toLocaleString()}</span> מבקרים נושרים לפני שלב <span className="font-bold">{biggestDrop.label}</span>
                            </p>
                            <p className="text-xs text-gray-400 mt-2">💡 שיפור שלב זה יכול להגדיל הכנסות משמעותית</p>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">אין מספיק נתונים</p>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 flex flex-col justify-between">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">סיכום מהיר</h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 font-semibold">סל → צ׳קאאוט</span>
                            <span className="text-sm font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                                {fmtRate(rate(funnel.add_to_cart, funnel.checkout_started))}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 font-semibold">צ׳קאאוט → הזמנה</span>
                            <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                                {fmtRate(rate(funnel.checkout_started, funnel.order_completed))}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 font-semibold">כניסה → סל</span>
                            <span className="text-sm font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg">
                                {fmtRate(rate(funnel.page_visit, funnel.add_to_cart))}
                            </span>
                        </div>
                        <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                            <span className="text-sm text-gray-800 font-bold">סה״כ הזמנות</span>
                            <span className="text-xl font-black text-gray-900">{funnel.order_completed?.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Funnel Visual — Horizontal Bars */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 p-8">
                <h3 className="text-lg font-black text-gray-900 mb-8 flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-500" />
                    ויזואליזציה של המשפך
                </h3>
                <div className="space-y-5">
                    {stepData.map((step, i) => {
                        const StepIcon = step.icon;
                        return (
                            <div key={step.key}>
                                <div className="flex items-center gap-4 mb-2">
                                    <div className={`p-2 rounded-xl ${step.bgLight}`}>
                                        <StepIcon className="w-4 h-4" style={{ color: step.color }} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-bold text-gray-800">{step.label}</span>
                                            <div className="flex items-center gap-3">
                                                {step.convRate !== null && (
                                                    <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${step.bgLight} ${step.textColor}`}>
                                                        {fmtRate(step.convRate)}
                                                    </span>
                                                )}
                                                <span className="text-lg font-black text-gray-900">{step.value.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        {/* Bar */}
                                        <div className="w-full h-8 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                                            <div className="h-full rounded-xl transition-all duration-1000 ease-out flex items-center justify-end pr-3"
                                                style={{ width: `${step.barWidth}%`, backgroundColor: step.color + '20', borderRight: `4px solid ${step.color}` }}>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Dropoff indicator between steps */}
                                {step.dropoff !== null && step.dropoff > 0 && i < stepData.length && (
                                    <div className="flex items-center gap-2 mr-12 mt-1 mb-1">
                                        <TrendingDown className="w-3 h-3 text-red-400" />
                                        <span className="text-[11px] text-red-400 font-semibold">
                                            ↓ {step.dropoff.toLocaleString()} נושרים ({fmtRate(step.dropoffPct)})
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Daily Trend Chart */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-gray-400" />
                        מגמת המרה יומית
                    </h3>
                    <div className="flex gap-4 text-[9px] font-black uppercase tracking-tighter">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span>הוספה לסל</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>צ׳קאאוט</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>הזמנות</span>
                    </div>
                </div>
                <div className="h-[280px]" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={daily}>
                            <defs>
                                <linearGradient id="fAddToCart" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="fCheckout" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="fOrders" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }}
                                tickFormatter={(d) => { const parts = d.split('-'); return `${parts[2]}/${parts[1]}`; }} />
                            <YAxis hide />
                            <Tooltip
                                labelStyle={{ color: '#111827', fontWeight: 'bold', marginBottom: '4px', fontSize: '11px' }}
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                                formatter={(value, name) => [value.toLocaleString(), name]}
                            />
                            <Area name="הוספה לסל" type="monotone" dataKey="add_to_cart" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#fAddToCart)" dot={false} />
                            <Area name="צ׳קאאוט" type="monotone" dataKey="checkout_started" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#fCheckout)" dot={false} />
                            <Area name="הזמנות" type="monotone" dataKey="order_completed" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#fOrders)" dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
