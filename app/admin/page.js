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
    // Moved auth check inside try block for safety
    let user = null;
    let role = null;

    let client = null;

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
        samplesBreakdown: { '2': 0, '5': 0, '10': 0, '11': 0 }
    };


    try {
        // Safe Auth Check
        user = await currentUser();
        role = user?.publicMetadata?.role;
        if (role === 'warehouse') {
            redirect("/admin/orders");
        }

        client = await pool.connect();

        // KPI Queries
        const ordersRes = await client.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 3');
        kpis.recentOrders = ordersRes.rows;

        const countRes = await client.query('SELECT COUNT(*) FROM orders');
        kpis.totalOrders = parseInt(countRes.rows[0].count);

        const revRes = await client.query(`
            SELECT SUM(total_amount) FROM orders 
            WHERE status != 'cancelled'
            AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        `);
        kpis.totalRevenue = parseInt(revRes.rows[0].sum || 0);

        const samplesSoldRes = await client.query(`
             SELECT SUM((item->>'quantity')::int) as count 
             FROM orders, jsonb_array_elements(items::jsonb) as item 
             WHERE orders.status != 'cancelled' 
             AND (
                item->>'name' LIKE '%דוגמית%' 
                OR item->>'name' ILIKE '%sample%'
                OR item->>'size' IN ('2', '5', '10', '11')
             )
        `);
        kpis.totalSamples = parseInt(samplesSoldRes.rows[0].count || 0);

        // Fetch Samples Breakdown (2ml, 5ml, 10ml)
        const samplesBreakdownRes = await client.query(`
             SELECT item->>'size' as size, SUM((item->>'quantity')::int) as count 
             FROM orders, jsonb_array_elements(items::jsonb) as item 
             WHERE orders.status != 'cancelled' 
             AND (
                item->>'name' LIKE '%דוגמית%' 
                OR item->>'name' ILIKE '%sample%'
                OR item->>'size' IN ('2', '5', '10', '11')
             )
             GROUP BY size
        `);
        kpis.samplesBreakdown = { '2': 0, '5': 0, '10': 0, '11': 0 };
        samplesBreakdownRes.rows.forEach(r => {
            // Clean size string (remove 'ml' etc if exists, though data seems to be clean numbers per previous steps)
            const sizeKey = r.size?.replace(/[^0-9]/g, '');
            if (kpis.samplesBreakdown[sizeKey] !== undefined) {
                kpis.samplesBreakdown[sizeKey] += parseInt(r.count || 0);
            }
        });


        // Date Handling for Charts & Stats
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        // Previous Month Calculation
        const prevDate = new Date();
        prevDate.setMonth(prevDate.getMonth() - 1);
        const prevYear = prevDate.getFullYear();
        const prevMonth = prevDate.getMonth() + 1;

        const daysInMonth = new Date(year, month, 0).getDate();

        // 1. Fetch Expenses
        let totalMonthlyExpenses = 0;
        try {
            // Get monthly expenses for CURRENT MONTH
            const monthlyExpRes = await client.query(`
                SELECT SUM(amount) FROM expenses 
                WHERE type = 'monthly'
                AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
            `);
            const monthlySum = parseFloat(monthlyExpRes.rows[0].sum || 0);

            // Get yearly expenses (amortized)
            const yearlyExpRes = await client.query("SELECT SUM(amount) FROM expenses WHERE type = 'yearly'");
            const yearlySum = parseFloat(yearlyExpRes.rows[0].sum || 0);

            totalMonthlyExpenses = monthlySum + (yearlySum / 12);
        } catch (e) {
            console.warn("Expenses query failed:", e);
        }

        // Fetch Bottle Inventory Summary
        try {
            const bottleInvRes = await client.query('SELECT size, quantity FROM bottle_inventory ORDER BY size ASC');
            kpis.bottleInventory = bottleInvRes.rows;
        } catch (e) {
            console.warn("Bottle Inventory query failed:", e);
            kpis.bottleInventory = [];
        }


        // Fetch Users Count & Chart Data from Clerk
        // Fetch Users Count & Chart Data from Clerk
        // Fetch Users Count & Chart Data
        // Initialize with safe default structure (31 days of zeros) to prevent undefined/null errors downstream
        let usersChartData = Array.from({ length: 31 }, (_, i) => ({ day: i + 1, current: 0, previous: 0 }));

        try {
            // Restore Total Users Count
            const countResUsers = await client.query('SELECT COUNT(*) FROM users');
            kpis.totalUsers = countResUsers.rows[0]?.count ? Number(countResUsers.rows[0].count) : 0;

            console.log("Fetching User Chart Data...");

            // Fetch Current Month
            const userCurrentMonthRes = await client.query(`
                SELECT 
                    EXTRACT(DAY FROM created_at) as day,
                    COUNT(*) as count
                FROM users
                WHERE EXTRACT(MONTH FROM created_at) = $1
                AND EXTRACT(YEAR FROM created_at) = $2
                GROUP BY day
            `, [month, year]);

            // Fetch Previous Month
            const userPrevMonthRes = await client.query(`
                SELECT 
                    EXTRACT(DAY FROM created_at) as day,
                    COUNT(*) as count
                FROM users
                WHERE EXTRACT(MONTH FROM created_at) = $1
                AND EXTRACT(YEAR FROM created_at) = $2
                GROUP BY day
            `, [prevMonth, prevYear]);

            // Map results to chart data
            usersChartData = usersChartData.map(item => {
                const dayMatch = userCurrentMonthRes.rows.find(r => Number(r.day) === item.day);
                const prevMatch = userPrevMonthRes.rows.find(r => Number(r.day) === item.day);

                return {
                    day: item.day,
                    current: dayMatch ? Number(dayMatch.count) : 0,
                    previous: prevMatch ? Number(prevMatch.count) : 0
                };
            });
            console.log("✅ User chart data processed successfully");

        } catch (procErr) {
            console.error("❌ CRITICAL ERROR PROCESSING USER CHART:", procErr);
            // On error, usersChartData remains the safe zero-filled array created at start
            kpis.totalUsers = kpis.totalUsers || 0;
        }

        // Inventory Forecasting Logic
        let forecasts = [];
        try {
            // Get Sales for last 30 days
            const last30DaysRes = await client.query(`
                SELECT items FROM orders 
                WHERE status != 'cancelled' 
                AND created_at > NOW() - INTERVAL '30 days'
            `);

            // Calculate Daily Consumption Rate per Size
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

            // Calculate Days Left
            (kpis.bottleInventory || []).forEach(inv => {
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
            console.warn("Forecast calculation failed", fcErr);
        }

        // ... Existing Monthly Profit Calculation ... 

        // Update DashboardCharts props below


        // Monthly Profit Calculation
        const brandStats = {};
        const sizeStats = {};
        try {
            const monthlyOrdersRes = await client.query(`
                SELECT total_amount, items FROM orders 
                WHERE status != 'cancelled' 
                AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
            `);

            const productsRes = await client.query('SELECT id, cost_price, original_size FROM products');
            const productMap = {};
            productsRes.rows.forEach(p => {
                productMap[p.id] = {
                    cost: parseFloat(p.cost_price || 0),
                    size: parseFloat(p.original_size || 100)
                };
            });

            let monthlyProfit = 0;
            // Removed scope-local stats

            monthlyOrdersRes.rows.forEach(order => {
                const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                let orderItemsCost = 0;
                let orderGrossSales = 0;

                // 1. Calculate Gross Sales for this order (to find discount ratio)
                items.forEach(item => {
                    const price = parseFloat(item.price || 0);
                    const quantity = parseInt(item.quantity || 1);
                    orderGrossSales += price * quantity;
                });

                // 2. Calculate Discount Ratio (Net / Gross)
                // If Gross is 0, ratio is 0. If Total > Gross (e.g. shipping), ratio > 1 (distributes shipping).
                // If Total < Gross (coupon), ratio < 1.
                const orderNetTotal = parseFloat(order.total_amount) || 0;
                const ratio = orderGrossSales > 0 ? (orderNetTotal / orderGrossSales) : 0;

                // 3. Process Items for Profit & Stats
                items.forEach(item => {
                    // Profit Cost Logic
                    let dbId = item.id;
                    if (typeof dbId === 'string' && dbId.includes('-')) {
                        dbId = parseInt(dbId.split('-')[0]);
                    }

                    const prodInfo = productMap[dbId];
                    const soldSize = parseFloat(item.size || 2);
                    const quantity = parseInt(item.quantity || 1);

                    if (prodInfo && prodInfo.size > 0) {
                        const itemCost = (prodInfo.cost / prodInfo.size) * soldSize * quantity;
                        orderItemsCost += itemCost;
                    }

                    // Aggregations (Net Sales)
                    const itemGross = parseFloat(item.price || 0) * quantity;
                    const itemNet = itemGross * ratio;

                    // Brand Stats
                    if (item.brand) {
                        if (!brandStats[item.brand]) brandStats[item.brand] = 0;
                        brandStats[item.brand] += itemNet;
                    }

                    // Size Stats
                    if (item.size) {
                        // Normalize size key (remove letters if any, though likely clean)
                        const sizeKey = item.size.toString();
                        if (!sizeStats[sizeKey]) sizeStats[sizeKey] = 0;
                        sizeStats[sizeKey] += itemNet;
                    }
                });

                // Profit of this order
                const orderProfit = orderNetTotal - orderItemsCost;
                monthlyProfit += orderProfit;
            });

            // Deduct Expenses from Profit
            monthlyProfit -= totalMonthlyExpenses;

            kpis.monthlyProfit = Math.round(monthlyProfit);
            kpis.totalExpenses = Math.round(totalMonthlyExpenses);

        } catch (profitErr) {
            console.error("Profit calculation failed:", profitErr);
            kpis.monthlyProfit = 0;
        }

        // Analytics: Monthly Visits
        try {
            const visitsRes = await client.query(`
                SELECT COUNT(*) FROM site_visits 
                WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) 
                AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
            `);
            kpis.monthlyVisits = parseInt(visitsRes.rows[0].count || 0);
        } catch (err) {
            console.warn("Analytics query failed (table might be missing):", err.message);
            kpis.monthlyVisits = 0;
        }

        // Chart Data Calculation


        const currentMonthRes = await client.query(`
            SELECT 
                EXTRACT(DAY FROM created_at) as day,
                COUNT(*) as orders,
                SUM(total_amount) as revenue
            FROM orders
            WHERE status != 'cancelled'
            AND EXTRACT(MONTH FROM created_at) = $1
            AND EXTRACT(YEAR FROM created_at) = $2
            GROUP BY day
            ORDER BY day
        `, [month, year]);



        const prevMonthRes = await client.query(`
            SELECT 
                EXTRACT(DAY FROM created_at) as day,
                COUNT(*) as orders,
                SUM(total_amount) as revenue
            FROM orders
            WHERE status != 'cancelled'
            AND EXTRACT(MONTH FROM created_at) = $1
            AND EXTRACT(YEAR FROM created_at) = $2
            GROUP BY day
            ORDER BY day
        `, [prevMonth, prevYear]);

        // Visits Chart Data Fetching
        let currentMonthVisitsRes = { rows: [] };
        let prevMonthVisitsRes = { rows: [] };
        try {
            currentMonthVisitsRes = await client.query(`
                SELECT 
                    EXTRACT(DAY FROM created_at) as day,
                    COUNT(*) as count
                FROM site_visits
                WHERE EXTRACT(MONTH FROM created_at) = $1
                AND EXTRACT(YEAR FROM created_at) = $2
                GROUP BY day
                ORDER BY day
            `, [month, year]);

            prevMonthVisitsRes = await client.query(`
                SELECT 
                    EXTRACT(DAY FROM created_at) as day,
                    COUNT(*) as count
                FROM site_visits
                WHERE EXTRACT(MONTH FROM created_at) = $1
                AND EXTRACT(YEAR FROM created_at) = $2
                GROUP BY day
                ORDER BY day
            `, [prevMonth, prevYear]);
        } catch (e) {
            console.warn("Failed to fetch visits for chart:", e);
        }



        for (let i = 1; i <= daysInMonth; i++) {
            const curDay = currentMonthRes.rows.find(r => parseInt(r.day) === i);
            const prevDay = prevMonthRes.rows.find(r => parseInt(r.day) === i);

            const curVisits = currentMonthVisitsRes.rows.find(r => parseInt(r.day) === i);
            const prevVisits = prevMonthVisitsRes.rows.find(r => parseInt(r.day) === i);

            kpis.visitsChartData.push({
                day: i,
                current: curVisits ? parseInt(curVisits.count) : 0,
                previous: prevVisits ? parseInt(prevVisits.count) : 0
            });


            kpis.orderChartData.push({
                day: i,
                current: curDay ? parseInt(curDay.orders) : 0,
                previous: prevDay ? parseInt(prevDay.orders) : 0
            });

            kpis.revenueChartData.push({
                day: i,
                current: curDay ? parseFloat(curDay.revenue || 0) : 0,
                previous: prevDay ? parseFloat(prevDay.revenue || 0) : 0
            });
        }

        // Top Brands Processing (from JS aggregation)
        kpis.topBrands = Object.entries(brandStats)
            .map(([name, sales]) => ({ name, sales }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5);

        // Top Sizes Processing (from JS aggregation)
        kpis.topSizes = Object.entries(sizeStats)
            .map(([size, sales]) => ({ size, sales }))
            .sort((a, b) => b.sales - a.sales);

        // Coupons
        try {
            const couponsRes = await client.query(`
                SELECT * FROM coupons 
                WHERE status = 'active' 
                AND (expires_at IS NULL OR expires_at > NOW())
                ORDER BY created_at DESC 
                LIMIT 20
            `);
            kpis.recentCoupons = couponsRes.rows;
        } catch (e) {
            console.warn("Coupons query failed", e);
            kpis.recentCoupons = [];
        }

    } catch (err) {
        // Rethrow redirect errors (Next.js internals)
        if (err.digest?.startsWith('NEXT_REDIRECT')) {
            throw err;
        }
        console.error("Critical Admin Dashboard Error:", err);
        // Error is caught, page will render with default/partial kpis
    } finally {
        if (client) {
            client.release();
        }
    }

    const currentMonthLabel = new Date().toLocaleString('he-IL', { month: 'long' });

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">לוח בקרה</h1>

            {/* <InventoryForecast forecasts={forecasts} /> */}

            <DashboardCharts
                orderData={kpis.orderChartData}
                revenueData={kpis.revenueChartData}
                visitsData={kpis.visitsChartData}
                usersData={[]} // Temporarily DISABLING User Chart to fix 500 Crash
            />


            <AnalyticsTables
                topBrands={kpis.topBrands}
                topSizes={kpis.topSizes}
                monthName={currentMonthLabel}
            />

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

                {/* Cash Flow */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="text-gray-500 text-sm font-bold uppercase flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-green-500" />
                            תזרים ({currentMonthLabel})
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <span className="text-blue-600 font-bold text-sm">הכנסות</span>
                            <div className="text-right">
                                <span className="text-xl font-bold text-blue-700 dir-ltr">{kpis.totalRevenue} ₪</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <span className="text-red-600 font-bold text-sm">הוצאות</span>
                            <div className="text-right">
                                <span className="text-xl font-bold text-red-700 dir-ltr">{kpis.totalExpenses} ₪</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                            <span className={`${kpis.monthlyProfit < 0 ? 'text-red-600' : 'text-green-600'} font-bold`}>רווח</span>
                            <div className="text-right">
                                <span className={`text-2xl font-bold ${kpis.monthlyProfit < 0 ? 'text-red-700' : 'text-green-700'} dir-ltr`}>
                                    {kpis.monthlyProfit < 0 ? '-' : ''}{Math.abs(kpis.monthlyProfit)} ₪
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-2 text-[10px] text-gray-400 text-center">
                        * הכנסות נטו (אחרי הנחות) פחות עלות סחורה שנמכרה והוצאות
                    </div>
                </div>

                {/* Bottle Inventory */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden group hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
                    <div>
                        <div className="text-gray-500 text-sm font-bold uppercase mb-4 flex items-center gap-2">
                            <Package className="w-4 h-4 text-amber-500" />
                            מלאי בקבוקנים (פנוי)
                        </div>
                        <div className="space-y-3">
                            {kpis.bottleInventory && kpis.bottleInventory.map(item => (
                                <div key={item.size} className="flex justify-between items-center border-b border-gray-50 pb-1 last:border-0">
                                    <span className="font-bold text-gray-700 text-sm">{item.size === 11 ? '10 מ"ל יוקרתי' : `${item.size} מ"ל`}</span>
                                    <span className={`font-mono font-bold ${item.quantity < 20 ? 'text-red-600' : 'text-green-600'}`}>
                                        {item.quantity}
                                    </span>
                                </div>
                            ))}
                            {(!kpis.bottleInventory || kpis.bottleInventory.length === 0) && (
                                <div className="text-center text-gray-400 text-sm">אין נתונים</div>
                            )}
                        </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-4 text-center border-t pt-2">
                        <Link href="/admin/inventory" className="text-blue-500 hover:text-blue-600 hover:underline transition-colors">לניהול המלאי המלא</Link>
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

                    <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-4xl font-bold text-gray-900">{kpis.totalSamples}</span>
                        <span className="text-xs text-gray-400 font-medium">יחידות</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col items-center bg-purple-50 p-2 rounded-lg border border-purple-100">
                            <span className="text-[10px] text-purple-600 font-bold mb-1">2 מ״ל</span>
                            <span className="font-black text-lg text-purple-800 leading-none">{kpis.samplesBreakdown['2']}</span>
                        </div>
                        <div className="flex flex-col items-center bg-pink-50 p-2 rounded-lg border border-pink-100">
                            <span className="text-[10px] text-pink-600 font-bold mb-1">5 מ״ל</span>
                            <span className="font-black text-lg text-pink-800 leading-none">{kpis.samplesBreakdown['5']}</span>
                        </div>
                        <div className="flex flex-col items-center bg-blue-50 p-2 rounded-lg border border-blue-100">
                            <span className="text-[10px] text-blue-600 font-bold mb-1">10 מ״ל</span>
                            <span className="font-black text-lg text-blue-800 leading-none">{kpis.samplesBreakdown['10']}</span>
                        </div>
                        <div className="flex flex-col items-center bg-amber-50 p-2 rounded-lg border border-amber-100">
                            <span className="text-[10px] text-amber-600 font-bold mb-1">10 מ״ל יוקרתי</span>
                            <span className="font-black text-lg text-amber-800 leading-none">{kpis.samplesBreakdown['11']}</span>
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
                    <div className="text-xs text-center border-t pt-2 mt-2">
                        <Link href="/admin/orders" className="text-blue-500 hover:text-blue-600 hover:underline transition-colors">לניהול הזמנות</Link>
                    </div>
                </div>

                {/* Site Visits */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 to-indigo-400"></div>
                    <div className="text-gray-500 text-sm font-bold uppercase mb-2 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-sky-500" />
                        כניסות לאתר
                    </div>
                    <div className="text-xl font-bold mb-1">חודש {currentMonthLabel}: <span className="text-blue-600">{kpis.monthlyVisits}</span> כניסות</div>
                    <div className="text-xs text-gray-400">נספר לפי ביקורים ייחודיים</div>
                </div>

                {/* Registered Users */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                    <div className="text-gray-500 text-sm font-bold uppercase mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-500" />
                        משתמשים רשומים
                    </div>
                    <div className="text-3xl font-bold mb-4">{kpis.totalUsers}</div>
                    <div className="text-xs text-center border-t pt-2 mt-2">
                        <Link href="/admin/users" className="text-blue-500 hover:text-blue-600 hover:underline transition-colors">לניהול משתמשים</Link>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="font-bold">הזמנות אחרונות</h3>
                    <Link href="/admin/orders" className="text-blue-600 text-sm hover:underline">לכל ההזמנות</Link>
                </div>
                <div className="divide-y">
                    {kpis.recentOrders.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            עדיין אין הזמנות...
                        </div>
                    ) : (
                        kpis.recentOrders.map(order => (
                            <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div>
                                    <div className="font-bold">הזמנה #{order.id}</div>
                                    <div className="text-sm text-gray-500">
                                        {order.customer_details?.name} • {new Date(order.created_at).toLocaleDateString('he-IL')}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold">{order.total_amount} ₪</div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'pending' ? 'bg-orange-100 text-orange-800' :
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
                    <h3 className="font-bold">קופונים אחרונים</h3>
                    <Link href="/admin/coupons" className="text-blue-600 text-sm hover:underline">לכל הקופונים</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right" dir="rtl">
                        <thead className="bg-gray-50 text-gray-500 text-sm">
                            <tr>
                                <th className="p-4 text-center">קוד</th>
                                <th className="p-4 text-center">הנחה</th>
                                <th className="p-4 text-center">מייל לקוח</th>
                                <th className="p-4 text-center">סטטוס</th>
                                <th className="p-4 text-center">נוצר בתאריך</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {kpis.recentCoupons && kpis.recentCoupons.map(coupon => {
                                const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
                                const displayStatus = isExpired ? 'expired' : coupon.status;

                                return (
                                    <tr key={coupon.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-mono font-bold text-blue-600 text-center">{coupon.code}</td>
                                        <td className="p-4 text-center">{coupon.discount_percent}%</td>
                                        <td className="p-4 text-sm text-center">{coupon.email || '-'}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs ${displayStatus === 'active' ? 'bg-green-100 text-green-800' :
                                                displayStatus === 'redeemed' ? 'bg-gray-800 text-white' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {displayStatus === 'active' ? 'פעיל' :
                                                    displayStatus === 'redeemed' ? 'מומש' : 'פג תוקף'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500 text-center">
                                            {new Date(coupon.created_at).toLocaleString('he-IL')}
                                        </td>
                                    </tr>
                                );
                            })}
                            {(!kpis.recentCoupons || kpis.recentCoupons.length === 0) && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">
                                        עדיין לא נוצרו קופונים...<br />
                                        <span className="text-xs">(הקופונים נוצרים אוטומטית כשהמערכת מזהה עגלה נטושה)</span>
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
