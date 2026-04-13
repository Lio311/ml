"use client";
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, ComposedChart, Cell } from 'recharts';
import { Search, Globe, MousePointer2, Eye, TrendingUp, Layers, MapPin, ExternalLink, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function AnalyticsDashboard() {
  const [gaData, setGaData] = useState({ daily: [], sources: [], pages: [] });
  const [gscData, setGscData] = useState({ daily: [], queries: [], pages: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [totals, setTotals] = useState({ users: 0, views: 0, clicks: 0, impressions: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [gaRes, gscRes] = await Promise.all([
          fetch('/api/admin/analytics/ga'),
          fetch('/api/admin/analytics/gsc')
        ]);
        
        const gaJson = await gaRes.json();
        const gscJson = await gscRes.json();
        
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

        setTotals({ users: tUsers, views: tViews, clicks: tClicks, impressions: tImpressions });
        setGaData({ daily: parsedGaDaily, sources: parsedSources, pages: parsedGaPages });
        setGscData({ daily: parsedGscDaily, queries: gscJson.queries || [], pages: gscJson.pages || [] });
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

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
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="views" stroke="#2dd4bf" strokeWidth={3} dot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={4} dot={{r: 0}} activeDot={{r: 6, strokeWidth: 0}} />
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
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="clicks" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
                <Line type="monotone" dataKey="impressions" stroke="#fb923c" strokeWidth={3} dot={false} />
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
          <div className="overflow-x-auto">
            <table className="w-full text-right min-w-[500px]">
              <thead className="bg-gray-50/50 text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">ביטוי חיפוש</th>
                  <th className="px-6 py-3">קליקים</th>
                  <th className="px-6 py-3">חשיפות</th>
                  <th className="px-6 py-3">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {gscData.queries.map((q, i) => (
                  <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-3 text-sm font-bold text-gray-800 break-words max-w-[150px]">{q.keys[0]}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{q.clicks}</td>
                    <td className="px-6 py-3 text-sm text-gray-500">{q.impressions.toLocaleString()}</td>
                    <td className="px-6 py-3 text-xs font-bold text-blue-600">{(q.ctr * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          <div className="p-6">
            <div className="space-y-4">
              {gaData.sources.map((s, i) => {
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
             <table className="w-full text-right min-w-[600px]">
               <thead className="bg-gray-50/50 text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                 <tr>
                   <th className="px-6 py-3">דף (Path)</th>
                   <th className="px-6 py-3">צפיות</th>
                   <th className="px-6 py-3 text-center">פעולה</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {gaData.pages.map((p, i) => (
                   <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                     <td className="px-6 py-3 text-sm font-medium text-gray-600 dir-ltr text-right truncate max-w-xs">{p.path}</td>
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <span className="text-sm font-black text-gray-800">{p.views.toLocaleString()}</span>
                           <div className="flex-1 h-1 bg-gray-100 rounded-full min-w-[60px] hidden sm:block">
                              <div className="h-full bg-emerald-500 rounded-full" style={{width: `${Math.min(100, (p.views / gaData.pages[0].views) * 100)}%`}}></div>
                           </div>
                        </div>
                     </td>
                     <td className="px-6 py-3 text-center">
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
