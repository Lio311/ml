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
        userRegistrationData: [],
        samplesBreakdown: { '2': 0, '5': 0, '10': 0, '11': 0 },
        topBrands: [],
        topSizes: []
    };

    try {
        // שליפת נתונים יעילה במקביל
        const [
            ordersRes, countRes, revRes, samplesSoldRes, samplesBreakdownRes,
            bottleInvRes, expensesRes, yearlyExpRes, visitsCountRes, couponsRes,
            productsRes, usersCountRes, registrationsRes
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
            pool.query(`SELECT EXTRACT(DAY FROM created_at)::int as day, COUNT(*)::int as count FROM users WHERE EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2 GROUP BY day ORDER BY day`, [month, year]).catch(() => ({ rows: [] }))
        ]);

        kpis.recentOrders = ordersRes.rows;
        kpis.totalOrders = parseInt(countRes.rows[0]?.count || 0);
        kpis.totalRevenue = parseFloat(revRes.rows[0]?.sum || 0);
        kpis.totalSamples = parseInt(samplesSoldRes.rows[0]?.count || 0);
        kpis.bottleInventory = bottleInvRes.rows;
        kpis.recentCoupons = couponsRes.rows;
        kpis.monthlyVisits = parseInt(visitsCountRes.rows[0]?.count || 0);
        kpis.totalUsers = parseInt(usersCountRes.rows[0]?.count || 0);

        // עיבוד פירוט דוגמיות
        samplesBreakdownRes.rows.forEach(r => {
            const sizeKey = r.size?.toString().replace(/[^0-9]/g, '');
            if (kpis.samplesBreakdown[sizeKey] !== undefined) kpis.samplesBreakdown[sizeKey] = parseInt(r.count);
        });

        // חישוב רווח, מותגים וגדלים
        const productMap = {};
        productsRes.rows.forEach(p => { productMap[p.id] = { cost: parseFloat(p.cost_price || 0), size: parseFloat(p.original_size || 1) }; });

        const monthlyOrdersDetailed = await pool.query(`SELECT total_amount, items FROM orders WHERE status != 'cancelled' AND EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2`, [month, year]);
        let totalItemsCost = 0;
        const brandStats = {};
        const sizeStats = {};

        monthlyOrdersDetailed.rows.forEach(order => {
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
        kpis.topBrands = Object.entries(brandStats).map(([name, sales]) => ({ name, sales })).sort((a, b) => b.sales - a.sales).slice(0, 5);
        kpis.topSizes = Object.entries(sizeStats).map(([size, sales]) => ({ size, sales })).sort((a, b) => b.sales - a.sales);

        // גרפים
        kpis.userRegistrationData = Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1;
            const found = registrationsRes.rows.find(r => r.day === d);
            return { day: d, count: found ? found.count : 0 };
        });

        const salesStats = await pool.query(`SELECT EXTRACT(DAY FROM created_at)::int as day, COUNT(*) as orders, SUM(total_amount) as revenue FROM orders WHERE status != 'cancelled' AND EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2 GROUP BY day ORDER BY day`, [month, year]);
        for (let i = 1; i <= daysInMonth; i++) {
            const d = salesStats.rows.find(r => r.day === i);
            kpis.orderChartData.push({ day: i, current: d ? d.orders : 0, previous: 0 });
            kpis.revenueChartData.push({ day: i, current: d ? parseFloat(d.revenue) : 0, previous: 0 });
        }

    } catch (err) { console.error("Admin Dashboard Error:", err); }

    const currentMonthLabel = new Date().toLocaleString('he-IL', { month: 'long' });

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8" dir="rtl">
            <h1 className="text-3xl font-bold">לוח בקרה ניהולי</h1>

            {/* הוסר רכיב החיזוי למניעת קריסות */}

            <DashboardCharts orderData={kpis.orderChartData} revenueData={kpis.revenueChartData} visitsData={[]} usersData={[]} />

            <UserRegistrationsChart data={kpis.userRegistrationData} />

            <AnalyticsTables topBrands={kpis.topBrands} topSizes={kpis.topSizes} monthName={currentMonthLabel} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* כרטיס תזרים */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                    <div className="text-gray-500 text-xs font-bold uppercase flex items-center gap-2 mb-4"><Wallet className="w-4 h-4 text-green-500" /> תזרים ({currentMonthLabel})</div>
                    <div className="space-y-2">
                        <div className="flex justify-between border-b pb-1"><span>הכנסות נטו</span><span className="font-bold text-blue-600">{kpis.totalRevenue} ₪</span></div>
                        <div className="flex justify-between border-b pb-1"><span>הוצאות קבועות</span><span className="font-bold text-red-600">{kpis.totalExpenses} ₪</span></div>
                        <div className="flex justify-between bg-gray-50 p-2 rounded"><strong>רווח נקי</strong><strong className={kpis.monthlyProfit >= 0 ? 'text-green-700' : 'text-red-700'}>{kpis.monthlyProfit} ₪</strong></div>
                    </div>
                </div>

                {/* כרטיס דוגמיות */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
                    <div className="text-gray-500 text-xs font-bold uppercase flex items-center gap-2 mb-2"><FlaskConical className="w-4 h-4 text-purple-500" /> דוגמיות שנמכרו</div>
                    <div className="text-3xl font-bold mb-4">{kpis.totalSamples} <span className="text-xs font-normal">יח'</span></div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="bg-purple-50 p-1 rounded text-center">2 מ"ל: <strong>{kpis.samplesBreakdown['2']}</strong></div>
                        <div className="bg-pink-50 p-1 rounded text-center">5 מ"ל: <strong>{kpis.samplesBreakdown['5']}</strong></div>
                        <div className="bg-blue-50 p-1 rounded text-center">10 מ"ל: <strong>{kpis.samplesBreakdown['10']}</strong></div>
                        <div className="bg-amber-50 p-1 rounded text-center">יוקרתי: <strong>{kpis.samplesBreakdown['11']}</strong></div>
                    </div>
                </div>

                {/* כרטיס מלאי בקבוקנים */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
                    <div className="text-gray-500 text-xs font-bold uppercase flex items-center gap-2 mb-4"><Package className="w-4 h-4 text-amber-500" /> מלאי בקבוקנים</div>
                    <div className="space-y-1">
                        {kpis.bottleInventory.map(item => (
                            <div key={item.size} className="flex justify-between text-xs border-b pb-1">
                                <span>{item.size} מ"ל</span>
                                <span className={item.quantity < 20 ? 'text-red-600 font-bold' : ''}>{item.quantity}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 font-bold flex justify-between"><span>הזמנות אחרונות</span><Link href="/admin/orders" className="text-xs text-blue-600 font-normal">הכל</Link></div>
                    <div className="divide-y">{kpis.recentOrders.map(o => (<div key={o.id} className="p-4 flex justify-between"><span>#{o.id} | {o.customer_details?.name}</span><strong>{o.total_amount} ₪</strong></div>))}</div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 font-bold">קופונים אחרונים</div>
                    <div className="divide-y">{kpis.recentCoupons.map(c => (<div key={c.id} className="p-4 flex justify-between"><span className="font-mono text-blue-600 font-bold">{c.code}</span><span>{c.discount_percent}% הנחה</span></div>))}</div>
                </div>
            </div>
        </div>
    );
}