"use client";
import { useEffect, useState } from 'react';
import { 
  Search, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft,
  MousePointer2,
  BarChart3,
  ListFilter,
  EyeOff
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

export default function SearchAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/analytics/search-queries');
      if (!res.ok) throw new Error('Failed to fetch data');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
        <div className="text-gray-500 font-medium italic">מנתח מילות חיפוש...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-200 rounded-2xl max-w-2xl mx-auto my-10">
        <div className="text-red-600 font-bold mb-2">שגיאה בטעינת הנתונים</div>
        <div className="text-sm text-red-500">{error}</div>
      </div>
    );
  }

  const { topQueries, zeroResults, recentSearches, trend, totals } = data;

  const zeroResultRate = totals.total_searches > 0 
    ? ((totals.zero_result_searches / totals.total_searches) * 100).toFixed(1) 
    : 0;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
            <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">חיפושים באתר</h1>
            </div>
            <p className="text-gray-500 font-medium">ניתוח חכם של מה שהלקוחות שלך מחפשים באתר</p>
        </div>
        <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition-all shadow-lg active:scale-95"
        >
          <TrendingUp className="w-4 h-4" />
          <span className="font-bold text-sm text-[11px] uppercase tracking-widest">רענן נתונים</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'סך חיפושים', val: totals.total_searches, icon: Search, color: 'blue' },
          { label: 'ביטויים ייחודיים', val: totals.unique_queries, icon: MousePointer2, color: 'purple' },
          { label: 'ללא תוצאות', val: totals.zero_result_searches, icon: EyeOff, color: 'orange' },
          { label: 'שיעור "החמצה"', val: `${zeroResultRate}%`, icon: AlertTriangle, color: 'red' },
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            {item.label !== 'סך חיפושים' && (
              <div className={`absolute top-0 right-0 w-1.5 h-full bg-${item.color}-500/20`}></div>
            )}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                <div className="text-4xl font-black text-gray-900">{item.val.toLocaleString()}</div>
              </div>
              <div className={`p-3 rounded-2xl bg-${item.color}-50 text-${item.color}-600`}>
                <item.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Trend Chart (Full Width Span) */}
        <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-black text-gray-900">מגמת חיפוש יומית</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">30 Day Search Volume</p>
                </div>
            </div>
            <div className="h-[300px]" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend}>
                        <defs>
                            <linearGradient id="colorSearch" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                            dataKey="date" 
                            tickLine={false} 
                            axisLine={false} 
                            tick={{fontSize: 9, fill: '#64748b'}} 
                            tickFormatter={(d) => new Date(d).toLocaleDateString('he-IL', {day: '2-digit', month: '2-digit'})}
                        />
                        <YAxis hide />
                        <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }} 
                            formatter={(value) => [value, 'חיפושים']}
                            labelFormatter={(label) => new Date(label).toLocaleDateString('he-IL')}
                        />
                        <Area type="monotone" dataKey="count" stroke="#000" strokeWidth={3} fillOpacity={1} fill="url(#colorSearch)" dot={{r: 4, fill: '#000', strokeWidth: 0}} activeDot={{r: 6}} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Top Queries Table */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
            <div>
                <h3 className="text-xl font-black text-gray-900">ביטויי החיפוש הכי פופולריים</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Top Customer Searches</p>
            </div>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-1">
            {/* Mobile View: Cards */}
            <div className="sm:hidden p-4 space-y-4">
                {topQueries.map((q, i) => (
                    <div key={i} className="bg-gray-50/50 p-5 rounded-3xl border border-gray-100 space-y-4">
                        <div className="flex justify-between items-start">
                            <span className="font-black text-gray-900 text-lg leading-tight">{q.query}</span>
                            {q.avg_results == 0 ? (
                                <span className="bg-red-50 text-red-600 text-[9px] font-black uppercase px-2 py-1 rounded-lg">ללא תוצאות</span>
                            ) : (
                                <span className="bg-green-50 text-green-600 text-[9px] font-black uppercase px-2 py-1 rounded-lg">פעיל</span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-3 rounded-2xl border border-gray-100">
                                <div className="text-[10px] text-gray-400 font-black uppercase mb-1">כמות חיפושים</div>
                                <div className="text-xl font-black text-gray-800">{q.count}</div>
                            </div>
                            <div className="bg-white p-3 rounded-2xl border border-gray-100">
                                <div className="text-[10px] text-gray-400 font-black uppercase mb-1">ממוצע תוצאות</div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-black text-gray-800">{Number(q.avg_results).toFixed(1)}</span>
                                    <div className="h-1.5 w-8 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${q.avg_results > 0 ? 'bg-green-500' : 'bg-red-400'}`} 
                                            style={{ width: `${Math.min(100, (q.avg_results / 5) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-right border-collapse">
                <thead className="bg-gray-50/50 text-[10px] text-gray-400 font-black uppercase tracking-widest border-b border-gray-50">
                    <tr>
                    <th className="px-8 py-4">ביטוי חיפוש</th>
                    <th className="px-8 py-4">כמות</th>
                    <th className="px-8 py-4">ממוצע תוצאות</th>
                    <th className="px-8 py-4">סטטוס</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {topQueries.map((q, i) => (
                    <tr key={i} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="px-8 py-5">
                            <span className="font-black text-gray-900 text-sm">{q.query}</span>
                        </td>
                        <td className="px-8 py-5 font-black text-gray-500 text-sm">
                            {q.count}
                        </td>
                        <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-gray-800">{Number(q.avg_results).toFixed(1)}</span>
                                <div className="flex-1 h-1 w-16 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${q.avg_results > 0 ? 'bg-green-500' : 'bg-red-400'}`} 
                                        style={{ width: `${Math.min(100, (q.avg_results / 5) * 100)}%` }}
                                    ></div>
                                </div>
                        </div>
                        </td>
                        <td className="px-8 py-5">
                            {q.avg_results == 0 ? (
                                <span className="bg-red-50 text-red-600 text-[9px] font-black uppercase px-2 py-1 rounded-lg">ללא תוצאות</span>
                            ) : (
                                <span className="bg-green-50 text-green-600 text-[9px] font-black uppercase px-2 py-1 rounded-lg">פעיל</span>
                            )}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          </div>
        </div>

        {/* Opportunity Gaps (Side Column) */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden border-orange-100">
            <div className="p-8 border-b border-orange-50 bg-orange-50/30">
                <div className="flex items-center gap-3 mb-1">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <h3 className="text-xl font-black text-gray-900">פוטנציאל מכירה</h3>
                </div>
                <p className="text-[10px] text-orange-600/60 font-black uppercase tracking-widest">Searches with No Results</p>
            </div>
            <div className="p-6 space-y-4">
                {zeroResults.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 italic text-sm">לא נמצאו "פספוסים" בינתיים...</div>
                ) : (
                    zeroResults.slice(0, 10).map((q, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-orange-50/20 rounded-2xl border border-orange-100/50 hover:bg-orange-50 transition-colors">
                            <div className="flex flex-col">
                                <span className="font-black text-gray-900 text-sm">{q.query}</span>
                                <span className="text-[9px] text-orange-600 font-bold uppercase tracking-tighter">חיפשו {q.count} פעמים</span>
                            </div>
                            <div className="h-8 w-8 rounded-xl bg-white border border-orange-100 flex items-center justify-center text-xs font-black text-orange-600 shadow-sm">
                                {i + 1}
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="p-6 border-t border-orange-50 bg-orange-50/10">
                <p className="text-[11px] text-gray-400 leading-relaxed font-medium italic">
                    בשמים אלו חופשו אך לא נמצאו באתר. מומלץ לשקול הוספתם למלאי.
                </p>
            </div>
        </div>

        {/* Recent Search Feed (Full Width) */}
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                <div>
                    <h3 className="text-xl font-black text-gray-900">פיד חיפושים בזמן אמת</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Live Customer Inquiries</p>
                </div>
                <Clock className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1">
                {/* Mobile View: Cards */}
                <div className="lg:hidden p-4 space-y-4">
                    {recentSearches.map((log) => (
                        <div key={log.id} className="bg-gray-50/50 p-5 rounded-3xl border border-gray-100 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                    <span className="font-black text-gray-900 text-base">{log.query}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={`h-1.5 w-1.5 rounded-full ${log.user_id ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
                                        <span className={`text-[10px] font-bold ${log.user_id ? 'text-indigo-600' : 'text-gray-500'} truncate max-w-[150px]`}>
                                            {log.user_email || 'משתמש לא רשום'}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-[10px] font-medium text-gray-400 tabular-nums">
                                    {new Date(log.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
                                <span className={`text-[11px] font-black ${log.results_count > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {log.results_count} תוצאות
                                </span>
                                <span className="text-[10px] bg-gray-100 text-gray-500 font-black uppercase px-2 py-0.5 rounded-lg">
                                    {log.platform || 'Desktop'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead className="bg-gray-50/50 text-[10px] text-gray-400 font-black uppercase tracking-widest border-b border-gray-50">
                            <tr>
                                <th className="px-8 py-4">זמן</th>
                                <th className="px-8 py-4">משתמש</th>
                                <th className="px-8 py-4">מילת חיפוש</th>
                                <th className="px-8 py-4">תוצאות</th>
                                <th className="px-8 py-4">פלטפורמה</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recentSearches.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                                    <td className="px-8 py-4 text-xs font-medium text-gray-400" dir="ltr">
                                        {new Date(log.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${log.user_id ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
                                            <span className={`text-xs font-bold ${log.user_id ? 'text-indigo-600' : 'text-gray-500'}`}>
                                                {log.user_email || 'משתמש לא רשום'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 font-black text-gray-900 text-sm">
                                        {log.query}
                                    </td>
                                    <td className="px-8 py-4">
                                        <span className={`text-xs font-black ${log.results_count > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {log.results_count} תוצאות
                                        </span>
                                    </td>
                                    <td className="px-8 py-4">
                                        <span className="text-[10px] bg-gray-100 text-gray-500 font-black uppercase px-2 py-0.5 rounded-lg border border-gray-200/50">
                                            {log.platform || 'Desktop'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
