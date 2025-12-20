import pool from "@/app/lib/db";
import Link from "next/link";
import DashboardCharts from "../components/admin/DashboardCharts";
import AnalyticsTables from "../components/admin/AnalyticsTables";

export const dynamic = 'force-dynamic';

import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";


export const metadata = {
    title: "ניהול ראשי | ml_tlv",
    robots: "noindex, nofollow",
};

export default async function AdminDashboard() {
    // RBAC: Warehouse Redirect
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    if (role === 'warehouse') {
        redirect("/admin/orders");
    }

    const client = await pool.connect();

    let kpis = {
        totalOrders: 0,
        totalRevenue: 0,
        totalUsers: 0,
        orderChartData: [],
        revenueChartData: [],
        topBrands: [],
        topSizes: [],
        monthlyProfit: 0,
        visitsChartData: []
    };


    try {
        // KPI Queries
        const ordersRes = await client.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5');
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
                OR item->>'size' IN ('2', '5', '10')
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
                OR item->>'size' IN ('2', '5', '10')
             )
             GROUP BY size
        `);
        kpis.samplesBreakdown = { '2': 0, '5': 0, '10': 0 };
        samplesBreakdownRes.rows.forEach(r => {
            // Clean size string (remove 'ml' etc if exists, though data seems to be clean numbers per previous steps)
            const sizeKey = r.size?.replace(/[^0-9]/g, '');
            if (kpis.samplesBreakdown[sizeKey] !== undefined) {
                kpis.samplesBreakdown[sizeKey] += parseInt(r.count || 0);
            }
        });


        // Fetch Expenses
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
            // Logic: Any yearly expense is divided by 12 and applied to each month.
            // Assumption: Yearly expenses apply indefinitely or we strictly look at "active" ones?
            // Simplified User Request: "If expense is yearly, divide amount by 12 and clean from each month".
            // Implementation: Sum ALL yearly expenses and divide by 12.
            // Or better: Sum yearly expenses from THIS YEAR? User said "yearly", implying recurring.
            // Let's take all 'yearly' expenses created in the last 12 months? Or just all 'yearly'?
            // Given "Management table where I insert expenses", likely he inserts "Insurance 2024" as yearly.
            // Let's fetch ALL yearly expenses and divide by 12.
            const yearlyExpRes = await client.query("SELECT SUM(amount) FROM expenses WHERE type = 'yearly'");
            const yearlySum = parseFloat(yearlyExpRes.rows[0].sum || 0);

            totalMonthlyExpenses = monthlySum + (yearlySum / 12);
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


        // Fetch Users Count from Clerk
        try {
            const clerk = await clerkClient();
            const { totalCount } = await clerk.users.getUserList({ limit: 1 });
            kpis.totalUsers = totalCount;
        } catch (e) {
            console.warn("Failed to fetch Clerk users count:", e);
            kpis.totalUsers = 0;
        }

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
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

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

        const prevDate = new Date();
        prevDate.setMonth(prevDate.getMonth() - 1);
        const prevYear = prevDate.getFullYear();
        const prevMonth = prevDate.getMonth() + 1;

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
        const currentMonthVisitsRes = await client.query(`
            SELECT 
                EXTRACT(DAY FROM created_at) as day,
                COUNT(*) as count
            FROM site_visits
            WHERE EXTRACT(MONTH FROM created_at) = $1
            AND EXTRACT(YEAR FROM created_at) = $2
            GROUP BY day
            ORDER BY day
        `, [month, year]);

        const prevMonthVisitsRes = await client.query(`
            SELECT 
                EXTRACT(DAY FROM created_at) as day,
                COUNT(*) as count
            FROM site_visits
            WHERE EXTRACT(MONTH FROM created_at) = $1
            AND EXTRACT(YEAR FROM created_at) = $2
            GROUP BY day
            ORDER BY day
        `, [prevMonth, prevYear]);


        const daysInMonth = new Date(year, month, 0).getDate();
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

    } finally {
        client.release();
    }

    const currentMonthLabel = new Date().toLocaleString('he-IL', { month: 'long' });

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">לוח בקרה</h1>

            <DashboardCharts
                orderData={kpis.orderChartData}
                revenueData={kpis.revenueChartData}
                visitsData={kpis.visitsChartData}
            />


            <AnalyticsTables
                topBrands={kpis.topBrands}
                topSizes={kpis.topSizes}
                monthName={currentMonthLabel}
            />

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-gray-500 text-sm font-bold uppercase">תזרים ({currentMonthLabel})</div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <span className="text-blue-600 font-bold">הכנסות</span>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-blue-700 dir-ltr">{kpis.totalRevenue} ₪</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <span className="text-red-600 font-bold">הוצאות</span>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-red-700 dir-ltr">{kpis.totalExpenses} ₪</span>
                                <div className="text-[10px] text-gray-400">כולל יחסי שנתי</div>
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

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                    <div>
                        <div className="text-gray-500 text-sm font-bold uppercase mb-2">מלאי בקבוקנים (פנוי)</div>
                        <div className="space-y-3 mt-4">
                            {/* Inventory Summary */}
                            {kpis.bottleInventory && kpis.bottleInventory.map(item => (
                                <div key={item.size} className="flex justify-between items-center border-b border-gray-50 pb-1">
                                    <span className="font-bold text-gray-700">{item.size === 11 ? '10 מ"ל יוקרתי' : `${item.size} מ"ל`}</span>
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
                    <div className="text-xs text-gray-400 mt-2 text-center">
                        <Link href="/admin/inventory" className="text-blue-500 hover:underline">לניהול המלאי המלא</Link>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                    <div>
                        <div className="text-gray-500 text-sm font-bold uppercase mb-2">דוגמיות שנמכרו</div>
                        <div className="text-4xl font-bold mb-4">{kpis.totalSamples}</div>
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded w-full">
                        <div className="flex justify-between mb-1"><span>2 מ״ל:</span> <span className="font-bold text-black">{kpis.samplesBreakdown['2']}</span></div>
                        <div className="flex justify-between mb-1"><span>5 מ״ל:</span> <span className="font-bold text-black">{kpis.samplesBreakdown['5']}</span></div>
                        <div className="flex justify-between"><span>10 מ״ל:</span> <span className="font-bold text-black">{kpis.samplesBreakdown['10']}</span></div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-gray-500 text-sm font-bold uppercase mb-2">הזמנות סה״כ</div>
                    <div className="text-3xl font-bold">{kpis.totalOrders}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-gray-500 text-sm font-bold uppercase mb-2">כניסות לאתר</div>
                    <div className="text-xl font-bold">חודש {currentMonthLabel}: <span className="text-blue-600">{kpis.monthlyVisits}</span> כניסות</div>
                    <div className="text-xs text-gray-400 mt-1">נספר לפי ביקורים ייחודיים</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-gray-500 text-sm font-bold uppercase mb-2">משתמשים רשומים</div>
                    <div className="text-3xl font-bold">{kpis.totalUsers}</div>
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
                    <h3 className="font-bold">קופונים אחרונים (עגלות נטושות)</h3>
                    <Link href="/admin/coupons" className="text-blue-600 text-sm hover:underline">לניהול קופונים מלא &gt;</Link>
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
