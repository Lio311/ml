import ReviewsClient from './ReviewsClient';
import pool from '../lib/db';
import { clerkClient } from '@clerk/nextjs/server';

export const metadata = {
    title: 'ביקורות לקוחות | ml_tlv',
    description: 'מה הלקוחות שלנו חושבים על חויית הרכישה והבשמים של ml_tlv. ביקורות אמיתיות על דוגמיות בשמי יוקרה.',
};

export default async function ReviewsPage() {
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
                    user_name: `${user.firstName} ${user.lastName}`.trim() || review.first_name || 'לקוח'
                };
            } catch (err) {
                return {
                    ...review,
                    user_image: null,
                    user_name: review.first_name || 'לקוח'
                };
            }
        }));
    } catch (error) {
        console.error('Error fetching reviews:', error);
    }

    return <ReviewsClient initialReviews={reviews} />;
}
