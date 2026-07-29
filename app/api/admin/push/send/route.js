import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { currentUser } from '@clerk/nextjs/server';
import webpush from 'web-push';

// Setup VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      'mailto:lior31197@gmail.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
}

export async function POST(req) {
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    if (role !== 'admin' && role !== 'deputy') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { title, message, url, icon, image } = await req.json();

        if (!title || !message) {
            return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
        }

        // Fetch all subscriptions
        const res = await pool.query('SELECT subscription FROM push_subscriptions');
        const subscriptions = res.rows;

        if (subscriptions.length === 0) {
            return NextResponse.json({ success: true, count: 0, message: 'No subscribers found' });
        }

        const payload = JSON.stringify({
            title,
            body: message,
            url: url || '/',
            icon: icon || '/api/assets/logo?type=icon_192',
            image: image || null,
        });

        const results = await Promise.allSettled(
            subscriptions.map(s => 
                webpush.sendNotification(s.subscription, payload)
                    .catch(async (err) => {
                        // If subscription is expired or invalid, remove it
                        if (err.statusCode === 404 || err.statusCode === 410) {
                            await pool.query(
                                'DELETE FROM push_subscriptions WHERE subscription = $1',
                                [JSON.stringify(s.subscription)]
                            );
                        }
                        throw err;
                    })
            )
        );

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failCount = results.filter(r => r.status === 'rejected').length;

        // Record history
        try {
            await pool.query(
                `INSERT INTO push_history (title, message, url, image, sent_count, fail_count, admin_name) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [title, message, url || '/', image || null, successCount, failCount, user?.firstName || 'Admin']
            );
        } catch (dbErr) {
            console.error('Error recording push history:', dbErr);
        }

        return NextResponse.json({ 
            success: true, 
            total: subscriptions.length,
            sent: successCount,
            failed: failCount
        });
    } catch (error) {
        console.error('Push Send Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
