import pool from './db';
import webpush from 'web-push';

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      'mailto:lior31197@gmail.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
}

export async function notifyAdmin(type, message, client = null) {
    const dbClient = client || pool;
    
    // 1. Insert into notifications table
    try {
        await dbClient.query(
            `INSERT INTO notifications (type, message, is_read) VALUES ($1, $2, $3)`,
            [type, message, false]
        );
    } catch (dbErr) {
        console.error('Failed to insert admin notification:', dbErr);
    }

    // 2. Send push notifications
    try {
        // We use pool for this so it doesn't interfere with any active transaction
        const res = await pool.query('SELECT subscription FROM push_subscriptions');
        const subscriptions = res.rows;
        if (subscriptions.length === 0) return;

        const payload = JSON.stringify({
            title: 'התראה חדשה',
            body: message,
            url: '/admin',
            icon: '/api/assets/logo?type=icon_192'
        });

        // Fire and forget
        Promise.allSettled(
            subscriptions.map(s => 
                webpush.sendNotification(s.subscription, payload)
                    .catch(async (err) => {
                        // If subscription is expired or invalid, remove it
                        if (err.statusCode === 404 || err.statusCode === 410) {
                            try {
                                await pool.query(
                                    'DELETE FROM push_subscriptions WHERE subscription = $1',
                                    [JSON.stringify(s.subscription)]
                                );
                            } catch (e) {
                                console.error('Failed to delete invalid subscription:', e);
                            }
                        }
                    })
            )
        ).catch(err => console.error('Push broadcast error:', err));
    } catch (pushErr) {
        console.error('Failed to send admin push notification:', pushErr);
    }
}
