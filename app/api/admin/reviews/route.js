import pool from '../../../lib/db';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function PATCH(req) {
    try {
        const { userId } = await auth();
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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error toggling review visibility:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { userId } = await auth();
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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting review:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
