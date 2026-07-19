import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Activity, Database, Zap, Clock, TrendingDown } from "lucide-react";
import pool from "../../lib/db";
import NeonConsumptionChart from "./NeonConsumptionChart";

export const dynamic = 'force-dynamic';
export const metadata = {
    title: 'ניטור מסד נתונים | פאנל ניהול',
};

function formatQueryDescription(sql) {
    if (!sql) return 'שאילתא לא ידועה';
    const upper = sql.toUpperCase();
    
    if (upper.includes('NEON_MIGRATION') || upper.includes('NEON_CHECK_FOR_SUPERUSER')) return 'שאילתת מערכת פנימית של Neon (בדיקת מיגרציות והרשאות)';
    if (upper.includes('PG_CATALOG') || upper.includes('PG_STAT')) return 'שאילתת מערכת פנימית של PostgreSQL (סטטיסטיקות וקטלוג)';
    
    // Extract main table name if possible
    let table = '';
    const fromMatch = upper.match(/FROM\s+["']?([a-zA-Z0-9_]+)["']?/);
    const updateMatch = upper.match(/UPDATE\s+["']?([a-zA-Z0-9_]+)["']?/);
    const insertMatch = upper.match(/INSERT\s+INTO\s+["']?([a-zA-Z0-9_]+)["']?/);
    
    if (fromMatch) table = fromMatch[1];
    else if (updateMatch) table = updateMatch[1];
    else if (insertMatch) table = insertMatch[1];

    const translateTable = (t) => {
        const dict = {
            'users': 'משתמשים',
            'products': 'מוצרים',
            'orders': 'הזמנות',
            'catalogs': 'קטלוגים',
            'brands': 'מותגים',
            'reviews': 'ביקורות'
        };
        return dict[t.toLowerCase()] || t;
    };

    if (upper.startsWith('SELECT')) return table ? `שליפת נתונים מטבלת ${translateTable(table)}` : 'שליפת נתונים (SELECT)';
    if (upper.startsWith('UPDATE')) return table ? `עדכון נתונים בטבלת ${translateTable(table)}` : 'עדכון נתונים (UPDATE)';
    if (upper.startsWith('INSERT')) return table ? `הוספת נתונים לטבלת ${translateTable(table)}` : 'הוספת נתונים (INSERT)';
    if (upper.startsWith('DELETE')) return table ? `מחיקת נתונים מטבלת ${translateTable(table)}` : 'מחיקת נתונים (DELETE)';
    if (upper.startsWith('BEGIN') || upper.startsWith('COMMIT') || upper.startsWith('ROLLBACK')) return 'ניהול טרנזקציה (Transaction)';
    
    return 'שאילתת מסד נתונים כללית';
}

async function getDatabaseStats() {
    const stats = {
        activeConnections: 0,
        idleConnections: 0,
        topQueries: [],
        error: null
    };

    try {
        const client = await pool.connect();
        try {
            // Get connection stats
            const connRes = await client.query(`
                SELECT state, count(*) 
                FROM pg_stat_activity 
                GROUP BY state
            `);
            
            connRes.rows.forEach(row => {
                if (row.state === 'active') stats.activeConnections += parseInt(row.count);
                else if (row.state === 'idle') stats.idleConnections += parseInt(row.count);
            });

            // Get top slowest queries if pg_stat_statements is enabled
            try {
                const queryRes = await client.query(`
                    SELECT query, calls, total_exec_time / calls as avg_time_ms, rows 
                    FROM pg_stat_statements 
                    WHERE query NOT ILIKE '%pg_stat%' 
                    ORDER BY avg_time_ms DESC 
                    LIMIT 10
                `);
                stats.topQueries = queryRes.rows;
            } catch (e) {
                // pg_stat_statements might not be enabled
                stats.error = "pg_stat_statements extension is not enabled or accessible.";
            }

        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Failed to fetch DB stats", err);
        stats.error = "Failed to connect to database for stats.";
    }

    return stats;
}
async function getNeonEndpointStatus() {
    const NEON_API_KEY = process.env.NEON_API_KEY;
    const NEON_PROJECT_ID = process.env.NEON_PROJECT_ID;

    if (!NEON_API_KEY || !NEON_PROJECT_ID) {
        return { error: "Missing keys" };
    }

    try {
        const url = `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/endpoints`;
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${NEON_API_KEY}`,
                'Accept': 'application/json'
            },
            cache: 'no-store'
        });

        if (!res.ok) {
            return { error: "Failed to fetch endpoints" };
        }

        const data = await res.json();
        const endpoints = data.endpoints || [];
        
        let totalActiveCu = 0;
        let isAnyActive = false;

        endpoints.forEach(ep => {
            if (ep.current_state === 'active') {
                isAnyActive = true;
                totalActiveCu += (ep.autoscaling_limit_max_cu || 0.25);
            }
        });

        return { 
            isAnyActive, 
            totalActiveCu,
            maxCapacity: endpoints.reduce((acc, ep) => acc + (ep.autoscaling_limit_max_cu || 0.25), 0)
        };
    } catch (err) {
        return { error: err.message };
    }
}

async function getNeonConsumption() {
    const NEON_API_KEY = process.env.NEON_API_KEY;
    const NEON_PROJECT_ID = process.env.NEON_PROJECT_ID;

    if (!NEON_API_KEY || !NEON_PROJECT_ID) {
        return { error: "המשתנים NEON_API_KEY או NEON_PROJECT_ID חסרים." };
    }

    try {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const from = firstDay.toISOString();
        const to = lastDay.toISOString();

        // 1. Fetch project details to get org_id
        const projRes = await fetch(`https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}`, {
            headers: {
                'Authorization': `Bearer ${NEON_API_KEY}`,
                'Accept': 'application/json'
            },
            next: { revalidate: 3600 }
        });

        if (!projRes.ok) {
            const errText = await projRes.text();
            return { error: `Neon Project API error: ${projRes.status} - ${errText}` };
        }

        const projData = await projRes.json();
        const orgId = projData.project?.org_id || '';

        // 2. Fetch consumption history
        const url = `https://console.neon.tech/api/v2/consumption_history/v2/projects?project_ids=${NEON_PROJECT_ID}&org_id=${orgId}&from=${from}&to=${to}&granularity=daily&metrics=compute_unit_seconds`;
        
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${NEON_API_KEY}`,
                'Accept': 'application/json'
            },
            next: { revalidate: 3600 } 
        });

        if (!res.ok) {
            const errText = await res.text();
            if (res.status === 403 && errText.includes("Launch plans")) {
                return { error: "תכונת מעקב הצריכה ההיסטורית זמינה רק בתוכניות בתשלום (Launch ומעלה) של Neon. שדרג את החשבון שלך כדי לצפות בגרף.", isFreeTier: true };
            }
            return { error: `Neon API error: ${res.status} - ${errText}` };
        }

        const data = await res.json();
        if (!data.periods || !Array.isArray(data.periods)) {
             return { data: [] };
        }

        const formattedData = data.periods.map(p => {
             const d = new Date(p.period_id);
             return {
                 date: `${d.getDate()}/${d.getMonth()+1}`,
                 compute_unit_seconds: p.compute_unit_seconds || 0,
             };
        });

        return { data: formattedData };
    } catch (err) {
        console.error("Failed to fetch neon consumption", err);
        return { error: err.message };
    }
}

export default async function DatabaseMonitor() {
    // Run both queries in parallel for faster loading
    const [stats, neonConsumption, endpointStatus] = await Promise.all([
        getDatabaseStats(),
        getNeonConsumption(),
        getNeonEndpointStatus()
    ]);
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    const adminEmail = process.env.ADMIN_EMAIL;
    const isSuperAdmin = user?.emailAddresses?.[0]?.emailAddress === adminEmail;

    if (!isSuperAdmin && role !== 'admin') {
        redirect("/admin");
    }
    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        ניטור מסד נתונים וצריכת משאבים
                    </h1>
                    <p className="text-gray-500 mt-1">
                        מעקב בזמן אמת אחר חיבורים ל-Neon Serverless וביצועי שאילתות.
                    </p>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="bg-blue-50 p-3 rounded-full mb-3">
                        <Activity className="text-blue-600" size={24} />
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">חיבורים פעילים (WebSocket)</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeConnections}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="bg-gray-50 p-3 rounded-full mb-3">
                        <Database className="text-gray-600" size={24} />
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">חיבורים בהמתנה (Idle)</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.idleConnections}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="bg-green-50 p-3 rounded-full mb-3">
                        <Zap className="text-green-600" size={24} />
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">חיבורי HTTP (Serverless)</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">פעיל</p>
                    <span className="text-xs text-green-600 mt-1">חוסך Compute Units</span>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className={`${endpointStatus.isAnyActive ? 'bg-orange-50' : 'bg-gray-50'} p-3 rounded-full mb-3`}>
                        <TrendingDown className={endpointStatus.isAnyActive ? 'text-orange-600' : 'text-gray-400'} size={24} />
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">קצב צריכת CU לשעה</h3>
                    <p className={`text-3xl font-bold ${endpointStatus.isAnyActive ? 'text-orange-600' : 'text-gray-500'} mt-2`} dir="ltr">
                        {endpointStatus.error ? '---' : `${endpointStatus.totalActiveCu} CU/h`}
                    </p>
                    <span className={`text-xs mt-1 font-medium ${endpointStatus.isAnyActive ? 'text-orange-600 animate-pulse' : 'text-gray-400'}`}>
                        {endpointStatus.error ? 'שגיאת חיבור' : endpointStatus.isAnyActive ? 'השרת כרגע פעיל' : 'השרת במצב שינה (חוסך)'}
                    </span>
                </div>
            </div>

            {/* Neon Consumption Graph */}
            <NeonConsumptionChart 
                data={neonConsumption.data} 
                error={neonConsumption.error} 
                isFreeTier={neonConsumption.isFreeTier} 
            />

            {/* Top Slowest Queries */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Clock className="text-gray-400" size={20} />
                        השאילתות האיטיות ביותר
                    </h2>
                    {stats.error && <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-md">{stats.error}</span>}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="p-4 text-sm font-medium text-gray-500 text-center w-2/3">שאילתא</th>
                                <th className="p-4 text-sm font-medium text-gray-500 text-center">קריאות</th>
                                <th className="p-4 text-sm font-medium text-gray-500 text-center">זמן ממוצע (ms)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {stats.topQueries.length > 0 ? (
                                stats.topQueries.map((q, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td 
                                            className="p-4 text-sm text-gray-700 font-medium text-center dir-rtl"
                                            title={q.query}
                                        >
                                            {formatQueryDescription(q.query)}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 text-center">
                                            {q.calls}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-orange-600 text-center">
                                            {Number(q.avg_time_ms).toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="p-8 text-center text-gray-500">
                                        אין נתונים זמינים כרגע.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
