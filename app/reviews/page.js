import ReviewsClient from './ReviewsClient';
import pool from '../lib/db';
import { clerkClient } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Customer Reviews | ml_tlv',
    description: 'What our customers think about their shopping experience and the perfumes at ml_tlv.',
};

export default async function ReviewsPage() {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const customerFallback = locale === 'en' ? 'Customer' : 'לקוח';
    let reviews = [];
    try {
        const result = await pool.query(`
            SELECT r.*, u.first_name, u.last_name, u.role
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.is_public = TRUE
            ORDER BY r.created_at DESC
        `);

        const client = await clerkClient();
        reviews = await Promise.all(result.rows.map(async (review) => {
            try {
                const user = await client.users.getUser(review.user_id);
                return {
                    ...review,
                    user_image: user.imageUrl,
                    user_name: `${user.firstName} ${user.lastName}`.trim() || review.first_name || customerFallback
                };
            } catch (err) {
                return {
                    ...review,
                    user_image: null,
                    user_name: review.first_name || customerFallback
                };
            }
        }));
    } catch (error) {
        console.error('Error fetching reviews:', error);
    }

    return <ReviewsClient initialReviews={reviews} />;
}
