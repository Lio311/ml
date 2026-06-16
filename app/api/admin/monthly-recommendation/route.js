import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import pool from '../../../lib/db';

const getCurrentMonthString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

export async function GET() {
    try {
        const user = await currentUser();
        if (!user || (user.publicMetadata?.role !== 'admin' && user.emailAddresses?.[0]?.emailAddress !== process.env.ADMIN_EMAIL)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentMonth = getCurrentMonthString();
        
        // Fetch current month's recommendation
        let res = await pool.query('SELECT * FROM monthly_recommendations WHERE month = $1', [currentMonth]);
        
        if (res.rows.length === 0) {
            // Create pending if not exists
            const insertRes = await pool.query(`
                INSERT INTO monthly_recommendations (month, perfume_ids, status) 
                VALUES ($1, $2, $3) RETURNING *
            `, [currentMonth, JSON.stringify([]), 'pending']);
            res = insertRes;
        }

        const data = res.rows[0];
        
        // Fetch the actual product details for the selected IDs for the current month
        let products = [];
        if (data.perfume_ids && data.perfume_ids.length > 0) {
            const productsRes = await pool.query(
                'SELECT id, name, brand, image_url FROM products WHERE id = ANY($1)',
                [data.perfume_ids]
            );
            products = productsRes.rows;
        }

        // Fetch history (past months)
        const historyRes = await pool.query(`
            SELECT * FROM monthly_recommendations 
            WHERE month != $1 
            ORDER BY month DESC 
            LIMIT 12
        `, [currentMonth]);
        
        let history = historyRes.rows;
        
        // Gather all unique product IDs from history to fetch them
        const allHistoryProductIds = new Set();
        history.forEach(h => {
            if (h.perfume_ids && Array.isArray(h.perfume_ids)) {
                h.perfume_ids.forEach(id => allHistoryProductIds.add(id));
            }
        });

        let historyProductsMap = {};
        if (allHistoryProductIds.size > 0) {
            const hProductsRes = await pool.query(
                'SELECT id, name, brand, image_url FROM products WHERE id = ANY($1)',
                [Array.from(allHistoryProductIds)]
            );
            hProductsRes.rows.forEach(p => {
                historyProductsMap[p.id] = p;
            });
        }

        // Attach products to history records
        history = history.map(h => ({
            ...h,
            products: (h.perfume_ids || []).map(id => historyProductsMap[id]).filter(Boolean)
        }));

        return NextResponse.json({ recommendation: data, products, history });
    } catch (error) {
        console.error('Error fetching monthly recommendation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await currentUser();
        if (!user || (user.publicMetadata?.role !== 'admin' && user.emailAddresses?.[0]?.emailAddress !== process.env.ADMIN_EMAIL)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { perfumeIds, action } = await req.json(); // action can be 'save' or 'save_and_send'
        const currentMonth = getCurrentMonthString();
        const newStatus = action === 'save_and_send' ? 'selected' : 'pending';

        const updateRes = await pool.query(`
            UPDATE monthly_recommendations 
            SET perfume_ids = $1, status = $2, updated_at = NOW() 
            WHERE month = $3 RETURNING *
        `, [JSON.stringify(perfumeIds), newStatus, currentMonth]);

        let updatedData = updateRes.rows[0];

        // The status is now 'selected'. The CRON job will automatically send it 
        // to all subscribers on the 30th (or 28th for Feb).

        return NextResponse.json({ success: true, recommendation: updatedData });
    } catch (error) {
        console.error('Error saving monthly recommendation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
