import pool from '@/app/lib/db';
import { auth as clerkAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { recordAuditLog } from '@/app/lib/audit';
import { generateRecommendationForOrder } from '@/app/lib/recommendations';

export async function GET(req) {
    try {
        const authData = await clerkAuth();
        const userId = authData?.userId;
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        const adminCheck = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        const role = adminCheck.rows[0]?.role;
        if (role !== 'admin' && role !== 'deputy' && role !== 'viewer') {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const result = await pool.query(`
            SELECT p.id, p.user_id, p.order_id, p.suggested_products, p.status, p.created_at,
                   o.customer_details, o.items as original_items
            FROM pending_recommendation_emails p
            JOIN orders o ON p.order_id = o.id
            WHERE p.status IN ('pending', 'approved', 'sent')
            ORDER BY p.created_at DESC
        `);

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function POST(req) {
    try {
        const authData = await clerkAuth();
        const userId = authData?.userId;
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        const adminCheck = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        const role = adminCheck.rows[0]?.role;
        if (role !== 'admin' && role !== 'deputy') {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const { id } = await req.json();
        if (!id) return new NextResponse('ID is required', { status: 400 });

        const recData = await pool.query(`
            SELECT p.user_id, p.suggested_products, o.customer_details, o.id as orderId
            FROM pending_recommendation_emails p
            JOIN orders o ON p.order_id = o.id
            WHERE p.id = $1 AND p.status = 'pending'
        `, [id]);

        if (recData.rows.length === 0) {
            return new NextResponse('Pending recommendation not found', { status: 404 });
        }

        const data = recData.rows[0];
        const email = data.customer_details?.email;
        const productsHtml = typeof data.suggested_products === 'string' ? JSON.parse(data.suggested_products) : data.suggested_products;

        if (!email) {
            await pool.query('UPDATE pending_recommendation_emails SET status = $1 WHERE id = $2', ['rejected_no_email', id]);
            return NextResponse.json({ success: true, message: "No email, rejected." });
        }

        // Mark as approved (will be sent later by cron)
        await pool.query('UPDATE pending_recommendation_emails SET status = $1 WHERE id = $2', ['approved', id]);

        await recordAuditLog({
            userId,
            action: 'approve_recommendation_email',
            entityType: 'recommendation_email',
            entityId: String(id),
            details: { orderId: data.orderId, productsCount: productsHtml.length },
            req
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error approving recommendation:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const authData = await clerkAuth();
        const userId = authData?.userId;
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        const adminCheck = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        const role = adminCheck.rows[0]?.role;
        if (role !== 'admin' && role !== 'deputy') {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return new NextResponse('ID is required', { status: 400 });

        // Get details before updating
        const recData = await pool.query('SELECT order_id, user_id FROM pending_recommendation_emails WHERE id = $1', [id]);
        if (recData.rows.length === 0) return new NextResponse('Not found', { status: 404 });
        
        const { order_id, user_id } = recData.rows[0];

        // Mark current as rejected
        await pool.query('UPDATE pending_recommendation_emails SET status = $1 WHERE id = $2', ['rejected', id]);

        // Record audit log
        await recordAuditLog({
            userId,
            action: 'reject_recommendation_email',
            entityType: 'recommendation_email',
            entityId: String(id),
            details: { order_id },
            req
        });

        // Loop: Generate a NEW recommendation immediately for this order
        const client = await pool.connect();
        try {
            await generateRecommendationForOrder(client, order_id, user_id);
        } catch (genError) {
            console.error('Error regenerating recommendation in loop:', genError);
            // We don't fail the whole request if regeneration fails, but we log it
        } finally {
            client.release();
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error rejecting recommendation:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

