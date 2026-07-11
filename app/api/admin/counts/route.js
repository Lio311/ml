import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await currentUser();
        const role = user?.publicMetadata?.role;
        const email = user?.emailAddresses?.[0]?.emailAddress;
        const isSuperAdmin = email === process.env.ADMIN_EMAIL;

        if (!isSuperAdmin && role !== 'admin' && role !== 'deputy' && role !== 'warehouse' && role !== 'viewer') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await pool.connect();
        try {
            const today = new Date();
            const year = today.getFullYear();
            const monthNum = today.getMonth() + 1;
            const currentMonthStr = `${year}-${String(monthNum).padStart(2, '0')}`;

            const [ordersRes, inboxRes, recsRes, monthlyRecRes, hiddenReviewsRes] = await Promise.all([
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
                `, [user.id]),

                // 3. Pending recommendations
                client.query("SELECT count(*) as count FROM pending_recommendation_emails WHERE status = 'pending'"),

                // 4. Monthly recommendation status
                client.query("SELECT status FROM monthly_recommendations WHERE month = $1", [currentMonthStr]),

                // 5. Hidden reviews count
                client.query("SELECT COUNT(*) FROM reviews WHERE is_public = false")
            ]);

            let checkoutErrorsCount = 0;
            try {
                const ceRes = await client.query("SELECT COUNT(*) FROM checkout_errors WHERE is_resolved = false");
                checkoutErrorsCount = parseInt(ceRes.rows[0].count || 0);
            } catch (e) {
                // Table might not exist yet
            }

            const monthlyRecStatus = monthlyRecRes.rows.length > 0 ? monthlyRecRes.rows[0].status : 'pending';

            return NextResponse.json({
                pendingOrders: parseInt(ordersRes.rows[0].count || 0),
                unreadInbox: parseInt(inboxRes.rows[0].total_unread || 0),
                pendingRecommendations: parseInt(recsRes.rows[0].count || 0),
                hiddenReviews: parseInt(hiddenReviewsRes.rows[0].count || 0),
                monthlyRecNeedsAction: monthlyRecStatus !== 'selected',
                pendingCheckoutErrors: checkoutErrorsCount
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Failed to fetch admin counts:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
