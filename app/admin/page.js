import pool from "@/app/lib/db";
import Link from "next/link";
import DashboardCharts from "../components/admin/DashboardCharts";
import AnalyticsTables from "../components/admin/AnalyticsTables";
import InventoryForecast from "../components/admin/InventoryForecast";
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
        userRegistrationData: [],
        forecasts: [],
        samplesBreakdown: { '2': 0, '5': 0, '10': 0, '11': 0 },
        topBrands: [],
        topSizes: []
    };

    try {
        const [
            ordersRes, countRes, revRes, samplesSoldRes, samplesBreakdownRes,
            bottleInvRes, expensesRes, yearlyExpRes, visitsCountRes, couponsRes,
            productsRes, usersCountRes, registrationsRes, last30DaysSalesRes
        ] = await Promise.all([
            pool.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 3'),
            pool.query('SELECT COUNT(*) FROM orders'),
            pool.query(`SELECT SUM(total_amount) FROM orders WHERE status != 'cancelled' AND EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2`, [month, year]),
            pool.query(`SELECT SUM((item->>'quantity')::int) as count FROM orders, jsonb_array_elements(items::jsonb) as item WHERE orders.status != 'cancelled' AND (item->>'size' IN ('2', '5', '10', '11'))`),
            pool.query(`SELECT item->>'size' as size, SUM((item->>'quantity')::int) as count FROM orders, jsonb_array_elements(items::jsonb) as item WHERE orders.status != 'cancelled' AND (item->>'size' IN ('2', '5', '10', '11')) GROUP BY size`),
            pool.query('SELECT size, quantity FROM bottle_inventory ORDER BY size ASC'),
            pool.query(`SELECT SUM(amount) FROM expenses WHERE type = 'monthly' AND EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2`, [month, year]),
            pool.query("SELECT SUM(amount) FROM expenses WHERE type = 'yearly'"),
            pool.query(`SELECT COUNT(*) FROM site_visits WHERE EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2`, [month, year]).catch(() => ({ rows: [{ count: 0 }] })),
            pool.query(`SELECT * FROM coupons WHERE status = 'active' ORDER BY created_at DESC LIMIT 5`),
            pool.query('SELECT id, cost_price, original_size FROM products'),
            pool.query('SELECT COUNT(*) FROM users').catch(() => ({ rows: [{ count: 0 }] })),
            pool.query(`SELECT EXTRACT(DAY FROM created_at)::int as day, COUNT(*)::int as count FROM users WHERE EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2 GROUP BY day ORDER BY day`, [month, year]).catch(() => ({ rows: [] })),
            pool.query(`SELECT items FROM orders WHERE status != 'cancelled' AND created_at > NOW() - INTERVAL '30 days'`)
        ]);

        // מיפוי KPI
        kpis.recentOrders = ordersRes.rows;
        kpis.totalOrders = parseInt(countRes.rows[0]?.count || 0);
        kpis.totalRevenue = parseFloat(revRes.rows[0]?.sum || 0);
        kpis.totalSamples = parseInt(samplesSoldRes.rows[0]?.count || 0);
        kpis.bottleInventory = bottleInvRes.rows;
        kpis.recentCoupons = couponsRes.rows;
        kpis.monthlyVisits = parseInt(visitsCountRes.rows[0]?.count || 0);
        kpis.totalUsers = parseInt(usersCountRes.rows[0]?.count || 0);

        // גרף הרשמות
        kpis.userRegistrationData = Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1;
            const found = registrationsRes.rows.find(r => r.day === d);
            return { day: d, count: found ? found.count : 0 };
        });

        // חיזוי מלאי - כאן היה התיקון הקריטי למניעת השגיאה dailyRate.toFixed
        const consumption30Days = { '2': 0, '5': 0, '10': 0, '11': 0 };
        last30DaysSalesRes.rows.forEach(order => {
            const items = typeof order.items === 'string' ? JSON.parse(order.items || '[]') : order.items;
            items.forEach(item => {
                const sKey = item.size?.toString().replace(/[^0-9]/g, '');
                if (consumption30Days[sKey] !== undefined) consumption30Days[sKey] += parseInt(item.quantity || 1);
            });
        });

        kpis.forecasts = kpis.bottleInventory.map(inv => {
            const sKey = inv.size?.toString().replace(/[^0-9]/g, '');
            const dailyRate = (consumption30Days[sKey] || 0) / 30;
            const safeDailyRate = isNaN(dailyRate) ? 0 : dailyRate; // הגנה מ-NaN

            return {
                name: `${inv.size} מ"ל`,
                daysLeft: safeDailyRate > 0 ? Math.round(Number(inv.quantity || 0) / safeDailyRate) : 999,
                dailyRate: Number(safeDailyRate).toFixed(1), // עכשיו זה לא יקרוס לעולם
                quantity: inv.quantity || 0
            };
        }).sort((a, b) => a.daysLeft - b.daysLeft);

        // חישוב רווח וסטטיסטיקות
        const productMap = {};
        productsRes.rows.forEach(p => { productMap[p.id] = { cost: parseFloat(p.cost_price || 0), size: parseFloat(p.original_size || 1) }; });

        const monthlyOrders = await pool.query(`SELECT total_amount, items FROM orders WHERE status != 'cancelled' AND EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2`, [month, year]);
        let totalItemsCost = 0;
        const brandStats = {};
        const sizeStats = {};

        monthlyOrders.rows.forEach(order => {
            try {
                const items = typeof order.items === 'string' ? JSON.parse(order.items || '[]') : order.items;
                let orderGross = items.reduce((sum, i) => sum + (parseFloat(i.price || 0) * parseInt(i.quantity || 1)), 0);
                const ratio = orderGross > 0 ? (parseFloat(order.total_amount) / orderGross) : 0;

                items.forEach(item => {
                    let dbId = item.id;
                    if (typeof dbId === 'string' && dbId.includes('-')) dbId = parseInt(dbId.split('-')[0]);
                    const prod = productMap[dbId];
                    if (prod) totalItemsCost += (prod.cost / prod.size) * parseFloat(item.size || 0) * parseInt(item.quantity || 1);
                    const netVal = (parseFloat(item.price || 0) * parseInt(item.quantity || 1)) * ratio;
                    if (item.brand) brandStats[item.brand] = (brandStats[item.brand] || 0) + netVal;
                    if (item.size) sizeStats[item.size] = (sizeStats[item.size] || 0) + netVal;
                });
            } catch (e) { }
        });

        const monthlyExp = parseFloat(expensesRes.rows[0]?.sum || 0);
        const yearlyAmortized = parseFloat(yearlyExpRes.rows[0]?.sum || 0) / 12;
        kpis.totalExpenses = Math.round(monthlyExp + yearlyAmortized);
        kpis.monthlyProfit = Math.round(kpis.totalRevenue - totalItemsCost - kpis.totalExpenses);

        // הכנת גרף מכירות
        const salesChartRes = await pool.query(`SELECT EXTRACT(DAY FROM created_at)::int as day, COUNT(*) as orders, SUM(total_amount) as revenue FROM orders WHERE status != 'cancelled' AND EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2 GROUP BY day ORDER BY day`, [month, year]);
        for (let i = 1; i <= daysInMonth; i++) {
            const d = salesChartRes.rows.find(r => r.day === i);
            kpis.orderChartData.push({ day: i, current: d ? d.orders : 0, previous: 0 });
            kpis.revenueChartData.push({ day: i, current: d ? parseFloat(d.revenue) : 0, previous: 0 });
        }

    } catch (err) { console.error("Critical Dashboard Error:", err); }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8" dir="rtl">
            <h1 className="text-3xl font-bold">לוח בקרה - ניהול</h1>

            <InventoryForecast forecasts={kpis.forecasts} />

            <DashboardCharts
                orderData={kpis.orderChartData}
                revenueData={kpis.revenueChartData}
                visitsData={[]}
                usersData={[]}
            />

            <UserRegistrationsChart data={kpis.userRegistrationData} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold mb-2"><Wallet className="w-4 h-4 text-green-500" /> רווח נטו</div>
                    <div className={`text-2xl font-bold ${kpis.monthlyProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{kpis.monthlyProfit.toLocaleString()} ₪</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold mb-2"><Users className="w-4 h-4 text-indigo-500" /> משתמשים</div>
                    <div className="text-2xl font-bold">{kpis.totalUsers}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold mb-2"><FlaskConical className="w-4 h-4 text-purple-500" /> דוגמיות</div>
                    <div className="text-2xl font-bold">{kpis.totalSamples}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold mb-2"><ShoppingCart className="w-4 h-4 text-blue-500" /> הזמנות</div>
                    <div className="text-2xl font-bold">{kpis.totalOrders}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 font-bold flex justify-between">
                        <span>הזמנות אחרונות</span>
                        <Link href="/admin/orders" className="text-xs text-blue-600 font-normal">הכל</Link>
                    </div>
                    <div className="divide-y">
                        {kpis.recentOrders.map(order => (
                            <div key={order.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <span className="text-sm font-bold">#{order.id} | {order.customer_details?.name}</span>
                                <span className="text-sm font-bold">{order.total_amount} ₪</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 font-bold">קופונים פעילים</div>
                    <table className="w-full text-right text-sm">
                        <tbody className="divide-y">
                            {kpis.recentCoupons.map(coupon => (
                                <tr key={coupon.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-mono font-bold text-blue-600">{coupon.code}</td>
                                    <td className="p-4">{coupon.discount_percent}% הנחה</td>
                                    <td className="p-4 text-xs text-gray-500">{new Date(coupon.created_at).toLocaleDateString('he-IL')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}