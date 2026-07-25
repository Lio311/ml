import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { unstable_cache } from "next/cache";

export const dynamic = 'force-dynamic';

const getCachedAdminCounts = unstable_cache(
    async (userId) => {
        const client = await pool.connect();
        try {
            const today = new Date();
            const year = today.getFullYear();
            const monthNum = today.getMonth() + 1;
            const currentMonthStr = `${year}-${String(monthNum).padStart(2, '0')}`;

            const [ordersRes, inboxRes, recsRes, monthlyRecRes, hiddenReviewsRes, seoDraftsRes, requestsRes, pendingEmailsRes] = await Promise.all([
                // 1. Pending and Processing orders
                client.query("SELECT COUNT(*) FROM orders WHERE catalog_id IS NULL AND (status = 'pending' OR status = 'processing')"),
                
                // 2. Unread messages (Total for admin)
                client.query(`
                    SELECT COUNT(*) as total_unread
                    FROM messages m
                    JOIN conversations c ON m.conversation_id = c.id
                    WHERE (c.participant2_id = 'admin' OR c.participant1_id = $1)
                    AND m.sender_id != $1
                    AND m.is_read = false
                `, [userId]),

                // 3. Pending recommendations
                client.query("SELECT count(*) as count FROM pending_recommendation_emails WHERE status = 'pending'"),

                // 4. Monthly recommendation status
                client.query("SELECT status FROM monthly_recommendations WHERE month = $1", [currentMonthStr]),

                // 5. Hidden reviews count
                client.query("SELECT COUNT(*) FROM reviews WHERE is_public = false"),

                // 6. SEO draft blog posts
                client.query("SELECT COUNT(*) FROM blog_posts WHERE status = 'draft'").catch(() => ({ rows: [{ count: 0 }] })),

                // 7. Pending perfume requests
                client.query("SELECT COUNT(*) FROM perfume_requests").catch(() => ({ rows: [{ count: 0 }] })),

                // 8. Pending scheduled emails (aggregating all types shown on the pending emails page)
                client.query(`
                    SELECT 
                        (SELECT COUNT(*) FROM pending_order_emails WHERE initial_status = 'pending') +
                        (SELECT COUNT(*) FROM email_campaigns WHERE status = 'scheduled') +
                        (SELECT COUNT(*) FROM pending_recommendation_emails WHERE status IN ('pending', 'approved')) +
                        (SELECT COUNT(*) FROM back_in_stock_subscriptions WHERE status = 'pending') as count
                `).catch(() => ({ rows: [{ count: 0 }] }))
            ]);

            let checkoutErrorsCount = 0;
            try {
                const ceRes = await client.query("SELECT COUNT(*) FROM checkout_errors WHERE is_resolved = false");
                checkoutErrorsCount = parseInt(ceRes.rows[0].count || 0);
            } catch (e) {
                // Table might not exist yet
            }

            // 6. Check bundles inventory
            let missingBundleItems = false;
            try {
                const settingsRes = await client.query(`SELECT value FROM site_settings WHERE key = 'bundles_config'`);
                if (settingsRes.rows.length > 0) {
                    const bundlesConfig = settingsRes.rows[0].value || {};
                    const allProductIds = new Set();
                    for (const bundle of Object.values(bundlesConfig)) {
                        if (bundle && bundle.items && Array.isArray(bundle.items)) {
                            bundle.items.forEach(id => allProductIds.add(id));
                        }
                    }
                    if (allProductIds.size > 0) {
                        const stockRes = await client.query(
                            `SELECT COUNT(*) FROM products WHERE id = ANY($1) AND stock <= 0`,
                            [Array.from(allProductIds)]
                        );
                        if (parseInt(stockRes.rows[0].count) > 0) {
                            missingBundleItems = true;
                        }
                    }
                }
            } catch (e) {
                // Ignore
            }

            const monthlyRecStatus = monthlyRecRes.rows.length > 0 ? monthlyRecRes.rows[0].status : 'pending';

            return {
                pendingOrders: parseInt(ordersRes.rows[0].count || 0),
                unreadInbox: parseInt(inboxRes.rows[0].total_unread || 0),
                pendingRecommendations: parseInt(recsRes.rows[0].count || 0),
                hiddenReviews: parseInt(hiddenReviewsRes.rows[0].count || 0),
                monthlyRecNeedsAction: monthlyRecStatus !== 'selected',
                pendingCheckoutErrors: checkoutErrorsCount,
                missingBundleItems,
                seoDrafts: parseInt(seoDraftsRes.rows[0].count || 0),
                pendingRequests: parseInt(requestsRes.rows[0].count || 0),
                pendingEmails: parseInt(pendingEmailsRes.rows[0].count || 0)
            };
        } finally {
            client.release();
        }
    },
    ['admin-counts'], // Base cache key
    { revalidate: 60, tags: ['admin-counts'] } // Cache for 60 seconds
);

export async function GET() {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const role = user?.publicMetadata?.role;
        const email = user?.emailAddresses?.[0]?.emailAddress;
        const isSuperAdmin = email === process.env.ADMIN_EMAIL;

        if (!isSuperAdmin && role !== 'admin' && role !== 'deputy' && role !== 'warehouse' && role !== 'viewer') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const counts = await getCachedAdminCounts(user.id);
        
        return NextResponse.json(counts);
    } catch (error) {
        console.error("Failed to fetch admin counts:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
