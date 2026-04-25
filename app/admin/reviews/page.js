import pool from '../../lib/db';
import { clerkClient } from '@clerk/nextjs/server';
import AdminReviewsClient from './AdminReviewsClient';
import { sanitizeProductArray } from '../../lib/productUtils';

import { getBrandName } from '../../lib/brand';

export async function generateMetadata() {
    const brandName = await getBrandName();
    return {
        title: `ניהול ביקורות Admin`,
    };
}

export default async function AdminReviewsPage() {
    // Fetch all reviews
    const result = await pool.query(`
        SELECT r.*, u.first_name, u.last_name
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at DESC
    `);

    // Merge with Clerk user images
    const client = await clerkClient();
    const sanitizedRows = sanitizeProductArray(result.rows);
    const reviewsWithUsers = await Promise.all(sanitizedRows.map(async (review) => {
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

    return (
        <div className="container py-8 md:pl-12">
            <AdminReviewsClient initialReviews={reviewsWithUsers} />
        </div>
    );
}
