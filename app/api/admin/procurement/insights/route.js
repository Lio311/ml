import pool from "../../../../lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await currentUser();
        const role = user?.publicMetadata?.role;
        const email = user?.emailAddresses?.[0]?.emailAddress;
        
        const isAdmin = role === 'admin' || role === 'deputy' || email === process.env.ADMIN_EMAIL;
        
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const client = await pool.connect();
        try {
            // 1. Fetch all active products
            const productsRes = await client.query(`
                SELECT id, brand, model, name, brand_he, model_he, name_he,
                       stock, original_size, cost_price,
                       price_2ml, price_5ml, price_10ml,
                       top_notes, middle_notes, base_notes, image_url
                FROM products
                WHERE active = true
            `);
            const products = productsRes.rows;

            // 2. Fetch orders from the last 90 days
            const ordersRes = await client.query(`
                SELECT items, created_at
                FROM orders
                WHERE status != 'cancelled'
                AND created_at > NOW() - INTERVAL '90 days'
            `);
            const orders = ordersRes.rows;

            // 3. Process Sales Velocity
            // Map to store: productId -> { total_ml: 0, count: 0, revenue: 0, profit: 0 }
            const salesMap = {};
            
            orders.forEach(order => {
                const items = Array.isArray(order.items) ? order.items : [];
                items.forEach(item => {
                    const pid = item.id;
                    if (!pid) return;

                    if (!salesMap[pid]) {
                        salesMap[pid] = { total_ml: 0, count: 0, revenue: 0, profit: 0 };
                    }

                    const quantity = parseInt(item.quantity) || 0;
                    const size = parseFloat(String(item.size).replace(/[^\d.]/g, '')) || 0;
                    const price = parseFloat(item.price) || 0;
                    
                    const totalMl = size * quantity;
                    salesMap[pid].total_ml += totalMl;
                    salesMap[pid].count += quantity;
                    salesMap[pid].revenue += price * quantity;
                    
                    // Lookup cost price for profit calculation
                    const product = products.find(p => p.id === pid);
                    if (product && product.cost_price && product.original_size) {
                        const costPerMl = parseFloat(product.cost_price) / parseFloat(product.original_size);
                        const itemCost = costPerMl * totalMl;
                        salesMap[pid].profit += (price * quantity) - itemCost;
                    }
                });
            });

            // 4. Calculate Insights per Product
            const insights = products.map(p => {
                const sales = salesMap[p.id] || { total_ml: 0, count: 0, revenue: 0, profit: 0 };
                const velocity = sales.total_ml / 90; // ml per day
                const burnRate = velocity > 0 ? (p.stock / velocity) : null; // days until out of stock
                
                return {
                    id: p.id,
                    brand: p.brand,
                    model: p.model,
                    brand_he: p.brand_he,
                    model_he: p.model_he,
                    stock: p.stock,
                    velocity,
                    daysRemaining: burnRate,
                    revenue: sales.revenue,
                    profit: sales.profit,
                    volume: sales.total_ml,
                    top_notes: p.top_notes,
                    middle_notes: p.middle_notes,
                    base_notes: p.base_notes,
                    seasons: p.seasons,
                    image_url: p.image_url
                };
            });

            // 5. Aggregate Trend Intelligence (Notes)
            const notesStats = {};
            // New: Size analysis
            const sizeStats = { '2ml': 0, '5ml': 0, '10ml': 0 };
            // New: Seasonal analysis
            const seasonalStats = { 'Winter': 0, 'Summer': 0, 'Spring': 0, 'Autumn': 0 };

            insights.forEach(item => {
                if (item.volume <= 0) return;
                
                // Helper to get notes/seasons from different formats
                const processTags = (val) => {
                    if (Array.isArray(val)) return val;
                    if (typeof val === 'string') return val.split(',').map(n => n.trim());
                    return [];
                };

                const allNotes = [
                    ...processTags(item.top_notes),
                    ...processTags(item.middle_notes),
                    ...processTags(item.base_notes)
                ];
                
                allNotes.forEach(note => {
                    const normalized = (note || '').trim().toLowerCase();
                    if (!normalized || normalized === 'none') return;
                    if (!notesStats[normalized]) notesStats[normalized] = 0;
                    notesStats[normalized] += item.volume;
                });

                // Seasonal distribution
                const seasons = processTags(item.seasons);
                seasons.forEach(s => {
                    const capitalized = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
                    if (seasonalStats.hasOwnProperty(capitalized)) {
                        seasonalStats[capitalized] += item.revenue;
                    }
                });
            });

            const topNotes = Object.entries(notesStats)
                .map(([name, volume]) => ({ name, volume }))
                .sort((a, b) => b.volume - a.volume)
                .slice(0, 20);

            // New: Temporal Analysis (Time of Day / Day of Week)
            const daysOfWeek = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
            const hourlyStats = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, revenue: 0 }));
            const dailyStats = daysOfWeek.map(name => ({ name, revenue: 0 }));

            orders.forEach(order => {
                const date = new Date(order.created_at);
                const hour = date.getHours();
                const day = date.getDay();
                
                const total = Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity) || 0), 0) : 0;
                
                hourlyStats[hour].revenue += total;
                dailyStats[day].revenue += total;

                // Also aggregate size distribution from items
                const items = Array.isArray(order.items) ? order.items : [];
                items.forEach(it => {
                    const sizeKey = `${Math.round(parseFloat(it.size))}ml`;
                    if (sizeStats.hasOwnProperty(sizeKey)) {
                        sizeStats[sizeKey] += parseInt(it.quantity) || 0;
                    }
                });
            });

            // 6. Brand Performance
            const brandStats = {};
            insights.forEach(item => {
                if (!brandStats[item.brand]) {
                    brandStats[item.brand] = { revenue: 0, profit: 0, volume: 0, itemsCount: 0 };
                }
                brandStats[item.brand].revenue += item.revenue;
                brandStats[item.brand].profit += item.profit;
                brandStats[item.brand].volume += item.volume;
                brandStats[item.brand].itemsCount += 1;
            });

            const brandPerformance = Object.entries(brandStats)
                .map(([name, stats]) => ({ name, ...stats }))
                .sort((a, b) => b.profit - a.profit);

            return NextResponse.json({
                insights: insights.sort((a, b) => (a.daysRemaining || 999) - (b.daysRemaining || 999)),
                topNotes,
                brandPerformance,
                sizeStats: Object.entries(sizeStats).map(([name, value]) => ({ name, value })),
                seasonalStats: Object.entries(seasonalStats).map(([name, value]) => ({ name, value })),
                temporalStats: { hourly: hourlyStats, daily: dailyStats },
                meta: {
                    periodDays: 90,
                    totalRevenue: insights.reduce((sum, i) => sum + i.revenue, 0),
                    totalProfit: insights.reduce((sum, i) => sum + i.profit, 0)
                }
            });

        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Procurement Insights API Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
