"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    ScatterChart, Scatter, ZAxis, Cell, BarChart, Bar, Legend, PieChart, Pie
} from 'recharts';
import { 
    TrendingUp, AlertTriangle, Package, Zap, DollarSign, 
    Download, RefreshCw, Layers, Map, BarChart3, Search, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ProcurementClient() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    useEffect(() => {
        fetchData();
    }, []);

    const handleExport = () => {
        try {
            const { jsPDF } = require('jspdf');
            const doc = new jsPDF();
            
            // Add Hebrew font support if available, or use standard table
            doc.setFontSize(22);
            doc.text("ML_TLV - Procurement Draft Order", 20, 20);
            doc.setFontSize(12);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
            
            let y = 50;
            doc.text("Product", 20, y);
            doc.text("Stock", 100, y);
            doc.text("Recommended Order", 140, y);
            
            y += 10;
            doc.line(20, y - 5, 190, y - 5);
            
            const toOrder = data.insights.filter(i => i.daysRemaining < 30);
            
            toOrder.forEach(item => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                const recommendedAmount = Math.ceil(item.velocity * 60);
                doc.text(`${item.brand} ${item.model}`, 20, y);
                doc.text(`${Math.round(item.stock)} ml`, 100, y);
                doc.text(`${recommendedAmount} ml`, 140, y);
                y += 10;
            });
            
            doc.save(`Procurement_Order_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success("דו״ח רכש יוצא בהצלחה");
        } catch (err) {
            console.error(err);
            toast.error("שגיאה בהפקת הדו״ח");
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/procurement/insights');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            } else {
                toast.error("נכשלה טעינת הנתונים");
            }
        } catch (err) {
            console.error(err);
            toast.error("שגיאה בחיבור לשרת");
        } finally {
            setLoading(false);
        }
    };

    // Calculate BCG Matrix Data
    const bcgData = useMemo(() => {
        if (!data?.insights) return [];
        
        const insights = data.insights.filter(i => i.volume > 0 || i.revenue > 0);
        if (insights.length === 0) return [];

        const avgVolume = insights.reduce((sum, i) => sum + i.volume, 0) / insights.length;
        const avgProfit = insights.reduce((sum, i) => sum + i.profit, 0) / insights.length;

        return insights.map(i => {
            let category = 'Question Mark';
            let color = '#f59e0b'; // Amber

            if (i.volume >= avgVolume && i.profit >= avgProfit) {
                category = 'Star';
                color = '#6366f1'; // Indigo
            } else if (i.volume >= avgVolume && i.profit < avgProfit) {
                category = 'Cash Cow';
                color = '#10b981'; // Emerald
            } else if (i.volume < avgVolume && i.profit < avgProfit) {
                category = 'Dog';
                color = '#ef4444'; // Red
            }

            return {
                ...i,
                x: i.volume,
                y: i.profit,
                z: i.revenue,
                category,
                color,
                name: `${i.brand} ${i.model}`
            };
        });
    }, [data]);

    const filteredInsights = useMemo(() => {
        if (!data?.insights) return [];
        return data.insights.filter(i => 
            (i.brand + ' ' + i.model).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [data, searchTerm]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="text-gray-500 animate-pulse font-bold">מנתח נתונים ומייצר תובנות רכש...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12 overflow-x-hidden" dir="rtl">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 md:px-0">
                <KPICard 
                    title="רווח גולמי (90 יום)" 
                    value={`₪${Math.round(data?.meta?.totalProfit || 0).toLocaleString()}`} 
                    icon={<DollarSign className="text-blue-500" />}
                    trend="+12.5%"
                />
                <KPICard 
                    title="מחזור מכירות" 
                    value={`₪${Math.round(data?.meta?.totalRevenue || 0).toLocaleString()}`} 
                    icon={<TrendingUp className="text-emerald-500" />}
                    trend="+8.2%"
                />
                <KPICard 
                    title="בשמים בסיכון מלאי" 
                    value={data?.insights.filter(i => (i.daysRemaining || 999) < 15).length} 
                    icon={<AlertTriangle className="text-red-500" />}
                    sub="מתחת ל-15 ימים"
                    isAlert
                />
                <KPICard 
                    title="מלאי פעיל (מ״ל)" 
                    value={`${Math.round(data?.insights.reduce((sum, i) => sum + i.stock, 0)).toLocaleString()}`} 
                    icon={<Package className="text-amber-500" />}
                    sub="סך הכל בקבוקי אם"
                />
            </div>

            {/* Main Visualizations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 md:px-0">
                
                {/* 1. BCG Matrix Bubble Chart */}
                <ChartCard title="מטריצת BCG: פופולריות מול רווחיות" subtitle="Stars (Indigo), Cash Cows (Green), Question Marks (Amber), Dogs (Red)">
                    <div className="h-[350px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis type="number" dataKey="x" name="נפח מכירות (מ״ל)" />
                                <YAxis type="number" dataKey="y" name="רווח (₪)" />
                                <ZAxis type="number" dataKey="z" range={[50, 400]} name="מחזור" />
                                <Tooltip 
                                    cursor={{ strokeDasharray: '3 3' }} 
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const item = payload[0].payload;
                                            return (
                                                <div className="bg-black/90 text-white p-3 rounded-xl shadow-2xl border border-white/10 backdrop-blur-md text-right" dir="rtl">
                                                    <p className="font-bold border-b border-white/20 pb-1 mb-2">{item.name}</p>
                                                    <p className="text-xs">נפח: {Math.round(item.x)} מ״ל</p>
                                                    <p className="text-xs">רווח: ₪{Math.round(item.y)}</p>
                                                    <p className="text-xs font-bold text-blue-400 mt-1 uppercase">
                                                        {item.category === 'Star' ? 'כוכב' : 
                                                         item.category === 'Cash Cow' ? 'פרה חולבת' : 
                                                         item.category === 'Dog' ? 'מלאי מת' : 'סימן שאלה'}
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Scatter name="Products" data={bcgData}>
                                    {bcgData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                {/* 2. Top Fragrance Notes (Trend Intelligence) */}
                <ChartCard title="Trend Intelligence: תווי ריח מבוקשים" subtitle="נפח מכירות משוקלל לפי רכיבי הבושם">
                    <div className="h-[350px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.topNotes || []} layout="vertical">
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#6366f1" />
                                        <stop offset="100%" stopColor="#ec4899" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.05} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fill: '#666' }} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', textAlign: 'right' }}
                                    cursor={{ fill: 'transparent' }}
                                    formatter={(value) => [`${Math.round(value)} מ״ל`, 'נפח']}
                                />
                                <Bar dataKey="volume" radius={[0, 4, 4, 0]} barSize={20} fill="url(#barGradient)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                {/* 3. Brand Performance */}
                <ChartCard title="ביצועי מותגים מקבילים" subtitle="השוואת רווחיות ומחזור לפי בתי בישום">
                    <div className="h-[350px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={(data?.brandPerformance || []).slice(0, 8)}>
                                <defs>
                                    <linearGradient id="brandGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" hide />
                                <YAxis hide />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', textAlign: 'right' }}
                                    formatter={(value, name) => [
                                        `₪${Math.round(value)}`, 
                                        name === 'profit' ? 'רווח' : 'מחזור'
                                    ]}
                                />
                                <Area type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={1} fill="url(#brandGrad)" strokeWidth={3} />
                                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="none" strokeWidth={2} strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                {/* 4. Dead Stock & Alerts */}
                <ChartCard title="התראות מלאי מת (Dead Stock)" subtitle="מוצרים שלא נמכרו ב-30 הימים האחרונים">
                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 mt-4 custom-scrollbar">
                        {data?.insights.filter(i => i.volume === 0).length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-gray-400 opacity-50">
                                <Zap className="w-12 h-12 mb-2" />
                                <p>אין מלאי מת כרגע!</p>
                            </div>
                        ) : (
                            data?.insights.filter(i => i.volume === 0).slice(0, 10).map(item => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-md transition">
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm overflow-hidden">
                                            {item.image_url ? (
                                                <Image src={item.image_url} alt={item.model} fill className="object-cover" />
                                            ) : (
                                                <span className="text-xl">🧴</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="font-bold text-sm leading-tight">{item.brand}</p>
                                            <p className="text-xs text-gray-500">{item.model}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => router.push(`/admin/coupons?product=${item.id}`)}
                                            className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded-lg font-bold hover:bg-black transition shadow-sm"
                                        >
                                            צור קופון
                                        </button>
                                        <button 
                                            onClick={() => router.push(`/admin/catalogs?product=${item.id}`)}
                                            className="text-[10px] bg-gray-200 text-gray-700 px-2 py-1 rounded-lg font-bold hover:bg-gray-300 transition"
                                        >
                                            מארז
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ChartCard>
            </div>

            {/* Smart Order List Section */}
            <div className="px-4 md:px-0 mt-8">
                <div className="bg-white rounded-3xl border shadow-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <BarChart3 className="text-blue-600 w-5 h-5" />
                                מחשבון רכש חכם (Order Optimizer)
                            </h2>
                            <p className="text-gray-500 text-xs mt-1">כמויות מומלצות להזמנה לפי קצב מכירות ויתרת מלאי</p>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <input 
                                    type="text" 
                                    placeholder="חפש בושם..." 
                                    className="w-full bg-gray-50 border rounded-full px-10 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                            </div>
                            <button 
                                onClick={handleExport}
                                className="bg-black text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-gray-800 transition flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                ייצוא רכש
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-right border-separate border-spacing-y-2">
                            <thead>
                                <tr className="text-gray-400 text-[11px] uppercase tracking-widest">
                                    <th className="px-4 py-2 font-black">בושם</th>
                                    <th className="px-4 py-2 font-black">מלאי נוכחי</th>
                                    <th className="px-4 py-2 font-black">קצב (שבוע)</th>
                                    <th className="px-4 py-2 font-black">צפי לסיום</th>
                                    <th className="px-4 py-2 font-black text-center">המלצה לרכש</th>
                                    <th className="px-4 py-2 font-black">פעולה</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInsights.slice(0, 50).map((item) => {
                                    const isUrgent = (item.daysRemaining || 999) < 14;
                                    const recommendedOrder = item.daysRemaining < 30 ? Math.ceil(item.velocity * 60) : 0; // Target 60 days of stock

                                    return (
                                        <tr key={item.id} className={`bg-gray-50/50 hover:bg-white transition-all group border rounded-xl ${isUrgent ? 'border-red-100 shadow-[0_0_15px_-5px_rgba(239,68,68,0.2)]' : 'border-transparent'}`}>
                                            <td className="px-4 py-3 rounded-r-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-10 h-10 bg-white rounded-lg flex-shrink-0 shadow-sm border border-gray-100 overflow-hidden">
                                                        {item.image_url ? (
                                                            <Image src={item.image_url} alt={item.model} fill className="object-cover" />
                                                        ) : (
                                                            <span className="text-lg flex items-center justify-center h-full">🧴</span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm">{item.brand}</span>
                                                        <span className="text-xs text-gray-400">{item.model}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold">{Math.round(item.stock)} מ״ל</span>
                                                    <div className="w-16 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${isUrgent ? 'bg-red-500' : 'bg-blue-500'}`} 
                                                            style={{ width: `${Math.min(100, (item.stock / 200) * 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium">
                                                {Math.round(item.velocity * 7)} מ״ל
                                            </td>
                                            <td className="px-4 py-3">
                                                {item.velocity > 0 ? (
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isUrgent ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        {Math.round(item.daysRemaining)} ימים
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300 italic text-[10px]">מלאי מצטבר</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {recommendedOrder > 0 ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-xs font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                                                            הזמן {recommendedOrder} מ״ל
                                                        </span>
                                                        <span className="text-[9px] text-gray-400 mt-0.5">כיסוי ל-60 יום</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-green-500 text-xs font-bold">מלאי מספיק</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 rounded-l-xl">
                                                <button 
                                                    onClick={() => router.push(`/product/${item.id}`)}
                                                    className="p-2 hover:bg-black hover:text-white rounded-xl transition-all border border-transparent hover:shadow-lg"
                                                    title="צפה במוצר"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, icon, trend, sub, isAlert }) {
    return (
        <div className={`p-6 rounded-[2rem] border transition shadow-sm bg-white hover:shadow-xl hover:-translate-y-1 duration-300 relative overflow-hidden h-full ${isAlert ? 'border-red-100' : 'border-gray-100'}`}>
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-gray-50 rounded-2xl">
                    {icon}
                </div>
                {trend && (
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2 py-1 rounded-full border border-emerald-100">
                        {trend}
                    </span>
                )}
            </div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{title}</h3>
            <p className={`text-2xl font-black tracking-tighter ${isAlert ? 'text-red-500' : 'text-gray-900'}`}>{value}</p>
            {sub && <p className="text-[11px] text-gray-400 mt-2 font-medium">{sub}</p>}
        </div>
    );
}

function ChartCard({ title, subtitle, children }) {
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden h-full">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h3>
                <p className="text-xs text-gray-400 font-medium">{subtitle}</p>
            </div>
            {children}
        </div>
    );
}
