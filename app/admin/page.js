import pool from "@/app/lib/db";
import Link from "next/link";
import DashboardCharts from "../components/admin/DashboardCharts";
import AnalyticsTables from "../components/admin/AnalyticsTables";
import InventoryForecast from "../components/admin/InventoryForecast";
import { sanitizeProductArray } from "@/app/lib/productUtils";
import { FlaskConical, TrendingUp, ShoppingBag, Users, Eye, Wallet, Package, ShoppingCart, ChevronRight, ChevronLeft } from 'lucide-react';


export const dynamic = 'force-dynamic';

import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";


export const metadata = {
    title: "לוח בקרה | ml_tlv",
    robots: "noindex, nofollow",
};

export default async function AdminDashboard({ searchParams }) {
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
    const currentRealYear = now.getFullYear();
    const currentRealMonth = now.getMonth() + 1;

    const params = await searchParams;
    const year = params?.year ? parseInt(params.year) : currentRealYear;
    const month = params?.month ? parseInt(params.month) : currentRealMonth;

    const currentMonthLabel = new Date(year, month - 1, 1).toLocaleDateString('he-IL', { month: 'long' });
    const currentYearLabel = `${year}`;

    // Fix: Handle end-of-month edge cases (e.g., March 31 -> Feb 31 -> March 3)
    const prevDateObj = new Date(year, month - 2, 1);
    const prevYear = prevDateObj.getFullYear();
    const prevMonth = prevDateObj.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();

    // Navigation Dates (For UI Links)
    const prevNavYear = prevYear;
    const prevNavMonth = prevMonth;
    
    const nextDateObj = new Date(year, month, 1);
    const nextNavYear = nextDateObj.getFullYear();
    const nextNavMonth = nextDateObj.getMonth() + 1;
    
    const hasNextMonth = (year < currentRealYear) || (year === currentRealYear && month < currentRealMonth);

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
            yearlyOrdersRes,
            userCurrentMonthRes,
            userPrevMonthRes,
            last30DaysRes,
            monthlyOrdersRes,
            productsRes,
            visitsRes,
            currentMonthRes,
            prevMonthRes,
            currentMonthVisitsRes,
            prevMonthVisitsRes,
            couponsRes,
            revAllTimeRes,
            expAllTimeRes,
            cogsAllTimeRes,
            cumulativeSalesRes
        ] = await Promise.all([
            // 1. Recent Orders
            safeQuery("SELECT id, customer_details, created_at, total_amount, status FROM orders WHERE catalog_id IS NULL ORDER BY created_at DESC LIMIT 3"),
            // 2. Total Orders Count
            safeQuery("SELECT COUNT(*) FROM orders WHERE catalog_id IS NULL"),
            // 3. Total Monthly Revenue
            safeQuery(`
                SELECT SUM(total_amount) FROM orders 
                WHERE status != 'cancelled'
                AND catalog_id IS NULL
                AND EXTRACT(MONTH FROM created_at) = $1
                AND EXTRACT(YEAR FROM created_at) = $2
            `, [month, year]),
            // 4. Total Samples Sold
            safeQuery(`
                 SELECT SUM((item->>'quantity')::int) as count 
                 FROM orders, jsonb_array_elements(items::jsonb) as item 
                 WHERE orders.status != 'cancelled' 
                 AND orders.catalog_id IS NULL
                 AND (
                    item->>'name' LIKE '%דוגמיות%' 
                    OR item->>'name' ILIKE '%sample%'
                    OR item->>'size' IN ('2', '5', '10', '11')
                 )
            `),
            // 5. Samples Breakdown
            safeQuery(`
                 SELECT item->>'size' as size, SUM((item->>'quantity')::int) as count 
                 FROM orders, jsonb_array_elements(items::jsonb) as item 
                 WHERE orders.status != 'cancelled' 
                 AND orders.catalog_id IS NULL
                 AND (
                    item->>'name' LIKE '%דוגמיות%' 
                    OR item->>'name' ILIKE '%sample%'
                    OR item->>'size' IN ('2', '5', '10', '11')
                 )
                 GROUP BY size
            `),
            // 6. Monthly Expenses
            safeQuery(`
                SELECT SUM(amount) FROM expenses 
                WHERE type = 'monthly'
                AND EXTRACT(MONTH FROM date) = $1
                AND EXTRACT(YEAR FROM date) = $2
            `, [month, year]),
            // 7. Yearly Expenses
            safeQuery("SELECT SUM(amount) FROM expenses WHERE type = 'yearly'"),
            // 8. Bottle Inventory
            safeQuery('SELECT size, quantity FROM bottle_inventory ORDER BY size ASC'),
            // 9. Total Users
            safeQuery('SELECT COUNT(*) FROM users'),
            // 10. Yearly Orders (For Tables)
            safeQuery(`
                SELECT total_amount, items, created_at FROM orders 
                WHERE status != 'cancelled' 
                AND catalog_id IS NULL
                AND EXTRACT(YEAR FROM created_at) = $1
            `, [year]),
            // 11. Users Graph (Current)
            safeQuery(`
                SELECT 
                    EXTRACT(DAY FROM created_at)::int as day,
                    COUNT(*)::int as count
                FROM users
                WHERE EXTRACT(MONTH FROM created_at) = $1
                AND EXTRACT(YEAR FROM created_at) = $2
                GROUP BY day
                ORDER BY day
            `, [month, year]),
            // 11. Users Graph (Previous)
            safeQuery(`
                SELECT 
                    EXTRACT(DAY FROM created_at)::int as day,
                    COUNT(*)::int as count
                FROM users
                WHERE EXTRACT(MONTH FROM created_at) = $1
                AND EXTRACT(YEAR FROM created_at) = $2
                GROUP BY day
                ORDER BY day
            `, [prevMonth, prevYear]),
            // 12. Forecast Data (Last 30 Days Orders)
            safeQuery(`
                SELECT items FROM orders 
                WHERE status != 'cancelled' 
                AND catalog_id IS NULL
                AND created_at > NOW() - INTERVAL '30 days'
            `),
            // 13. Monthly Orders (For Profit Calc)
            safeQuery(`
                SELECT total_amount, items FROM orders 
                WHERE status != 'cancelled' 
                AND catalog_id IS NULL
                AND EXTRACT(MONTH FROM created_at) = $1
                AND EXTRACT(YEAR FROM created_at) = $2
            `, [month, year]),
            // 14. Products (For Cost Calculation)
            safeQuery('SELECT id, cost_price, original_size FROM products'),
            // 15. Monthly Visits (KPI)
            safeQuery(`
                SELECT COUNT(*) FROM site_visits 
                WHERE EXTRACT(MONTH FROM created_at) = $1 
                AND EXTRACT(YEAR FROM created_at) = $2
            `, [month, year]),
            // 16. Orders Chart (Current)
            safeQuery(`
                SELECT 
                    EXTRACT(DAY FROM created_at) as day,
                    COUNT(*) as orders,
                    SUM(total_amount) as revenue
                FROM orders
                WHERE status != 'cancelled'
                AND catalog_id IS NULL
                AND EXTRACT(MONTH FROM created_at) = $1
                AND EXTRACT(YEAR FROM created_at) = $2
                GROUP BY day
                ORDER BY day
            `, [month, year]),
            // 17. Orders Chart (Previous)
            safeQuery(`
                SELECT 
                    EXTRACT(DAY FROM created_at) as day,
                    COUNT(*) as orders,
                    SUM(total_amount) as revenue
                FROM orders
                WHERE status != 'cancelled'
                AND catalog_id IS NULL
                AND EXTRACT(MONTH FROM created_at) = $1
                AND EXTRACT(YEAR FROM created_at) = $2
                GROUP BY day
                ORDER BY day
            `, [prevMonth, prevYear]),
            // 18. Visits Chart (Current)
            safeQuery(`
                SELECT 
                    EXTRACT(DAY FROM created_at) as day,
                    COUNT(*) as count
                FROM site_visits
                WHERE EXTRACT(MONTH FROM created_at) = $1
                AND EXTRACT(YEAR FROM created_at) = $2
                GROUP BY day
                ORDER BY day
            `, [month, year]),
            // 19. Visits Chart (Previous)
            safeQuery(`
                SELECT 
                    EXTRACT(DAY FROM created_at) as day,
                    COUNT(*) as count
                FROM site_visits
                WHERE EXTRACT(MONTH FROM created_at) = $1
                AND EXTRACT(YEAR FROM created_at) = $2
                GROUP BY day
                ORDER BY day
            `, [prevMonth, prevYear]),
            safeQuery(`
                SELECT id, code, discount_percent, email, status, expires_at, created_at FROM coupons 
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
                `),
            // 24. Cumulative Revenue (All Time)
            safeQuery(`
                SELECT 
                    DATE_TRUNC('day', created_at) as day,
                    SUM(SUM(total_amount)) OVER (ORDER BY DATE_TRUNC('day', created_at)) as cumulative
                FROM orders
                WHERE status != 'cancelled' AND catalog_id IS NULL
                GROUP BY DATE_TRUNC('day', created_at)
                ORDER BY day
            `)
        ]);

        // --- 2. PROCESS DATA (Sync) ---
        const sanitizedOrders = sanitizeProductArray(ordersRes.rows);
        const sanitizedBottleInv = sanitizeProductArray(bottleInvRes.rows);
        const sanitizedCoupons = sanitizeProductArray(couponsRes.rows);
        const sanitizedYearlyOrders = sanitizeProductArray(yearlyOrdersRes.rows);
        const sanitizedUserCurrentMonth = sanitizeProductArray(userCurrentMonthRes.rows);
        const sanitizedUserPrevMonth = sanitizeProductArray(userPrevMonthRes.rows);
        const sanitizedLast30Days = sanitizeProductArray(last30DaysRes.rows);
        const sanitizedMonthlyOrders = sanitizeProductArray(monthlyOrdersRes.rows);
        const sanitizedProducts = sanitizeProductArray(productsRes.rows);
        const sanitizedCurrentMonth = sanitizeProductArray(currentMonthRes.rows);
        const sanitizedPrevMonth = sanitizeProductArray(prevMonthRes.rows);
        const sanitizedCurrentMonthVisits = sanitizeProductArray(currentMonthVisitsRes.rows);
        const sanitizedPrevMonthVisits = sanitizeProductArray(prevMonthVisitsRes.rows);
        const sanitizedSamplesBreakdown = sanitizeProductArray(samplesBreakdownRes.rows);

        // Basic KPIs
        kpis.recentOrders = sanitizedOrders;
        kpis.totalOrders = parseInt(countRes.rows[0]?.count || 0);
        kpis.totalRevenue = parseInt(revRes.rows[0]?.sum || 0);
        kpis.totalSamples = parseInt(samplesSoldRes.rows[0]?.count || 0);
        kpis.bottleInventory = sanitizedBottleInv;
        kpis.totalUsers = parseInt(countResUsers.rows[0]?.count || 0);
        kpis.monthlyVisits = parseInt(visitsRes.rows[0]?.count || 0);
        kpis.recentCoupons = sanitizedCoupons;


        // Cumulative Data
        // Note: The Promise.all array index must match the added queries.
        const totalRevenueAllTime = parseFloat(revAllTimeRes.rows[0]?.sum || 0);
        const totalExpensesAllTime = parseFloat(expAllTimeRes.rows[0]?.sum || 0);
        const totalCOGSAllTime = parseFloat(cogsAllTimeRes.rows[0]?.sum || 0);
        const totalOrdersAllTime = parseInt(countRes.rows[0]?.count || 0);

        kpis.totalRevenueAllTime = totalRevenueAllTime; // Add this
        kpis.avgOrderValue = totalOrdersAllTime > 0 ? Math.round(totalRevenueAllTime / totalOrdersAllTime) : 0;
        kpis.cumulativeRevenueData = cumulativeSalesRes?.rows.map(r => ({
            date: new Date(r.day).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' }),
            value: Math.round(parseFloat(r.cumulative || 0))
        })) || [];

        kpis.cumulativeProfit = Math.round(totalRevenueAllTime - totalExpensesAllTime - totalCOGSAllTime);

        // Samples Breakdown
        sanitizedSamplesBreakdown.forEach(r => {
            const sizeKey = r.size?.replace(/[^0-9]/g, '');
            if (kpis.samplesBreakdown[sizeKey] !== undefined) {
                kpis.samplesBreakdown[sizeKey] += parseInt(r.count || 0);
            }
        });

        // Expenses
        const monthlySum = parseFloat(monthlyExpRes.rows[0]?.sum || 0);
        const yearlySum = parseFloat(yearlyExpRes.rows[0]?.sum || 0);
        const totalMonthlyExpenses = monthlySum + (yearlySum / 12);
        kpis.totalExpenses = Math.round(totalMonthlyExpenses);

        // Profit Calculation
        const productMap = {};
        sanitizedProducts.forEach(p => {
            productMap[p.id] = {
                cost: parseFloat(p.cost_price || 0),
                size: parseFloat(p.original_size || 100)
            };
        });

        // Stats Ranking (YEARLY - From yearlyOrdersRes)
        const brandStatsYearly = {};
        const sizeStatsYearly = {};

        sanitizedYearlyOrders.forEach(order => {

            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
            let orderGrossSales = 0;
            items.forEach(item => {
                orderGrossSales += parseFloat(item.price || 0) * parseInt(item.quantity || 1);
            });
            const ratio = orderGrossSales > 0 ? (parseFloat(order.total_amount) / orderGrossSales) : 0;

            items.forEach(item => {
                const quantity = parseInt(item.quantity || 1);
                const itemNet = parseFloat(item.price || 0) * quantity * ratio;
                if (item.brand) {
                    brandStatsYearly[item.brand] = (brandStatsYearly[item.brand] || 0) + itemNet;
                }
                if (item.size) {
                    const sizeKey = item.size.toString();
                    sizeStatsYearly[sizeKey] = (sizeStatsYearly[sizeKey] || 0) + itemNet;
                }
            });
        });

        kpis.topBrands = Object.entries(brandStatsYearly)
            .map(([name, sales]) => ({ name, sales }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5);

        kpis.topSizes = Object.entries(sizeStatsYearly)
            .map(([size, sales]) => ({ size, sales }))
            .sort((a, b) => b.sales - a.sales);

        // EXTRA: Recalculate monthly profit for the KPI card from monthlyOrdersRes (FROM b7a4bb8)
        let monthlyProfit = 0;
        let monthlyCOGS = 0;
        sanitizedMonthlyOrders.forEach(order => {
            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
            let orderItemsCost = 0;
            let orderGrossSales = 0;

            items.forEach(item => {
                orderGrossSales += parseFloat(item.price || 0) * parseInt(item.quantity || 1);
            });

            const orderNetTotal = parseFloat(order.total_amount) || 0;
            const ratio = orderGrossSales > 0 ? (orderNetTotal / orderGrossSales) : 0;

            items.forEach(item => {
                let dbId = item.id;
                if (typeof dbId === 'string' && dbId.includes('-')) {
                    dbId = parseInt(dbId.split('-')[0]);
                }
                const prodInfo = productMap[dbId];
                const soldSize = parseFloat(item.size || 2);
                const quantity = parseInt(item.quantity || 1);
                if (prodInfo && prodInfo.size > 0) {
                    orderItemsCost += (prodInfo.cost / prodInfo.size) * soldSize * quantity;
                }
            });
            monthlyProfit += (orderNetTotal - orderItemsCost);
            monthlyCOGS += orderItemsCost;
        });

        monthlyProfit -= totalMonthlyExpenses;
        kpis.monthlyProfit = Math.round(monthlyProfit);
        kpis.monthlyCOGS = Math.round(monthlyCOGS);


        // Chart Mapping (Common Loop)
        for (let i = 1; i <= daysInMonth; i++) {
            // Users
            const curUserDay = sanitizedUserCurrentMonth.find(r => Number(r.day) === i);
            const prevUserDay = sanitizedUserPrevMonth.find(r => Number(r.day) === i);
            usersChartData.push({
                day: i,
                current: curUserDay ? Number(curUserDay.count) : 0,
                previous: prevUserDay ? Number(prevUserDay.count) : 0
            });

            // Orders/Revenue
            const curOrd = sanitizedCurrentMonth.find(r => parseInt(r.day) === i);
            const prevOrd = sanitizedPrevMonth.find(r => parseInt(r.day) === i);

            // Visits
            const curVis = sanitizedCurrentMonthVisits.find(r => parseInt(r.day) === i);
            const prevVis = sanitizedPrevMonthVisits.find(r => parseInt(r.day) === i);

            kpis.visitsChartData.push({
                day: i,
                current: curVis ? parseInt(curVis.count) : 0,
                previous: prevVis ? parseInt(prevVis.count) : 0
            });

            kpis.orderChartData.push({
                day: i,
                current: curOrd ? parseInt(curOrd.orders) : 0,
                previous: prevOrd ? parseInt(prevOrd.orders) : 0
            });

            kpis.revenueChartData.push({
                day: i,
                current: curOrd ? parseFloat(curOrd.revenue || 0) : 0,
                previous: prevOrd ? parseFloat(prevOrd.revenue || 0) : 0
            });
        }

        // Inventory Forecast Logic (Sync)
        try {
            const sizeConsumption = { '2': 0, '5': 0, '10': 0, '11': 0 };
            sanitizedLast30Days.forEach(order => {
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
                    name: `בקבוק ${inv.size} מ"ל`,
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
        // Page renders with whatever kpis initialized
    }
    // No finally{client.release()} needed! pool.query handles it.

    // Use the already defined currentMonthLabel or currentYearLabel as needed

    return (
        <div className="pb-8">
            <div className="relative flex flex-col md:flex-row justify-center items-center mb-8 mt-4 md:mt-0 gap-6">
                <div className="md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2 w-full md:w-auto text-right">
                    <h1 className="text-3xl font-bold">לוח בקרה</h1>
                </div>
                
                {/* Global Month Navigation */}
                <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 z-10 w-full md:w-auto justify-center">
                    <Link 
                        href={`/admin?year=${prevNavYear}&month=${prevNavMonth}`} 
                        prefetch={true} 
                        className="p-2 hover:bg-gray-50 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                        title="חודש קודם"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Link>
                    
                    <div className="text-base font-bold text-gray-800 min-w-[120px] text-center">
                        {currentMonthLabel} {year}
                    </div>

                    {hasNextMonth ? (
                        <Link 
                            href={`/admin?year=${nextNavYear}&month=${nextNavMonth}`} 
                            prefetch={true} 
                            className="p-2 hover:bg-gray-50 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                            title="חודש הבא"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                    ) : (
                        <div className="p-2 rounded-lg text-gray-200">
                            <ChevronLeft className="w-5 h-5" />
                        </div>
                    )}
                </div>
            </div>

            <DashboardCharts
                orderData={kpis.orderChartData}
                revenueData={kpis.revenueChartData}
                visitsData={kpis.visitsChartData}
                usersData={usersChartData || []}
                cumulativeData={kpis.cumulativeRevenueData}
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
                            תזרים
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
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <span className="text-orange-600 font-bold text-xs md:text-sm">עלויות בשמים</span>
                            <div className="text-right">
                                <span className="text-lg md:text-xl font-bold text-orange-700">
                                    <span dir="ltr" className="inline-block">{kpis.monthlyCOGS ? kpis.monthlyCOGS.toLocaleString() : '0'}</span> ₪
                                </span>
                            </div>
                        </div>
                        
                        <div className="pt-2">
                            <div className="flex justify-between items-center bg-gray-50/50 p-2 rounded-xl mb-2">
                                <span className={`${kpis.monthlyProfit < 0 ? 'text-red-600' : 'text-green-600'} font-bold text-sm`}>רווח החודש</span>
                                <div className="text-right">
                                    <span className={`text-xl font-bold ${kpis.monthlyProfit < 0 ? 'text-red-700' : 'text-green-700'}`}>
                                        <span dir="ltr" className="inline-block">{kpis.monthlyProfit.toLocaleString()}</span> ₪
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center px-1">
                                <span className="text-gray-400 font-bold text-[10px]">רווח מצטבר (כלל המערכת)</span>
                                <div className="text-right">
                                    <span className={`text-xs font-bold ${kpis.cumulativeProfit < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        <span dir="ltr" className="inline-block">{kpis.cumulativeProfit ? kpis.cumulativeProfit.toLocaleString() : '0'}</span> ₪
                                    </span>
                                </div>
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
                            מלאי בקבוקים פנוי
                        </div>
                    </div>

                    <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-4xl font-bold text-gray-900">
                            {kpis.bottleInventory.reduce((acc, item) => acc + parseInt(item.quantity || 0), 0)}
                        </span>
                        <span className="text-xs text-gray-400 font-bold uppercase">בקבוקים</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {kpis.bottleInventory && kpis.bottleInventory.map(item => {
                            const qty = parseInt(item.quantity || 0);
                            const sizeLabel = item.size === 11 ? '10 מ"ל יוקרתי' : `${item.size} מ"ל`;
                            
                            // 3-tier color logic: 0-10 Red, 10-20 Orange, 20+ Green
                            let theme = '';
                            if (qty <= 10) {
                                theme = 'bg-red-50/50 border-red-200 text-red-700 animate-pulse-subtle';
                            } else if (qty <= 20) {
                                theme = 'bg-amber-50/50 border-amber-200 text-amber-700';
                            } else {
                                theme = 'bg-emerald-50/60 border-emerald-200 text-emerald-700';
                            }

                            return (
                                <div key={item.size} className={`flex flex-col items-center p-2 rounded-xl border ${theme}`}>
                                    <span className="text-[9px] font-bold mb-1">{sizeLabel}</span>
                                    <span className="font-black text-base leading-none">
                                        {qty}
                                    </span>
                                </div>
                            );
                        })}
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
                            <span className="text-[10px] text-purple-600 font-bold mb-1">2 מ"ל</span>
                            <span className="font-black text-base text-purple-800 leading-none">{kpis.samplesBreakdown['2']}</span>
                        </div>
                        <div className="flex flex-col items-center bg-pink-50/50 p-2 rounded-xl border border-pink-100">
                            <span className="text-[10px] text-pink-600 font-bold mb-1">5 מ"ל</span>
                            <span className="font-black text-base text-pink-800 leading-none">{kpis.samplesBreakdown['5']}</span>
                        </div>
                        <div className="flex flex-col items-center bg-blue-50/50 p-2 rounded-xl border border-blue-100">
                            <span className="text-[10px] text-blue-600 font-bold mb-1">10 מ"ל</span>
                            <span className="font-black text-base text-blue-800 leading-none">{kpis.samplesBreakdown['10']}</span>
                        </div>
                        <div className="flex flex-col items-center bg-amber-50/50 p-2 rounded-xl border border-amber-100">
                            <span className="text-[10px] text-amber-600 font-bold mb-1">10 מ"ל יוקרתי</span>
                            <span className="font-black text-base text-amber-800 leading-none">{kpis.samplesBreakdown['11']}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Operational KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-4 mb-8">
                {/* Total Orders */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                    <div className="text-gray-500 text-[10px] font-bold uppercase mb-2 flex items-center gap-2">
                        <ShoppingCart className="w-3.5 h-3.5 text-blue-500" />
                        סה"כ הזמנות
                    </div>
                    <div className="text-2xl font-bold mb-2">{kpis.totalOrders}</div>
                    <div className="border-t border-gray-50 pt-2 mt-2">
                        <Link href="/admin/orders" className="text-[10px] text-blue-500 hover:underline font-bold transition-all">לניהול הזמנות ←</Link>
                    </div>
                </div>

                {/* Site Visits */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 to-indigo-400"></div>
                    <div className="text-gray-500 text-[10px] font-bold uppercase mb-2 flex items-center gap-2">
                        <Eye className="w-3.5 h-3.5 text-sky-500" />
                        כניסות לאתר
                    </div>
                    <div className="text-2xl font-bold mb-2 text-gray-900">
                        {kpis.monthlyVisits}
                    </div>
                    <div className="text-[9px] text-gray-400 font-medium italic">נספר לפי ביקורים ייחודיים</div>
                </div>

                {/* Registered Users */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                    <div className="text-gray-500 text-[10px] font-bold uppercase mb-2 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        משתמשים רשומים
                    </div>
                    <div className="text-2xl font-bold mb-2 text-gray-900">{kpis.totalUsers}</div>
                    <div className="border-t border-gray-50 pt-2 mt-2">
                        <Link href="/admin/users" className="text-[10px] text-blue-500 hover:underline font-bold transition-all">לניהול משתמשים ←</Link>
                    </div>
                </div>

                {/* AOV Card */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                    <div className="text-gray-500 text-[10px] font-bold uppercase mb-2 flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                        סל ממוצע (AOV)
                    </div>
                    <div className="text-2xl font-bold mb-2 text-gray-900">
                        {Math.round(kpis.avgOrderValue || 0).toLocaleString()} ₪
                    </div>
                    <div className="text-[9px] text-gray-400 font-medium italic">מחושב לפי כל ההזמנות במערכת</div>
                </div>

                {/* Cumulative Sales Total Card */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
                    <div className="text-gray-500 text-[10px] font-bold uppercase mb-2 flex items-center gap-2">
                        <ShoppingCart className="w-3.5 h-3.5 text-indigo-600" />
                        מכירות מצטברות
                    </div>
                    <div className="text-2xl font-bold mb-2 text-gray-900">
                        {Math.round(kpis.totalRevenueAllTime || 0).toLocaleString()} ₪
                    </div>
                    <div className="text-[9px] text-gray-400 font-medium italic">מרגע פתיחת האתר</div>
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
