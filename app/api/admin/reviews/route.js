import pool from '../../../lib/db';
import { auth as clerkAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { recordAuditLog } from '../../../lib/audit';

export async function PATCH(req) {
    try {
        const authData = await clerkAuth();
        const userId = authData?.userId;
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        // Check if requester is admin
        const adminCheck = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        const role = adminCheck.rows[0]?.role;
        if (role !== 'admin' && role !== 'deputy') {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const body = await req.json();
        const { reviewId, isPublic } = body;

        if (reviewId === undefined || isPublic === undefined) {
            return new NextResponse('ReviewId and isPublic are required', { status: 400 });
        }

        await pool.query('UPDATE reviews SET is_public = $1 WHERE id = $2', [isPublic, reviewId]);

        await recordAuditLog({
            userId,
            action: 'update_review_visibility',
            entityType: 'review',
            entityId: String(reviewId),
            details: { isPublic },
            req
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error toggling review visibility:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const authData = await clerkAuth();
        const userId = authData?.userId;
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        // Check if requester is admin
        const adminCheck = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        const role = adminCheck.rows[0]?.role;
        if (role !== 'admin' && role !== 'deputy') {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const reviewId = searchParams.get('id');

        if (!reviewId) return new NextResponse('Review ID is required', { status: 400 });

        await pool.query('DELETE FROM reviews WHERE id = $1', [reviewId]);

        await recordAuditLog({
            userId,
            action: 'delete_review',
            entityType: 'review',
            entityId: String(reviewId),
            details: { id: reviewId },
            req
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting review:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
