import pool from "@/app/lib/db";
import Link from "next/link";
import DashboardCharts from "../components/admin/DashboardCharts";
import AnalyticsTables from "../components/admin/AnalyticsTables";
import UserRegistrationsChart from "../components/admin/UserRegistrationsChart";
import { FlaskConical, Wallet, Package, ShoppingCart, Users, Eye } from 'lucide-react';
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export const metadata = {
    title: "ניהול ראשי | ml_tlv",
    robots: "noindex, nofollow",
};

export default async function AdminDashboard() {
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    if (role === 'warehouse') redirect("/admin/orders");

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();

    let kpis = {
        totalOrders: 0,
        totalRevenue: 0,
        totalUsers: 0,
        totalSamples: 0,
        totalExpenses: 0,
        monthlyProfit: 0,
        monthlyVisits: 0,
        recentOrders: [],
        recentCoupons: [],
        bottleInventory: [],
        orderChartData: [],
        revenueChartData: [],
        // זה האובייקט שיכיל את נתוני הגרף המשולב
        combinedUserChartData: [], 
        samplesBreakdown: { '2': 0, '5': 0, '10': 0, '11': 0 },
        topBrands: [],
        topSizes: []
    };

    try {
        const [
            ordersRes,
            countRes,
            revRes,
            samplesSoldRes,
            samplesBreakdownRes,
            bottleInvRes,
            expensesRes,
            yearlyExpRes,
            visitsCountRes,
            couponsRes,
            productsRes,
            usersCountRes,
            registrationsRes,
            dailyVisitsRes // שאילתה חדשה לפירוט כניסות יומי
        ] = await Promise.all([
            pool.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 3'),
            pool.query('SELECT COUNT(*) FROM orders'),
            pool.query(`SELECT SUM(total_amount) FROM orders WHERE status != 'cancelled' AND EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2`, [month, year]),
            pool.query(`SELECT SUM((item->>'quantity')::int) as count FROM orders, jsonb_array_elements(items::jsonb) as item WHERE orders.status != 'cancelled' AND (item->>'name' LIKE '%דוגמית%' OR item->>'name' ILIKE '%sample%' OR item->>'size' IN ('2', '5', '10', '11'))`),
            pool.query(`SELECT item->>'size' as size, SUM((item->>'quantity')::int) as count FROM orders, jsonb_array_elements(items::jsonb) as item WHERE orders.status != 'cancelled' AND (item->>'size' IN ('2', '5', '10', '11')) GROUP BY size`),
            pool.query('SELECT size, quantity FROM bottle_inventory ORDER BY size ASC'),
            pool.query(`SELECT SUM(amount) FROM expenses WHERE type = 'monthly' AND EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2`, [month, year]),
            pool.query("SELECT SUM(amount) FROM expenses WHERE type = 'yearly'"),
            pool.query(`SELECT COUNT(*) FROM site_visits WHERE EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2`, [month, year]).catch(() => ({ rows: [{ count: 0 }] })),
            pool.query(`SELECT * FROM coupons WHERE status = 'active' ORDER BY created_at DESC LIMIT 10`),
            pool.query('SELECT id, cost_price, original_size FROM products'),
            pool.query('SELECT COUNT(*) FROM users').catch(() => ({ rows: [{ count: 0 }] })),
            pool.query(`SELECT EXTRACT(DAY FROM created_at)::int as day, COUNT(*)::int as count FROM users WHERE EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2 GROUP BY day ORDER BY day`, [month, year]).catch(() => ({ rows: [] })),
            // שליפת כניסות יומיות לגרף
            pool.query(`SELECT EXTRACT(DAY FROM created_at)::int as day, COUNT(*)::int as count FROM site_visits WHERE EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2 GROUP BY day ORDER BY day`, [month, year]).catch(() => ({ rows: [] }))
        ]);

        kpis.recentOrders = ordersRes.rows;
        kpis.totalOrders = parseInt(countRes.rows[0]?.count || 0);
        kpis.totalRevenue = parseFloat(revRes.rows[0]?.sum || 0);
        kpis.totalSamples = parseInt(samplesSoldRes.rows[0]?.count || 0);
        kpis.bottleInventory = bottleInvRes.rows;
        kpis.recentCoupons = couponsRes.rows;
        kpis.monthlyVisits = parseInt(visitsCountRes.rows[0]?.count || 0);
        kpis.totalUsers = parseInt(usersCountRes.rows[0]?.count || 0);

        // בניית נתונים לגרף המשולב (הרשמות וכניסות)
        kpis.combinedUserChartData = Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1;
            const regFound = registrationsRes.rows.find(r => r.day === d);
            const visitFound = dailyVisitsRes.rows.find(v => v.day === d);
            return { 
                day: d, 
                registrations: regFound ? regFound.count : 0,
                visits: visitFound ? visitFound.count : 0
            };
        });

        const monthlyExp = parseFloat(expensesRes.rows[0]?.sum || 0);
        const yearlyAmortized = parseFloat(yearlyExpRes.rows[0]?.sum || 0) / 12;
        kpis.totalExpenses = Math.round(monthlyExp + yearlyAmortized);

        const productMap = {};
        productsRes.rows.forEach(p => {
            productMap[p.id] = { cost: parseFloat(p.cost_price || 0), size: parseFloat(p.original_size || 1) };
        });

        const monthlyOrdersDetailed = await pool.query(`SELECT total_amount, items FROM orders WHERE status != 'cancelled' AND EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2`, [month, year]);
        
        let totalItemsCost = 0;
        const brandStats = {};
        const sizeStats = {};

        monthlyOrdersDetailed.rows.forEach(order => {
            try {
                const items = typeof order.items === 'string' ? JSON.parse(order.items || '[]') : (order.items || []);
                let orderGross = items.reduce((sum, i) => sum + (parseFloat(i.price || 0) * parseInt(i.quantity || 1)), 0);
                const ratio = orderGross > 0 ? (parseFloat(order.total_amount || 0) / orderGross) : 0;

                items.forEach(item => {
                    let dbId = item.id;
                    if (typeof dbId === 'string' && dbId.includes('-')) dbId = parseInt(dbId.split('-')[0]);
                    const prod = productMap[dbId];
                    if (prod) {
                        totalItemsCost += (prod.cost / prod.size) * parseFloat(item.size || 0) * parseInt(item.quantity || 1);
                    }
                    const netVal = (parseFloat(item.price || 0) * parseInt(item.quantity || 1)) * ratio;
                    if (item.brand) brandStats[item.brand] = (brandStats[item.brand] || 0) + netVal;
                    if (item.size) sizeStats[item.size] = (sizeStats[item.size] || 0) + netVal;
                });
            } catch (e) { console.error("Error calculating order:", e); }
        });

        kpis.monthlyProfit = Math.round(kpis.totalRevenue - totalItemsCost - kpis.totalExpenses);
        kpis.topBrands = Object.entries(brandStats).map(([name, sales]) => ({ name, sales })).sort((a,b) => b.sales - a.sales).slice(0, 5);
        kpis.topSizes = Object.entries(sizeStats).map(([size, sales]) => ({ size, sales })).sort((a,b) => b.sales - a.sales);

        const salesStatsRes = await pool.query(`
            SELECT EXTRACT(DAY FROM created_at)::int as day, COUNT(*) as orders, SUM(total_amount) as revenue
            FROM orders WHERE status != 'cancelled' AND EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2
            GROUP BY day ORDER BY day`, [month, year]);

        for (let i = 1; i <= daysInMonth; i++) {
            const dayData = salesStatsRes.rows.find(r => r.day === i);
            kpis.orderChartData.push({ day: i, current: dayData ? dayData.orders : 0, previous: 0 });
            kpis.revenueChartData.push({ day: i, current: dayData ? parseFloat(dayData.revenue) : 0, previous: 0 });
        }

        samplesBreakdownRes.rows.forEach(r => {
            const sizeKey = r.size?.toString().replace(/[^0-9]/g, '');
            if (kpis.samplesBreakdown[sizeKey] !== undefined) kpis.samplesBreakdown[sizeKey] = parseInt(r.count || 0);
        });

    } catch (err) {
        console.error("Critical Dashboard Error:", err);
    }

    const currentMonthLabel = new Date().toLocaleString('he-IL', { month: 'long' });

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8" dir="rtl">
            <h1 className="text-3xl font-bold mb-4">לוח בקרה - {currentMonthLabel}</h1>

            <DashboardCharts
                orderData={kpis.orderChartData}
                revenueData={kpis.revenueChartData}
                visitsData={[]}
                usersData={[]}
            />

            {/* גרף משולב: הרשמות וכניסות */}
            <UserRegistrationsChart data={kpis.combinedUserChartData} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase mb-2">
                        <Wallet className="w-4 h-4 text-green-500" /> רווח נטו ({currentMonthLabel})
                    </div>
                    <div className={`text-2xl font-bold ${kpis.monthlyProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {kpis.monthlyProfit.toLocaleString()} ₪
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">הכנסות נטו פחות עלות סחורה והוצאות</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase mb-2">
                        <Users className="w-4 h-4 text-indigo-500" /> משתמשים רשומים
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{kpis.totalUsers.toLocaleString()}</div>
                    <Link href="/admin/users" className="text-[10px] text-blue-500 hover:underline">לניהול משתמשים</Link>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase mb-2">
                        <FlaskConical className="w-4 h-4 text-purple-500" /> דוגמיות שנמכרו
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{kpis.totalSamples.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400">סה"כ יחידות שיצאו מהמלאי</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase mb-2">
                        <ShoppingCart className="w-4 h-4 text-blue-500" /> הזמנות סה"כ
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{kpis.totalOrders.toLocaleString()}</div>
                    <Link href="/admin/orders" className="text-[10px] text-blue-500 hover:underline">לניהול הזמנות</Link>
                </div>
            </div>

            <AnalyticsTables
                topBrands={kpis.topBrands}
                topSizes={kpis.topSizes}
                monthName={currentMonthLabel}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 font-bold flex justify-between items-center">
                        <span>הזמנות אחרונות</span>
                        <Link href="/admin/orders" className="text-xs text-blue-600 font-normal">לכל ההזמנות</Link>
                    </div>
                    <div className="divide-y">
                        {kpis.recentOrders.map(order => (
                            <div key={order.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <div>
                                    <div className="font-bold text-sm">#{order.id} | {order.customer_details?.name || 'לקוח'}</div>
                                    <div className="text-[10px] text-gray-500">{new Date(order.created_at).toLocaleDateString('he-IL')}</div>
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-sm">{order.total_amount} ₪</div>
                                    <div className="text-[10px] uppercase text-blue-600 font-bold">{order.status}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 font-bold">מלאי בקבוקנים (פנוי)</div>
                    <div className="p-6">
                        <div className="grid grid-cols-2 gap-4">
                            {kpis.bottleInventory.map(item => (
                                <div key={item.size} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                                    <span className="text-sm font-bold">{item.size} מ"ל</span>
                                    <span className={`text-lg font-black ${item.quantity < 20 ? 'text-red-600' : 'text-green-600'}`}>
                                        {item.quantity}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b bg-gray-50 font-bold">קופונים פעילים אחרונים</div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
                            <tr>
                                <th className="p-4 text-center">קוד</th>
                                <th className="p-4 text-center">הנחה</th>
                                <th className="p-4 text-center">סטטוס</th>
                                <th className="p-4 text-center">נוצר</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {kpis.recentCoupons.map(coupon => (
                                <tr key={coupon.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-mono font-bold text-blue-600 text-center">{coupon.code}</td>
                                    <td className="p-4 text-center">{coupon.discount_percent}%</td>
                                    <td className="p-4 text-center">
                                        <span className="px-2 py-1 rounded-full text-[10px] bg-green-100 text-green-800">פעיל</span>
                                    </td>
                                    <td className="p-4 text-gray-500 text-center">{new Date(coupon.created_at).toLocaleDateString('he-IL')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}