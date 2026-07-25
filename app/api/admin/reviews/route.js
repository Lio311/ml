import { NextResponse } from 'next/server';
import { withAdminApi } from '../../../lib/withAdminApi';

export const PATCH = withAdminApi(async (req, { client }) => {
    const body = await req.json();
    const { reviewId, isPublic } = body;

    if (reviewId === undefined || isPublic === undefined) {
        return new NextResponse('ReviewId and isPublic are required', { status: 400 });
    }

    await client.query('UPDATE reviews SET is_public = $1 WHERE id = $2', [isPublic, reviewId]);

    return NextResponse.json({ success: true });
}, { allowedRoles: ['admin', 'deputy', 'viewer'] });

export const DELETE = withAdminApi(async (req, { client }) => {
    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get('id');

    if (!reviewId) return new NextResponse('Review ID is required', { status: 400 });

    await client.query('DELETE FROM reviews WHERE id = $1', [reviewId]);

    return NextResponse.json({ success: true });
}, { allowedRoles: ['admin', 'deputy'] });
