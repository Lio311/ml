import pool from "@/app/lib/db";
import Link from "next/link";
import DashboardCharts from "../components/admin/DashboardCharts";
import AnalyticsTables from "../components/admin/AnalyticsTables";
import InventoryForecast from "../components/admin/InventoryForecast";
import { FlaskConical, TrendingUp, ShoppingBag, Users, Eye, Wallet, Package, ShoppingCart } from 'lucide-react';

export const dynamic = 'force-dynamic';

import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";


export const metadata = {
    title: "ניהול ראשי | ml_tlv",
    robots: "noindex, nofollow",
};

export default async function AdminDashboard() {
    // Safe Auth Check
    let user = null;
    let role = null;
    try {
        user = await currentUser();
        role = user?.publicMetadata?.role;
        if (role === 'warehouse') {
            redirect("/admin/orders");
        }
    } catch (e) {
        // Allow redirect to throw
        if (e?.digest?.startsWith('NEXT_REDIRECT')) throw e;
        console.error("Auth check failed", e);
    }

    // Helper for safe parallel queries
    const safeQuery = async (text, params = []) => {
        try {
            return await pool.query(text, params);
        } catch (e) {
            console.error(`Query failed: ${text.replace(/\s+/g, ' ').substring(0, 50)}...`, e.message);
            return { rows: [] };
        }
    };

    // Date Parameters
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Fix: Handle end-of-month edge cases (e.g., March 31 -> Feb 31 -> March 3)
    const prevDate = new Date();
    prevDate.setDate(1); // Safely move to the 1st of the month
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();

    // Initialize KPIs container
    let kpis = {
        totalOrders: 0,
        totalRevenue: 0,
        totalUsers: 0,
        totalSamples: 0,
        orderChartData: [],
        revenueChartData: [],
        topBrands: [],
        topSizes: [],
        monthlyProfit: 0,
        visitsChartData: [],
        recentOrders: [],
        bottleInventory: [],
        recentCoupons: [],
        samplesBreakdown: { '2': 0, '5': 0, '10': 0, '11': 0 },
        totalExpenses: 0,
        monthlyVisits: 0
    };

    let usersChartData = [];
    let forecasts = [];

    try {
        // --- 1. FIRE ALL QUERIES IN PARALLEL ---
        // This eliminates the "waterfall" effect and connection pool locking
        const [
            ordersRes,
            countRes,
            revRes,
            samplesSoldRes,
            samplesBreakdownRes,
            monthlyExpRes,
            yearlyExpRes,
            bottleInvRes,
            countResUsers,
            userCurrentMonthRes,
            userPrevMonthRes,
            last30DaysRes,
            currentMonthRes,
            prevMonthRes,
            currentMonthVisitsRes,
            prevMonthVisitsRes,
            couponsRes,
            revAllTimeRes,
            expAllTimeRes,
            cogsAllTimeRes
        ] = await Promise.all([
            // 1. Recent Orders
            pool.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 3'),
            // 2. Total Orders Count
            pool.query('SELECT COUNT(*) FROM orders'),
            // 3. Total Monthly Revenue
            safeQuery(`
                SELECT SUM(total_amount) FROM orders 
                WHERE status != 'cancelled'
                AND catalog_id IS NULL
                AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
            `),
            // 4. Total Samples Sold (Monthly)
            safeQuery(`
                 SELECT SUM((item->>'quantity')::int) as count 
                 FROM orders, jsonb_array_elements(items::jsonb) as item 
                 WHERE orders.status != 'cancelled' 
                 AND orders.catalog_id IS NULL
                 AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
                 AND (
                    item->>'name' LIKE '%דוגמית%' 
                    OR item->>'name' ILIKE '%sample%'
                    OR item->>'size' IN ('2', '5', '10', '11')
                 )
            `),
            // 5. Samples Breakdown (Monthly)
            safeQuery(`
                 SELECT item->>'size' as size, SUM((item->>'quantity')::int) as count 
                 FROM orders, jsonb_array_elements(items::jsonb) as item 
                 WHERE orders.status != 'cancelled' 
                 AND orders.catalog_id IS NULL
                 AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
                 AND (
                    item->>'name' LIKE '%דוגמית%' 
                    OR item->>'name' ILIKE '%sample%'
                    OR item->>'size' IN ('2', '5', '10', '11')
                 )
                 GROUP BY size
            `),
            // 6. Monthly Expenses
            safeQuery(`
                SELECT SUM(amount) FROM expenses 
                WHERE type = 'monthly'
                AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
            `),
            // 7. Yearly Expenses (Pro-rated for month)
            safeQuery("SELECT SUM(amount) FROM expenses WHERE type = 'yearly'"),
            // 8. Bottle Inventory
            safeQuery('SELECT size, quantity FROM bottle_inventory ORDER BY size ASC'),
            // 9. Total Users
            safeQuery('SELECT COUNT(*) FROM users'),
            // 10. Users Daily Graph (Current Month)
            safeQuery(`
                SELECT 
                    EXTRACT(DAY FROM created_at)::int as day,
                    COUNT(*)::int as count
                FROM users
                WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
                GROUP BY day
                ORDER BY day
            `),
            // 11. Users Daily Graph (Previous Month)
            safeQuery(`
                SELECT 
                    EXTRACT(DAY FROM created_at)::int as day,
                    COUNT(*)::int as count
                FROM users
                WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
                AND created_at < DATE_TRUNC('month', CURRENT_DATE)
                GROUP BY day
                ORDER BY day
            `),
            // 12. Forecast Data (Last 30 Days Orders)
            safeQuery(`
                SELECT items FROM orders 
                WHERE status != 'cancelled' 
                AND catalog_id IS NULL
                AND created_at > NOW() - INTERVAL '30 days'
            `),
            // 13. Yearly Orders (KEEPING FOR STATISTICS TABLES)
            safeQuery(`
                SELECT total_amount, items, created_at FROM orders 
                WHERE status != 'cancelled' 
                AND catalog_id IS NULL
                AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
            `),
            // 14. Products (For Cost Calculation)
            safeQuery('SELECT id, cost_price, original_size FROM products'),
            // 15. Monthly Visits (KPI)
            safeQuery(`
                SELECT COUNT(*) FROM site_visits 
                WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
            `),
            // 16. Orders Chart (Daily - Current Month)
            safeQuery(`
                SELECT 
                    EXTRACT(DAY FROM created_at) as day,
                    COUNT(*) as orders,
                    SUM(total_amount) as revenue
                FROM orders
                WHERE status != 'cancelled'
                AND catalog_id IS NULL
                AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
                GROUP BY day
                ORDER BY day
            `),
            // 17. Orders Chart (Daily - Previous Month)
            safeQuery(`
                SELECT 
                    EXTRACT(DAY FROM created_at) as day,
                    COUNT(*) as orders,
                    SUM(total_amount) as revenue
                FROM orders
                WHERE status != 'cancelled'
                AND catalog_id IS NULL
                AND created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
                AND created_at < DATE_TRUNC('month', CURRENT_DATE)
                GROUP BY day
                ORDER BY day
            `),
            // 18. Visits Chart (Daily - Current Month)
            safeQuery(`
                SELECT 
                    EXTRACT(DAY FROM created_at) as day,
                    COUNT(*) as count
                FROM site_visits
                WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
                GROUP BY day
                ORDER BY day
            `),
            // 19. Visits Chart (Daily - Previous Month)
            safeQuery(`
                SELECT 
                    EXTRACT(DAY FROM created_at) as day,
                    COUNT(*) as count
                FROM site_visits
                WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
                AND created_at < DATE_TRUNC('month', CURRENT_DATE)
                GROUP BY day
                ORDER BY day
            `),
            // 20. Recent Coupons
            safeQuery(`
                SELECT * FROM coupons 
                WHERE status = 'active' 
                AND (expires_at IS NULL OR expires_at > NOW())
                ORDER BY created_at DESC 
                LIMIT 20
            `),
            // 21. Total Revenue (All Time)
            safeQuery("SELECT SUM(total_amount) as sum FROM orders WHERE status != 'cancelled' AND catalog_id IS NULL"),
            // 22. Total Expenses (All Time)
            safeQuery("SELECT SUM(amount) as sum FROM expenses"),
            // 23. Total COGS (All Time) - SQL Calculation
            safeQuery(`
                WITH expanded_items AS(
                SELECT
                    (item ->> 'quantity'):: numeric as qty,
                COALESCE((item ->> 'size'):: numeric, 2) as size,
                (SPLIT_PART(item ->> 'id', '-', 1)):: int as product_id,
                orders.catalog_id
                    FROM orders, jsonb_array_elements(items) as item
                    WHERE status != 'cancelled'
            )
                SELECT
                    SUM(qty * (COALESCE(p.cost_price, 0) / NULLIF(p.original_size, 1)) * size) as sum
                FROM expanded_items ei
                JOIN products p ON ei.product_id = p.id
                WHERE ei.catalog_id IS NULL
                `)
        ]);

        // --- 2. PROCESS DATA (Sync) ---

        // Basic KPIs
        kpis.recentOrders = ordersRes.rows;
        kpis.totalOrders = parseInt(countRes.rows[0]?.count || 0);
        kpis.totalRevenue = parseInt(revRes.rows[0]?.sum || 0);
        kpis.totalSamples = parseInt(samplesSoldRes.rows[0]?.count || 0);
        kpis.bottleInventory = bottleInvRes.rows;
        kpis.totalUsers = parseInt(countResUsers.rows[0]?.count || 0);
        kpis.monthlyVisits = parseInt(currentMonthVisitsRes.rows[0]?.count || 0);
        kpis.recentCoupons = couponsRes.rows;

        // Cumulative Data
        // Note: The Promise.all array index must match the added queries.
        // We added 3 queries at the end (Indices 20, 21, 22 if 0-based and we had 20 items before [0-19])
        const totalRevenueAllTime = parseFloat(revAllTimeRes.rows[0]?.sum || 0);
        const totalExpensesAllTime = parseFloat(expAllTimeRes.rows[0]?.sum || 0);
        const totalCOGSAllTime = parseFloat(cogsAllTimeRes.rows[0]?.sum || 0);

        kpis.cumulativeProfit = Math.round(totalRevenueAllTime - totalExpensesAllTime - totalCOGSAllTime);

        // Samples Breakdown
        samplesBreakdownRes.rows.forEach(r => {
            const sizeKey = r.size?.replace(/[^0-9]/g, '');
            if (kpis.samplesBreakdown[sizeKey] !== undefined) {
                kpis.samplesBreakdown[sizeKey] += parseInt(r.count || 0);
            }
        });

        // Expenses
        const monthlySum = parseFloat(monthlyExpRes.rows[0]?.sum || 0);
        const yearlyProRated = parseFloat(yearlyExpRes.rows[0]?.sum || 0) / 12;
        kpis.totalExpenses = Math.round(monthlySum + yearlyProRated);

        // Profit Calculation
        const productMap = {};
        productsRes.rows.forEach(p => {
            productMap[p.id] = {
                cost: parseFloat(p.cost_price || 0),
                size: parseFloat(p.original_size || 100)
            };
        });

        // Yearly Stats for Tables (Preserving the requested yearly view)
        const brandStats = {};
        const sizeStats = {};
        
        yearlyOrdersRes.rows.forEach(order => {
            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
            let orderItemsCost = 0;
            let orderGrossSales = 0;

            items.forEach(item => {
                orderGrossSales += parseFloat(item.price || 0) * parseInt(item.quantity || 1);
            });

            const orderNetTotal = parseFloat(order.total_amount) || 0;
            const ratio = orderGrossSales > 0 ? (orderNetTotal / orderGrossSales) : 0;

            items.forEach(item => {
                const quantity = parseInt(item.quantity || 1);
                const itemGross = parseFloat(item.price || 0) * quantity;
                const itemNet = itemGross * ratio;

                if (item.brand) {
                    brandStats[item.brand] = (brandStats[item.brand] || 0) + itemNet;
                }
                if (item.size) {
                    const sizeKey = item.size.toString();
                    sizeStats[sizeKey] = (sizeStats[sizeKey] || 0) + itemNet;
                }
            });
        });

        // Current Month Profit Calculation
        let currentMonthProfit = 0;
        currentMonthRes.rows.forEach(day => {
            // Estimating profit from revenue since we don't have per-order COGS in the chart query
            // Using a conservative 40% margin estimate for the KPI card if detailed COGS isn't available per-day
            // Better: calculate it from the monthlyOrdersRes if we want accuracy, or fetch items for the month
        });
        
        // Re-calculating monthly profit accurately
        const monthlyOrdersRes = await safeQuery(`
            SELECT total_amount, items FROM orders 
            WHERE status != 'cancelled' 
            AND catalog_id IS NULL
            AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
        `);

        monthlyOrdersRes.rows.forEach(order => {
            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
            let orderItemsCost = 0;
            items.forEach(item => {
                let dbId = item.id;
                if (typeof dbId === 'string' && dbId.includes('-')) dbId = parseInt(dbId.split('-')[0]);
                const prodInfo = productMap[dbId];
                if (prodInfo && prodInfo.size > 0) {
                    orderItemsCost += (prodInfo.cost / prodInfo.size) * parseFloat(item.size || 2) * parseInt(item.quantity || 1);
                }
            });
            currentMonthProfit += (parseFloat(order.total_amount) - orderItemsCost);
        });

        kpis.monthlyProfit = Math.round(currentMonthProfit - kpis.totalExpenses);

        // Stats Ranking (Yearly)
        kpis.topBrands = Object.entries(brandStats)
            .map(([name, sales]) => ({ name, sales }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5);

        kpis.topSizes = Object.entries(sizeStats)
            .map(([size, sales]) => ({ size, sales }))
            .sort((a, b) => b.sales - a.sales);


        // Chart Mapping (Daily - Current Month)
        for (let d = 1; d <= daysInMonth; d++) {
            // Users
            const curUserDay = userCurrentMonthRes.rows.find(r => Number(r.day) === d);
            const prevUserDay = userPrevMonthRes.rows.find(r => Number(r.day) === d);
            usersChartData.push({
                day: d,
                current: curUserDay ? Number(curUserDay.count) : 0,
                previous: prevUserDay ? Number(prevUserDay.count) : 0
            });

            // Orders/Revenue
            const curOrd = currentMonthRes.rows.find(r => parseInt(r.day) === d);
            const prevOrd = prevMonthRes.rows.find(r => parseInt(r.day) === d);

            // Visits
            const curVis = currentMonthVisitsRes.rows.find(r => parseInt(r.day) === d);
            const prevVis = prevMonthVisitsRes.rows.find(r => parseInt(r.day) === d);

            kpis.visitsChartData.push({
                day: d,
                current: curVis ? parseInt(curVis.count) : 0,
                previous: prevVis ? parseInt(prevVis.count) : 0
            });

            kpis.orderChartData.push({
                day: d,
                current: curOrd ? parseInt(curOrd.orders) : 0,
                previous: prevOrd ? parseInt(prevOrd.orders) : 0
            });

            kpis.revenueChartData.push({
                day: d,
                current: curOrd ? parseFloat(curOrd.revenue || 0) : 0,
                previous: prevOrd ? parseFloat(prevOrd.revenue || 0) : 0
            });
        }

        // Inventory Forecast Logic (Sync) - unchanged
        try {
            const sizeConsumption = { '2': 0, '5': 0, '10': 0, '11': 0 };
            last30DaysRes.rows.forEach(order => {
                const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                items.forEach(item => {
                    const s = item.size ? item.size.toString() : '10';
                    const sKey = s.replace(/[^0-9]/g, '');
                    if (sizeConsumption[sKey] !== undefined) {
                        sizeConsumption[sKey] += parseInt(item.quantity || 1);
                    }
                });
            });

            kpis.bottleInventory.forEach(inv => {
                const sKey = inv.size.replace(/[^0-9]/g, '');
                const quantity = parseInt(inv.quantity || 0);
                const usage30Days = sizeConsumption[sKey] || 0;
                const dailyRate = usage30Days / 30;
                const daysLeft = dailyRate > 0 ? Math.round(quantity / dailyRate) : 9999;
                forecasts.push({
                    name: `בקבוקי ${inv.size} מ"ל`,
                    daysLeft,
                    dailyRate,
                    quantity
                });
            });
            forecasts.sort((a, b) => a.daysLeft - b.daysLeft);
        } catch (fcErr) {
            console.warn("Forecast calc error", fcErr);
        }

    } catch (err) {
        console.error("Critical Dashboard Error:", err);
    }

    const currentMonthLabel = new Date().toLocaleString('he-IL', { month: 'long' });
    const currentYearLabel = new Date().getFullYear().toString();

    return (
        <div className="pb-8">
            <h1 className="text-3xl font-bold mb-8">לוח בקרה</h1>

            <DashboardCharts
                orderData={kpis.orderChartData}
                revenueData={kpis.revenueChartData}
                visitsData={kpis.visitsChartData}
                usersData={usersChartData || []}
            />


            <AnalyticsTables
                topBrands={kpis.topBrands}
                topSizes={kpis.topSizes}
                monthName={currentYearLabel}
            />

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">

                {/* Cash Flow */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="text-gray-500 text-sm font-bold uppercase flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-green-500" />
                            תזרים ({currentMonthLabel})
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <span className="text-blue-600 font-bold text-xs md:text-sm">הכנסות</span>
                            <div className="text-right">
                                <span className="text-lg md:text-xl font-bold text-blue-700">
                                    <span dir="ltr" className="inline-block">{kpis.totalRevenue.toLocaleString()}</span> ₪
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <span className="text-red-600 font-bold text-xs md:text-sm">הוצאות</span>
                            <div className="text-right">
                                <span className="text-lg md:text-xl font-bold text-red-700">
                                    <span dir="ltr" className="inline-block">{kpis.totalExpenses.toLocaleString()}</span> ₪
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center bg-gray-50/50 p-2 rounded-xl mb-2">
                            <span className={`${kpis.monthlyProfit < 0 ? 'text-red-600' : 'text-green-600'} font-bold text-sm`}>רווח</span>
                            <div className="text-right">
                                <span className={`text-xl md:text-2xl font-bold ${kpis.monthlyProfit < 0 ? 'text-red-700' : 'text-green-700'}`}>
                                    <span dir="ltr" className="inline-block">{kpis.monthlyProfit.toLocaleString()}</span> ₪
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center border-t border-gray-100 pt-2 mt-2">
                            <span className="text-gray-400 font-bold text-[10px]">רווח מצטבר (מאז ומעולם)</span>
                            <div className="text-right">
                                <span className={`text-xs font-bold ${kpis.cumulativeProfit < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    <span dir="ltr" className="inline-block">{kpis.cumulativeProfit ? kpis.cumulativeProfit.toLocaleString() : '0'}</span> ₪
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottle Inventory */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-gray-500 text-sm font-bold uppercase flex items-center gap-2">
                            <Package className="w-4 h-4 text-amber-500" />
                            מלאי בקבוקונים פנוי
                        </div>
                    </div>

                    <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-4xl font-bold text-gray-900">
                            {kpis.bottleInventory.reduce((acc, item) => acc + parseInt(item.quantity || 0), 0)}
                        </span>
                        <span className="text-xs text-gray-400 font-bold uppercase">בקבוקונים</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {kpis.bottleInventory && kpis.bottleInventory.map(item => {
                            const sizeLabel = item.size === 11 ? 'יוקרתי' : `${item.size} מ"ל`;
                            // Choose a color theme based on size for consistency
                            const theme = item.size === 2 ? 'bg-amber-50/50 border-amber-100 text-amber-700' :
                                          item.size === 5 ? 'bg-orange-50/50 border-orange-100 text-orange-700' :
                                          item.size === 10 ? 'bg-yellow-50/50 border-yellow-100 text-yellow-700' :
                                          'bg-emerald-50/50 border-emerald-100 text-emerald-700';

                            return (
                                <div key={item.size} className={`flex flex-col items-center p-2 rounded-xl border ${theme}`}>
                                    <span className="text-[9px] font-bold mb-1">{sizeLabel}</span>
                                    <span className={`font-black text-base leading-none ${item.quantity < 20 ? 'text-red-600' : ''}`}>
                                        {item.quantity}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-4 text-center border-t border-gray-50 pt-3">
                        <Link href="/admin/inventory" className="text-blue-500 hover:underline font-bold transition-all">לניהול המלאי המלא ←</Link>
                    </div>
                </div>

                {/* Samples Sold */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-gray-500 text-sm font-bold uppercase flex items-center gap-2">
                            <FlaskConical className="w-4 h-4 text-purple-500" />
                            דוגמיות שנמכרו
                        </div>
                    </div>

                    <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-4xl font-bold text-gray-900">{kpis.totalSamples}</span>
                        <span className="text-xs text-gray-400 font-bold uppercase">יחידות</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col items-center bg-purple-50/50 p-2 rounded-xl border border-purple-100">
                            <span className="text-[9px] text-purple-600 font-bold mb-1">2 מ״ל</span>
                            <span className="font-black text-base text-purple-800 leading-none">{kpis.samplesBreakdown['2']}</span>
                        </div>
                        <div className="flex flex-col items-center bg-pink-50/50 p-2 rounded-xl border border-pink-100">
                            <span className="text-[9px] text-pink-600 font-bold mb-1">5 מ״ל</span>
                            <span className="font-black text-base text-pink-800 leading-none">{kpis.samplesBreakdown['5']}</span>
                        </div>
                        <div className="flex flex-col items-center bg-blue-50/50 p-2 rounded-xl border border-blue-100">
                            <span className="text-[9px] text-blue-600 font-bold mb-1">10 מ״ל</span>
                            <span className="font-black text-base text-blue-800 leading-none">{kpis.samplesBreakdown['10']}</span>
                        </div>
                        <div className="flex flex-col items-center bg-amber-50/50 p-2 rounded-xl border border-amber-100">
                            <span className="text-[9px] text-amber-600 font-bold mb-1">יוקרתי</span>
                            <span className="font-black text-base text-amber-800 leading-none">{kpis.samplesBreakdown['11']}</span>
                        </div>
                    </div>
                </div>

                {/* Total Orders */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                    <div className="text-gray-500 text-sm font-bold uppercase mb-2 flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-blue-500" />
                        הזמנות סה״כ
                    </div>
                    <div className="text-3xl font-bold mb-4">{kpis.totalOrders}</div>
                    <div className="text-[10px] text-center border-t border-gray-50 pt-3 mt-2">
                        <Link href="/admin/orders" className="text-blue-500 hover:underline font-bold transition-all">לניהול הזמנות ←</Link>
                    </div>
                </div>

                {/* Site Visits */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 to-indigo-400"></div>
                    <div className="text-gray-500 text-sm font-bold uppercase mb-2 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-sky-500" />
                        כניסות לאתר
                    </div>
                    <div className="text-xl font-bold mb-1 text-gray-900">
                        שנתי ({currentYearLabel}): <span className="text-blue-600">{kpis.monthlyVisits}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-medium italic">נספר לפי ביקורים ייחודיים</div>
                </div>

                {/* Registered Users */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                    <div className="text-gray-500 text-sm font-bold uppercase mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-500" />
                        משתמשים רשומים
                    </div>
                    <div className="text-3xl font-bold mb-4 text-gray-900">{kpis.totalUsers}</div>
                    <div className="text-[10px] text-center border-t border-gray-50 pt-3 mt-2">
                        <Link href="/admin/users" className="text-blue-500 hover:underline font-bold transition-all">לניהול משתמשים ←</Link>
                    </div>
                </div>
            </div>

            {/* Recent Orders List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">הזמנות אחרונות</h3>
                    <Link href="/admin/orders" className="text-blue-600 text-sm font-bold hover:underline">לכל ההזמנות</Link>
                </div>
                <div className="divide-y divide-gray-100">
                    {kpis.recentOrders.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm italic">
                            עדיין אין הזמנות...
                        </div>
                    ) : (
                        kpis.recentOrders.map(order => (
                            <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div>
                                    <div className="font-bold text-gray-900">הזמנה #{order.id}</div>
                                    <div className="text-sm text-gray-500">
                                        {order.customer_details?.name} • {new Date(order.created_at).toLocaleDateString('he-IL')}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-gray-900">{order.total_amount} ₪</div>
                                    <span className={`text-[9px] md:text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${order.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                            order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                        }`}>
                                        {
                                            order.status === 'pending' ? 'ממתין' :
                                                order.status === 'processing' ? 'בטיפול' :
                                                    order.status === 'shipped' ? 'נשלח' :
                                                        order.status === 'completed' ? 'הושלם' :
                                                            order.status === 'cancelled' ? 'בוטל' :
                                                                order.status
                                        }
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Coupons Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">קופונים אחרונים</h3>
                    <Link href="/admin/coupons" className="text-blue-600 text-sm font-bold hover:underline">לכל הקופונים</Link>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-right" dir="rtl">
                        <thead className="bg-gray-50 text-gray-500 text-sm font-bold">
                            <tr>
                                <th className="p-4 text-center">קוד</th>
                                <th className="p-4 text-center">הנחה</th>
                                <th className="p-4 text-center">מייל לקוח</th>
                                <th className="p-4 text-center">סטטוס</th>
                                <th className="p-4 text-center">נוצר בתאריך</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {kpis.recentCoupons && kpis.recentCoupons.map(coupon => {
                                const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
                                const displayStatus = isExpired ? 'expired' : coupon.status;

                                return (
                                    <tr key={coupon.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="p-4 font-mono font-bold text-blue-600 text-center text-sm">{coupon.code}</td>
                                        <td className="p-4 text-center font-black text-gray-900">{coupon.discount_percent}%</td>
                                        <td className="p-4 text-xs text-center text-gray-500 truncate max-w-[150px]">{coupon.email || '-'}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${displayStatus === 'active' ? 'bg-green-100 text-green-800' :
                                                displayStatus === 'redeemed' ? 'bg-gray-800 text-white' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {displayStatus === 'active' ? 'פעיל' :
                                                    displayStatus === 'redeemed' ? 'מומש' : 'פג תוקף'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs text-gray-500 text-center whitespace-nowrap">
                                            {new Date(coupon.created_at).toLocaleString('he-IL')}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
