"use client";
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, ComposedChart, Cell, AreaChart, Area } from 'recharts';
import { Search, Globe, MousePointer2, Eye, TrendingUp, Layers, MapPin, ExternalLink, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight, Filter, Activity, ArrowLeft, ArrowRight, Clock, Target, CheckCircle2 } from 'lucide-react';

export default function AnalyticsDashboard() {
  const [gaData, setGaData] = useState({ daily: [], sources: [], pages: [] });
  const [gscData, setGscData] = useState({ daily: [], queries: [], pages: [] });
  const [funnelData, setFunnelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [totals, setTotals] = useState({ users: 0, views: 0, clicks: 0, impressions: 0 });
  
  // Pagination State for Queries & Sources
  const [queryPage, setQueryPage] = useState(1);
  const [sourcePage, setSourcePage] = useState(1);
  const itemsPerPage = 6;

  // Funnel period selector
  const [funnelDays, setFunnelDays] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [gaRes, gscRes, funnelRes] = await Promise.all([
          fetch('/api/admin/analytics/ga'),
          fetch('/api/admin/analytics/gsc'),
          fetch(`/api/analytics/funnel?days=${funnelDays}`)
        ]);
        
        const gaJson = await gaRes.json();
        const gscJson = await gscRes.json();
        const funnelJson = funnelRes.ok ? await funnelRes.json() : null;
        
        if (gaJson.error) throw new Error("GA Error: " + gaJson.error);
        if (gscJson.error) throw new Error("GSC Error: " + gscJson.error);

        // 1. Process GA Daily
        const parsedGaDaily = [];
        let tUsers = 0;
        let tViews = 0;
        if (gaJson.daily?.rows) {
          gaJson.daily.rows.forEach(row => {
            const rawDate = row.dimensionValues[0].value;
            const dateStr = `${rawDate.slice(0,4)}-${rawDate.slice(4,6)}-${rawDate.slice(6,8)}`;
            const users = parseInt(row.metricValues[0].value || 0);
            const views = parseInt(row.metricValues[1].value || 0);
            tUsers += users;
            tViews += views;
            parsedGaDaily.push({ date: dateStr, users, views });
          });
          parsedGaDaily.sort((a,b) => new Date(a.date) - new Date(b.date));
        }

        // 2. Process GA Sources
        const parsedSources = gaJson.sources?.rows?.map(row => ({
          name: row.dimensionValues[0].value,
          users: parseInt(row.metricValues[0].value)
        })) || [];

        // 3. Process GA Pages
        const parsedGaPages = gaJson.pages?.rows?.map(row => ({
          path: row.dimensionValues[0].value,
          views: parseInt(row.metricValues[0].value)
        })) || [];

        // 4. Process GSC Daily
        const parsedGscDaily = [];
        let tClicks = 0;
        let tImpressions = 0;
        if (gscJson.daily) {
          gscJson.daily.forEach(row => {
            parsedGscDaily.push({
              date: row.keys[0],
              clicks: row.clicks,
              impressions: row.impressions
            });
            tClicks += row.clicks;
            tImpressions += row.impressions;
          });
          parsedGscDaily.sort((a,b) => new Date(a.date) - new Date(b.date));
        }

        const sortedQueries = [...(gscJson.queries || [])].sort((a, b) => {
          if (b.clicks !== a.clicks) return (b.clicks || 0) - (a.clicks || 0);
          return (b.impressions || 0) - (a.impressions || 0);
        });

        setTotals({ users: tUsers, views: tViews, clicks: tClicks, impressions: tImpressions });
        setGaData({ daily: parsedGaDaily, sources: parsedSources, pages: parsedGaPages });
        setGscData({ daily: parsedGscDaily, queries: sortedQueries, pages: gscJson.pages || [] });
        setFunnelData(funnelJson);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Refetch funnel only when days change
  const refetchFunnel = async (days) => {
    try {
      const res = await fetch(`/api/analytics/funnel?days=${days}`);
      if (res.ok) {
        const data = await res.json();
        setFunnelData(data);
      }
    } catch (e) {}
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
         <div className="text-gray-500 font-medium">מעבד נתונים מגוגל...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-200 rounded-xl max-w-2xl mx-auto my-10">
        <div className="text-red-600 font-bold mb-2">שגיאת חיבור ל-Cloud</div>
        <div className="text-sm text-red-500">{error}</div>
      </div>
    );
  }

  // Funnel helpers
  const funnelSteps = funnelData ? [
    { key: 'page_visit', label: 'כניסות לאתר', value: funnelData.funnel.page_visit, color: '#6366f1', icon: Globe },
    { key: 'add_to_cart', label: 'הוספה לסל', value: funnelData.funnel.add_to_cart, color: '#a855f7', icon: MousePointer2 },
    { key: 'checkout_started', label: 'התחלת צ׳קאאוט', value: funnelData.funnel.checkout_started, color: '#3b82f6', icon: Activity },
    { key: 'order_completed', label: 'הזמנה הושלמה', value: funnelData.funnel.order_completed, color: '#10b981', icon: CheckCircle2 },
  ] : [];

  const getConversionRate = (from, to) => {
    if (!from || from === 0) return 0;
    return ((to / from) * 100).toFixed(1);
  };

  return (
    <div className="p-4 md:p-8 max-w-screen-2xl mx-auto space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">אנליטיקה וביצועים</h1>
          <p className="text-gray-500 font-medium mt-1">סקירה מקיפה של 30 הימים האחרונים מ-GA4 ו-Search Console</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'משתמשים פעילים', val: totals.users, icon: Globe, color: 'blue' },
          { label: 'צפיות בדפים', val: totals.views, icon: Eye, color: 'teal' },
          { label: 'קליקים אורגניים', val: totals.clicks, icon: MousePointer2, color: 'purple' },
          { label: 'חשיפות בחיפוש', val: totals.impressions, icon: Search, color: 'orange' },
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-1.5 h-full bg-${item.color}-500 opacity-20`}></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                <div className="text-4xl font-black text-gray-900">{item.val.toLocaleString()}</div>
              </div>
              <div className={`p-3 rounded-xl bg-${item.color}-50`}>
                <item.icon className={`w-6 h-6 text-${item.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Conversion Funnel Section - Premium Redesign */}
      {funnelData && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/30">
            <div>
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                <Target className="w-6 h-6 text-indigo-500" />
                משפך המרה מלא
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Conversion Funnel Analysis</p>
            </div>
            <div className="flex gap-1.5 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
              {[7, 14, 30, 90].map(d => (
                <button 
                  key={d}
                  onClick={() => { setFunnelDays(d); refetchFunnel(d); }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${funnelDays === d ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                >
                  {d === 7 ? 'שבוע' : d === 14 ? 'שבועיים' : d === 30 ? 'חודש' : '3 חודשים'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {funnelSteps.map((step, i) => {
                const prevStep = i > 0 ? funnelSteps[i - 1] : null;
                const convRate = prevStep ? getConversionRate(prevStep.value, step.value) : null;

                return (
                  <div key={step.key} className="relative group">
                    <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 hover:border-gray-200 hover:bg-white hover:shadow-xl transition-all duration-500 h-full flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className={`p-3 rounded-2xl bg-white shadow-sm border border-gray-50 text-gray-900 group-hover:scale-110 transition-transform duration-500`}>
                            <step.icon className="w-5 h-5" style={{ color: step.color }} />
                          </div>
                          {convRate !== null && (
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">המרה</span>
                              <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{convRate}%</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{step.label}</p>
                          <div className="text-3xl font-black text-gray-900">{step.value.toLocaleString()}</div>
                        </div>
                      </div>
                      
                      {/* Step visual indicator */}
                      <div className="mt-6 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000 delay-300"
                          style={{ 
                            width: `${Math.max(5, (step.value / funnelSteps[0].value) * 100)}%`,
                            backgroundColor: step.color 
                          }}
                        />
                      </div>
                    </div>

                    {/* Arrow between steps desktop */}
                    {i < funnelSteps.length - 1 && (
                      <div className="hidden lg:flex absolute top-1/2 -left-2 -translate-y-1/2 z-10 w-4 h-4 items-center justify-center bg-white border border-gray-100 rounded-full shadow-sm text-gray-300 rotate-180">
                         <ArrowRight size={10} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center border-t border-gray-100 pt-10">
              {/* Overall rate - Gauge Visual */}
              <div className="flex flex-col items-center justify-center space-y-4 bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="64" cy="64" r="58" fill="transparent" stroke="#e2e8f0" strokeWidth="8" />
                    <circle 
                      cx="64" cy="64" r="58" fill="transparent" 
                      stroke="url(#gaugeGradient)" strokeWidth="10" strokeDasharray={2 * Math.PI * 58} 
                      strokeDashoffset={2 * Math.PI * 58 * (1 - Math.min(1, getConversionRate(funnelSteps[0].value, funnelSteps[3].value) / 100))} 
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-gray-900">{getConversionRate(funnelSteps[0].value, funnelSteps[3].value)}%</span>
                  </div>
                </div>
                <div className="text-center">
                   <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">שיעור המרה כולל</h4>
                   <p className="text-[10px] text-gray-400 font-bold">Total Funnel Efficiency</p>
                </div>
              </div>

              {/* Daily Trend Chart - Enhanced */}
              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-gray-400" />
                    מגמת המרה לאורך זמן
                  </h4>
                  <div className="flex gap-4 text-[9px] font-black uppercase tracking-tighter">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-indigo-500 rounded-full"></span>הוספה לסל</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span>הזמנות</span>
                  </div>
                </div>
                <div className="h-[200px]" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={funnelData.daily}>
                      <defs>
                        <linearGradient id="colorAddToCart" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} tickFormatter={(d) => d.split('-')[2]} />
                      <YAxis hide />
                      <Tooltip 
                        labelStyle={{ color: '#111827', fontWeight: 'bold', marginBottom: '4px', fontSize: '11px' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px' }} 
                        formatter={(value, name) => [value.toLocaleString(), name]}
                      />
                      <Area name="הוספה לסל" type="monotone" dataKey="add_to_cart" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAddToCart)" dot={false} />
                      <Area name="הזמנות" type="monotone" dataKey="order_completed" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" dot={{r: 3, fill: '#10b981', strokeWidth: 0}} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GA Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              מגמות תנועה (GA4)
            </h3>
            <div className="flex gap-4 text-xs font-bold">
               <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-500 rounded-full"></span>גולשים</span>
               <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-teal-400 rounded-full"></span>צפיות</span>
            </div>
          </div>
          <div className="h-[300px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gaData.daily}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{fontSize: 10, fill: '#64748b'}} tickFormatter={(d) => d.split('-')[2]} />
                <YAxis hide />
                <Tooltip 
                  labelStyle={{ color: '#111827', fontWeight: 'bold', marginBottom: '4px' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                  formatter={(value, name) => [value.toLocaleString(), name]}
                />
                <Line name="צפיות" type="monotone" dataKey="views" stroke="#2dd4bf" strokeWidth={3} dot={false} strokeDasharray="5 5" />
                <Line name="גולשים" type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={4} dot={{r: 0}} activeDot={{r: 6, strokeWidth: 0}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GSC Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Search className="w-5 h-5 text-purple-600" />
              ביצועי חיפוש (GSC)
            </h3>
            <div className="flex gap-4 text-xs font-bold">
               <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-purple-600 rounded-full"></span>קליקים</span>
               <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-orange-400 rounded-full"></span>חשיפות</span>
            </div>
          </div>
          <div className="h-[300px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={gscData.daily}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{fontSize: 10, fill: '#64748b'}} tickFormatter={(d) => d.split('-')[2]} />
                <YAxis hide />
                <Tooltip 
                  labelStyle={{ color: '#111827', fontWeight: 'bold', marginBottom: '4px' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                  formatter={(value, name) => [value.toLocaleString(), name]}
                />
                <Bar name="קליקים" dataKey="clicks" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
                <Line name="חשיפות" type="monotone" dataKey="impressions" stroke="#fb923c" strokeWidth={3} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables Row 1: Source & Queries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Queries */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
            <h3 className="font-bold flex items-center gap-2 text-gray-700">
              <Search className="w-4 h-4 text-purple-600" />
              מילות חיפוש מובילות
            </h3>
            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold">Search Console</span>
          </div>
          <div className="p-5 min-h-[350px]">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead className="bg-gray-50/50 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-3 sm:px-5 py-2">ביטוי חיפוש</th>
                    <th className="px-3 sm:px-5 py-2">קליקים</th>
                    <th className="px-3 sm:px-5 py-2 hidden sm:table-cell">חשיפות</th>
                    <th className="px-3 sm:px-5 py-2 hidden sm:table-cell">CTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-[13px]">
                  {gscData.queries.slice((queryPage - 1) * itemsPerPage, queryPage * itemsPerPage).map((q, i) => (
                    <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-3 sm:px-5 py-2.5 text-xs sm:text-sm font-bold text-gray-800 break-words max-w-[120px] sm:max-w-[200px]" title={q.keys[0]}>{q.keys[0]}</td>
                      <td className="px-3 sm:px-5 py-2.5 text-sm text-gray-600 font-medium">{(q.clicks || 0).toLocaleString()}</td>
                      <td className="px-3 sm:px-5 py-2.5 text-sm text-gray-500 hidden sm:table-cell">{(q.impressions || 0).toLocaleString()}</td>
                      <td className="px-3 sm:px-5 py-2.5 text-xs font-bold text-blue-600 hidden sm:table-cell">{(q.ctr * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pagination Controls */}
          {gscData.queries.length > itemsPerPage && (
            <div className="px-4 py-2 border-t border-gray-50 flex items-center justify-between bg-white">
               <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                 עמוד {queryPage} מתוך {Math.ceil(gscData.queries.length / itemsPerPage)}
               </div>
               <div className="flex gap-2">
                 <button 
                   onClick={() => setQueryPage(p => Math.max(1, p - 1))}
                   disabled={queryPage === 1}
                   className="p-1.5 rounded-lg border border-gray-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                 >
                   <ChevronRight className="w-4 h-4 text-gray-600" />
                 </button>
                 <button 
                   onClick={() => setQueryPage(p => Math.min(Math.ceil(gscData.queries.length / itemsPerPage), p + 1))}
                   disabled={queryPage >= Math.ceil(gscData.queries.length / itemsPerPage)}
                   className="p-1.5 rounded-lg border border-gray-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                 >
                   <ChevronLeft className="w-4 h-4 text-gray-600" />
                 </button>
               </div>
            </div>
          )}
        </div>

        {/* Traffic Sources */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
            <h3 className="font-bold flex items-center gap-2 text-gray-700">
              <Globe className="w-4 h-4 text-blue-600" />
              מקורות תנועה
            </h3>
             <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">GA4</span>
          </div>
          <div className="p-5 min-h-[350px]">
            <div className="space-y-3.5">
              {gaData.sources.slice((sourcePage - 1) * itemsPerPage, sourcePage * itemsPerPage).map((s, i) => {
                const percentage = Math.round((s.users / totals.users) * 100);
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-gray-700">{s.name === '(direct)' ? 'תנועה ישירה' : s.name}</span>
                      <span className="text-gray-400 font-medium">{s.users} משתמשים ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination Controls for Sources */}
          {gaData.sources.length > itemsPerPage && (
            <div className="px-4 py-2 border-t border-gray-50 flex items-center justify-between bg-white">
               <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                 עמוד {sourcePage} מתוך {Math.ceil(gaData.sources.length / itemsPerPage)}
               </div>
               <div className="flex gap-2">
                 <button 
                   onClick={() => setSourcePage(p => Math.max(1, p - 1))}
                   disabled={sourcePage === 1}
                   className="p-1.5 rounded-lg border border-gray-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                 >
                   <ChevronRight className="w-4 h-4 text-gray-600" />
                 </button>
                 <button 
                   onClick={() => setSourcePage(p => Math.min(Math.ceil(gaData.sources.length / itemsPerPage), p + 1))}
                   disabled={sourcePage >= Math.ceil(gaData.sources.length / itemsPerPage)}
                   className="p-1.5 rounded-lg border border-gray-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                 >
                   <ChevronLeft className="w-4 h-4 text-gray-600" />
                 </button>
               </div>
            </div>
          )}

        </div>
      </div>

      {/* Row 2: Top Pages */}
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
           <div className="p-6 border-b border-gray-50 bg-gray-50/30">
             <h3 className="font-bold flex items-center gap-2 text-gray-700">
                <Layers className="w-4 h-4 text-emerald-600" />
                הדפים הנצפים ביותר
             </h3>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-right border-collapse">
               <thead className="bg-gray-50/50 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                 <tr>
                   <th className="px-4 sm:px-5 py-2">דף (Path)</th>
                   <th className="px-4 sm:px-5 py-2">צפיות</th>
                   <th className="px-4 sm:px-5 py-2 text-center hidden sm:table-cell">פעולה</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {gaData.pages.map((p, i) => (
                   <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                     <td className="px-4 sm:px-5 py-3 text-xs sm:text-sm font-medium text-gray-600 break-all max-w-[150px] sm:max-w-xs" dir="ltr" style={{ textAlign: 'right' }}>{p.path}</td>
                     <td className="px-4 sm:px-5 py-3">
                        <div className="flex items-center gap-3">
                           <span className="text-sm font-black text-gray-800">{p.views.toLocaleString()}</span>
                           <div className="flex-1 h-1 bg-gray-100 rounded-full min-w-[60px] hidden md:block">
                              <div className="h-full bg-emerald-500 rounded-full" style={{width: `${Math.min(100, (p.views / gaData.pages[0].views) * 100)}%`}}></div>
                           </div>
                        </div>
                     </td>
                     <td className="px-6 py-3 text-center hidden sm:table-cell">
                        <a href={p.path} target="_blank" className="inline-flex p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                           <ExternalLink className="w-4 h-4" />
                        </a>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
}
