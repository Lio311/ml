import pool from "../../../../lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await currentUser();
        const role = user?.publicMetadata?.role;
        const email = user?.emailAddresses?.[0]?.emailAddress;
        
        const isAdmin = role === 'admin' || role === 'deputy' || role === 'viewer' || email === process.env.ADMIN_EMAIL;
        
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
                
                const processSaleItem = (item, bundleQuantity = 1, bundlePricePerItem = null) => {
                    if (item.type === 'bundle' && Array.isArray(item.items) && item.items.length > 0) {
                        const bQty = parseInt(item.quantity) || 1;
                        const bPrice = parseFloat(item.price) || 0;
                        const allocatedPrice = bPrice / item.items.length;
                        
                        item.items.forEach(subItem => {
                            processSaleItem(subItem, bundleQuantity * bQty, allocatedPrice);
                        });
                        return;
                    }

                    const pid = item.product_id || item.id;
                    if (!pid) return;

                    if (!salesMap[pid]) {
                        salesMap[pid] = { total_ml: 0, count: 0, revenue: 0, profit: 0 };
                    }

                    const quantity = (parseInt(item.quantity) || 1) * bundleQuantity;
                    const size = parseFloat(String(item.size).replace(/[^\d.]/g, '')) || 0;
                    const price = bundlePricePerItem !== null ? bundlePricePerItem : (parseFloat(item.price) || 0);
                    
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
                };

                items.forEach(item => processSaleItem(item));
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
                    original_size: p.original_size,
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
                const SEASON_MAP = {
                    'חורף': 'Winter',
                    'קיץ': 'Summer',
                    'אביב': 'Spring',
                    'סתיו': 'Autumn',
                    'winter': 'Winter',
                    'summer': 'Summer',
                    'spring': 'Spring',
                    'autumn': 'Autumn'
                };

                const seasons = processTags(item.seasons);
                seasons.forEach(s => {
                    const mapped = SEASON_MAP[s] || SEASON_MAP[s.trim().toLowerCase()];
                    if (mapped && seasonalStats.hasOwnProperty(mapped)) {
                        seasonalStats[mapped] += item.revenue;
                    }
                });
            });

            console.log('DEBUG Seasonal Stats:', seasonalStats);

            const topNotes = Object.entries(notesStats)
                .map(([name, volume]) => ({ name, volume }))
                .sort((a, b) => b.volume - a.volume)
                .slice(0, 20);

            // 6. Sophisticated Business Health Radar (Normalized 0-100)
            const totalRevenue = insights.reduce((sum, i) => sum + i.revenue, 0);
            const totalProfit = insights.reduce((sum, i) => sum + i.profit, 0);
            const totalVelocity = insights.reduce((sum, i) => sum + (i.velocity || 0), 0);

            const performanceRadar = [
                { subject: 'מחזור', value: Math.min(100, (totalRevenue / 50000) * 100), fullMark: 100 }, 
                { subject: 'רווחיות', value: Math.min(100, (totalProfit / 20000) * 100), fullMark: 100 },
                { subject: 'קצב מכירה', value: Math.min(100, (totalVelocity / 50) * 100), fullMark: 100 },
                { subject: 'יעילות מלאי', value: Math.min(100, (insights.filter(i => i.velocity > 0).length / (insights.length || 1)) * 100), fullMark: 100 },
                { subject: 'חשיפה', value: Math.min(100, (orders.length / 200) * 100), fullMark: 100 }
            ];

            // 7. Categorized Daily Revenue (Men, Women, Unisex)
            const daysOfWeek = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
            const hourlyStats = Array.from({ length: 24 }, (_, i) => ({ 
                hour: `${String(i).padStart(2, '0')}:00`, 
                revenue: 0 
            }));
            
            const dailyStats = daysOfWeek.map(name => ({ 
                name, 
                revenue: 0,
                men: 0,
                women: 0,
                unisex: 0
            }));

            orders.forEach(order => {
                const date = new Date(order.created_at);
                const hour = date.getHours();
                const day = date.getDay();
                
                const items = Array.isArray(order.items) ? order.items : [];
                
                // Track total revenue at the order-item level so we don't duplicate
                items.forEach(it => {
                    const price = parseFloat(it.price) || 0;
                    const qty = parseInt(it.quantity) || 0;
                    const amount = price * qty;
                    
                    hourlyStats[hour].revenue += amount;
                    dailyStats[day].revenue += amount;
                });
                
                const processCatSizeItem = (it, bundleQuantity = 1, allocatedAmount = null) => {
                    if (it.type === 'bundle' && Array.isArray(it.items) && it.items.length > 0) {
                        const price = parseFloat(it.price) || 0;
                        const qty = parseInt(it.quantity) || 0;
                        const amount = price * qty;
                        const allocated = amount / it.items.length;
                        it.items.forEach(subItem => {
                            processCatSizeItem(subItem, bundleQuantity * (parseInt(it.quantity) || 1), allocated);
                        });
                        return;
                    }

                    const price = parseFloat(it.price) || 0;
                    const qty = (parseInt(it.quantity) || 1) * bundleQuantity;
                    const amount = allocatedAmount !== null ? allocatedAmount : (price * qty);

                    const pid = it.product_id || it.id;
                    const prod = products.find(p => p.id === pid);
                    const cat = (prod?.category || '').toLowerCase();
                    if (cat.includes('men')) dailyStats[day].men += amount;
                    else if (cat.includes('women')) dailyStats[day].women += amount;
                    else dailyStats[day].unisex += amount;

                    const sizeKey = `${Math.round(parseFloat(it.size))}ml`;
                    if (sizeStats.hasOwnProperty(sizeKey)) {
                        sizeStats[sizeKey] += qty;
                    }
                };

                items.forEach(it => processCatSizeItem(it));
            });

            // 8. Brand Performance
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

            // 9. Monthly Order Density Grid (Full 31x24 Matrix)
            const monthlyGridMap = {};
            orders.forEach(order => {
                const date = new Date(order.created_at);
                const day = date.getDate(); // 1-31
                const hour = date.getHours(); // 0-23
                const key = `${day}-${hour}`;
                
                if (!monthlyGridMap[key]) {
                    monthlyGridMap[key] = { count: 0, cats: {} };
                }
                monthlyGridMap[key].count += 1;
                
                const items = Array.isArray(order.items) ? order.items : [];
                
                const processGridItem = (it) => {
                    if (it.type === 'bundle' && Array.isArray(it.items)) {
                        it.items.forEach(sub => processGridItem(sub));
                        return;
                    }
                    const pid = it.product_id || it.id;
                    const prod = products.find(p => p.id === pid);
                    const cat = (prod?.category || 'Unisex').toLowerCase();
                    if (!monthlyGridMap[key].cats[cat]) monthlyGridMap[key].cats[cat] = 0;
                    monthlyGridMap[key].cats[cat] += 1;
                };

                items.forEach(it => processGridItem(it));
            });

            const monthlyDensityGrid = [];
            for (let d = 1; d <= 31; d++) {
                for (let h = 0; h <= 23; h++) {
                    const key = `${d}-${h}`;
                    const cell = monthlyGridMap[key];
                    const dominant = cell ? (Object.entries(cell.cats).sort((a,b) => b[1] - a[1])[0]?.[0] || 'unisex') : 'none';
                    monthlyDensityGrid.push({
                        day: d,
                        hour: h,
                        count: cell ? cell.count : 0,
                        category: dominant
                    });
                }
            }

            return NextResponse.json({
                insights: insights.sort((a, b) => (a.daysRemaining || 999) - (b.daysRemaining || 999)),
                topNotes,
                brandPerformance,
                performanceRadar,
                monthlyDensityGrid,
                sizeStats: Object.entries(sizeStats).map(([name, value]) => ({ name, value })),
                seasonalStats: Object.entries(seasonalStats).map(([name, value]) => ({ name, value })),
                temporalStats: { hourly: hourlyStats, daily: dailyStats },
                debug: {
                    rawSeasons: products.slice(0, 5).map(p => p.seasons),
                    seasonalStatsRaw: seasonalStats
                },
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
