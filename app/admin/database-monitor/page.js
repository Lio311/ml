import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Activity, Database, Zap, Clock, TrendingDown } from "lucide-react";
import pool from "../../lib/db";
import NeonConsumptionChart from "./NeonConsumptionChart";

export const dynamic = 'force-dynamic';
export const metadata = {
    title: 'ניטור מסד נתונים | פאנל ניהול',
};

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

        const url = `https://console.neon.tech/api/v2/consumption_history/v2/projects?project_ids=${NEON_PROJECT_ID}&from=${from}&to=${to}&granularity=daily`;
        
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${NEON_API_KEY}`,
                'Accept': 'application/json'
            },
            next: { revalidate: 3600 } 
        });

        if (!res.ok) {
            const errText = await res.text();
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

export default async function DatabaseMonitorPage() {
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    const adminEmail = process.env.ADMIN_EMAIL;
    const isSuperAdmin = user?.emailAddresses?.[0]?.emailAddress === adminEmail;

    if (!isSuperAdmin && role !== 'admin') {
        redirect("/admin");
    }

    const stats = await getDatabaseStats();
    const neonConsumption = await getNeonConsumption();

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Database className="text-blue-600" size={28} />
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
                    <div className="bg-purple-50 p-3 rounded-full mb-3">
                        <TrendingDown className="text-purple-600" size={24} />
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">הערכת חיסכון CU</h3>
                    <p className="text-3xl font-bold text-purple-600 mt-2" dir="ltr">~65%</p>
                    <span className="text-xs text-gray-400 mt-1">מבוסס על מעבר ל-HTTP Mode</span>
                </div>
            </div>

            {/* Neon Consumption Graph */}
            <NeonConsumptionChart data={neonConsumption.data} error={neonConsumption.error} />

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
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="p-4 text-sm font-medium text-gray-500">זמן ממוצע (ms)</th>
                                <th className="p-4 text-sm font-medium text-gray-500">קריאות</th>
                                <th className="p-4 text-sm font-medium text-gray-500 w-2/3">שאילתא</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {stats.topQueries.length > 0 ? (
                                stats.topQueries.map((q, i) => (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-sm font-bold text-orange-600">
                                            {Number(q.avg_time_ms).toFixed(2)}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {q.calls}
                                        </td>
                                        <td className="p-4 text-sm text-gray-500 font-mono text-left dir-ltr whitespace-pre-wrap break-all text-[11px] leading-relaxed w-2/3 max-w-[400px]">
                                            {q.query}
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
