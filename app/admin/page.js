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
    // 1. Auth Check
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    if (role === 'warehouse') redirect("/admin/orders");

    // Default KPI State
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
        visitsChartData: [],
        samplesBreakdown: { '2': 0, '5': 0, '10': 0, '11': 0 },
        topBrands: [],
        topSizes: []
    };

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();

    try {
        // 2. Parallel Data Fetching - המפתח למניעת קריסות וביצועים מהירים
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
            productsRes
        ] = await Promise.all([
            pool.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 3'),
            pool.query('SELECT COUNT(*) FROM orders'),
            pool.query(`SELECT SUM(total_amount) FROM orders WHERE status != 'cancelled' AND EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2`, [month, year]),
            pool.query(`SELECT SUM((item->>'quantity')::int) as count FROM orders, jsonb_array_elements(items::jsonb) as item WHERE orders.status != 'cancelled' AND (item->>'name' LIKE '%דוגמית%' OR item->>'name' ILIKE '%sample%' OR item->>'size' IN ('2', '5', '10', '11'))`),
            pool.query(`SELECT item->>'size' as size, SUM((item->>'quantity')::int) as count FROM orders, jsonb_array_elements(items::jsonb) as item WHERE orders.status != 'cancelled' AND (item->>'size' IN ('2', '5', '10', '11')) GROUP BY size`),
            pool.query('SELECT size, quantity FROM bottle_inventory ORDER BY size ASC'),
            pool.query(`SELECT SUM(amount) FROM expenses WHERE type = 'monthly' AND EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2`, [month, year]),
            pool.query("SELECT SUM(amount) FROM expenses WHERE type = 'yearly'"),
            pool.query(`SELECT COUNT(*) FROM site_visits WHERE EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2`, [month, year]).catch(() => ({ rows: [{ count: 0 }] })), // Fail-safe for missing table
            pool.query(`SELECT * FROM coupons WHERE status = 'active' ORDER BY created_at DESC LIMIT 5`),
            pool.query('SELECT id, cost_price, original_size FROM products')
        ]);

        // Mapping Data
        kpis.recentOrders = ordersRes.rows;
        kpis.totalOrders = parseInt(countRes.rows[0]?.count || 0);
        kpis.totalRevenue = parseFloat(revRes.rows[0]?.sum || 0);
        kpis.totalSamples = parseInt(samplesSoldRes.rows[0]?.count || 0);
        kpis.bottleInventory = bottleInvRes.rows;
        kpis.recentCoupons = couponsRes.rows;
        kpis.monthlyVisits = parseInt(visitsCountRes.rows[0]?.count || 0);

        // Expenses Calculation
        const monthlyExp = parseFloat(expensesRes.rows[0]?.sum || 0);
        const yearlyAmortized = parseFloat(yearlyExpRes.rows[0]?.sum || 0) / 12;
        kpis.totalExpenses = Math.round(monthlyExp + yearlyAmortized);

        // Samples Breakdown Mapping
        samplesBreakdownRes.rows.forEach(r => {
            const sizeKey = r.size?.toString().replace(/[^0-9]/g, '');
            if (kpis.samplesBreakdown[sizeKey] !== undefined) {
                kpis.samplesBreakdown[sizeKey] = parseInt(r.count || 0);
            }
        });

        // 3. Profit Calculation Logic (Protected)
        const productMap = {};
        productsRes.rows.forEach(p => {
            productMap[p.id] = { cost: parseFloat(p.cost_price || 0), size: parseFloat(p.original_size || 1) };
        });

        const monthlyOrdersForProfit = await pool.query(`SELECT total_amount, items FROM orders WHERE status != 'cancelled' AND EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2`, [month, year]);

        let totalItemsCost = 0;
        const brandStats = {};
        const sizeStats = {};

        monthlyOrdersForProfit.rows.forEach(order => {
            try {
                const items = typeof order.items === 'string' ? JSON.parse(order.items || '[]') : (order.items || []);
                let orderGross = items.reduce((sum, i) => sum + (parseFloat(i.price) * parseInt(i.quantity || 1)), 0);
                const ratio = orderGross > 0 ? (parseFloat(order.total_amount) / orderGross) : 0;

                items.forEach(item => {
                    let dbId = item.id;
                    if (typeof dbId === 'string' && dbId.includes('-')) dbId = parseInt(dbId.split('-')[0]);

                    const prod = productMap[dbId];
                    if (prod) {
                        const itemCost = (prod.cost / prod.size) * parseFloat(item.size || 0) * parseInt(item.quantity || 1);
                        totalItemsCost += itemCost;
                    }

                    // Stats
                    const netVal = (parseFloat(item.price) * parseInt(item.quantity || 1)) * ratio;
                    if (item.brand) brandStats[item.brand] = (brandStats[item.brand] || 0) + netVal;
                    if (item.size) sizeStats[item.size] = (sizeStats[item.size] || 0) + netVal;
                });
            } catch (e) { console.error("Error parsing order items:", e); }
        });

        kpis.monthlyProfit = Math.round(kpis.totalRevenue - totalItemsCost - kpis.totalExpenses);
        kpis.topBrands = Object.entries(brandStats).map(([name, sales]) => ({ name, sales })).sort((a, b) => b.sales - a.sales).slice(0, 5);
        kpis.topSizes = Object.entries(sizeStats).map(([size, sales]) => ({ size, sales })).sort((a, b) => b.sales - a.sales);

        // 4. Chart Data (Combined Query for Efficiency)
        const chartRes = await pool.query(`
            SELECT EXTRACT(DAY FROM created_at)::int as day, COUNT(*) as orders, SUM(total_amount) as revenue
            FROM orders WHERE status != 'cancelled' AND EXTRACT(MONTH FROM created_at) = $1 AND EXTRACT(YEAR FROM created_at) = $2
            GROUP BY day ORDER BY day`, [month, year]);

        for (let i = 1; i <= daysInMonth; i++) {
            const dayData = chartRes.rows.find(r => r.day === i);
            kpis.orderChartData.push({ day: i, current: dayData ? dayData.orders : 0, previous: 0 });
            kpis.revenueChartData.push({ day: i, current: dayData ? parseFloat(dayData.revenue) : 0, previous: 0 });
        }

    } catch (err) {
        console.error("Critical Dashboard Error:", err);
    }

    const currentMonthLabel = new Date().toLocaleString('he-IL', { month: 'long' });

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto" dir="rtl">
            <h1 className="text-3xl font-bold mb-8">לוח בקרה - {currentMonthLabel}</h1>

            <DashboardCharts
                orderData={kpis.orderChartData}
                revenueData={kpis.revenueChartData}
                visitsData={[]}
                usersData={[]}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
                {/* Cash Flow Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm font-bold mb-4">
                        <Wallet className="w-4 h-4 text-green-500" /> תזרים מזומנים
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-sm">הכנסות נטו</span>
                            <span className="font-bold text-blue-600">{kpis.totalRevenue.toLocaleString()} ₪</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-sm">הוצאות ועמ"י</span>
                            <span className="font-bold text-red-600">{kpis.totalExpenses.toLocaleString()} ₪</span>
                        </div>
                        <div className="flex justify-between bg-gray-50 p-2 rounded">
                            <span className="font-bold text-gray-700">רווח נקי מוערך</span>
                            <span className={`font-bold ${kpis.monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {kpis.monthlyProfit.toLocaleString()} ₪
                            </span>
                        </div>
                    </div>
                </div>

                {/* Inventory Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 text-gray-500 text-sm font-bold mb-4">
                        <Package className="w-4 h-4 text-amber-500" /> מלאי בקבוקנים
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {kpis.bottleInventory.map(item => (
                            <div key={item.size} className="flex justify-between bg-gray-50 p-2 rounded text-xs">
                                <span>{item.size} מ"ל</span>
                                <span className={`font-bold ${item.quantity < 50 ? 'text-red-600' : 'text-gray-700'}`}>{item.quantity}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Samples Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 text-gray-500 text-sm font-bold mb-4">
                        <FlaskConical className="w-4 h-4 text-purple-500" /> דוגמיות שנמכרו
                    </div>
                    <div className="text-3xl font-bold mb-2">{kpis.totalSamples}</div>
                    <div className="text-xs text-gray-400">סה"כ יחידות שיצאו מהמלאי</div>
                </div>
            </div>

            <AnalyticsTables
                topBrands={kpis.topBrands}
                topSizes={kpis.topSizes}
                monthName={currentMonthLabel}
            />

            {/* Recent Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-8">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="font-bold">הזמנות אחרונות</h3>
                    <Link href="/admin/orders" className="text-blue-600 text-sm hover:underline">לכל ההזמנות</Link>
                </div>
                <div className="divide-y">
                    {kpis.recentOrders.map(order => (
                        <div key={order.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                            <div>
                                <div className="font-bold">#{order.id} | {order.customer_details?.name || 'לקוח'}</div>
                                <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('he-IL')}</div>
                            </div>
                            <div className="text-left">
                                <div className="font-bold">{order.total_amount} ₪</div>
                                <div className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{order.status}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}