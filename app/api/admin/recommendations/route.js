import { NextResponse } from 'next/server';
import { withAdminApi } from '@/app/lib/withAdminApi';
import { generateRecommendationForOrder } from '@/app/lib/recommendations';

export const GET = withAdminApi(async (req, { client }) => {
    const result = await client.query(`
        SELECT p.id, p.user_id, p.order_id, p.suggested_products, p.status, p.created_at,
               o.customer_details, o.items as original_items
        FROM pending_recommendation_emails p
        JOIN orders o ON p.order_id = o.id
        WHERE p.status IN ('pending', 'approved', 'sent')
        ORDER BY p.created_at DESC
    `);
    return NextResponse.json(result.rows);
}, { allowedRoles: ['admin', 'deputy', 'viewer'] });

export const POST = withAdminApi(async (req, { client }) => {
    const { id } = await req.json();
    if (!id) return new NextResponse('ID is required', { status: 400 });

    const recData = await client.query(`
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

    if (!email) {
        await client.query('UPDATE pending_recommendation_emails SET status = $1 WHERE id = $2', ['rejected_no_email', id]);
        return NextResponse.json({ success: true, message: "No email, rejected." });
    }

    // Mark as approved (will be sent later by cron)
    await client.query('UPDATE pending_recommendation_emails SET status = $1 WHERE id = $2', ['approved', id]);
    
    return NextResponse.json({ success: true });
}, { allowedRoles: ['admin', 'deputy'] });

export const DELETE = withAdminApi(async (req, { client }) => {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return new NextResponse('ID is required', { status: 400 });

    // Get details before updating
    const recData = await client.query('SELECT order_id, user_id FROM pending_recommendation_emails WHERE id = $1', [id]);
    if (recData.rows.length === 0) return new NextResponse('Not found', { status: 404 });
    
    const { order_id, user_id } = recData.rows[0];

    // Mark current as rejected
    await client.query('UPDATE pending_recommendation_emails SET status = $1 WHERE id = $2', ['rejected', id]);

    // Generate a NEW recommendation immediately for this order
    try {
        await generateRecommendationForOrder(client, order_id, user_id);
    } catch (genError) {
        console.error('Error regenerating recommendation in loop:', genError);
    }

    return NextResponse.json({ success: true });
}, { allowedRoles: ['admin', 'deputy'] });
