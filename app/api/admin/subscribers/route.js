import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import pool from '../../../lib/db';

export async function GET(req) {
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    if (role !== 'admin' && role !== 'deputy') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        // Fetch all users that have an email
        const usersRes = await pool.query('SELECT email, first_name, last_name, created_at FROM users WHERE email IS NOT NULL ORDER BY created_at DESC');
        
        // Fetch all unsubscribed emails
        const unsubRes = await pool.query('SELECT email, unsubscribed_at FROM unsubscribed_emails');
        
        const unsubscribedMap = {};
        unsubRes.rows.forEach(r => {
            unsubscribedMap[r.email.toLowerCase()] = r.unsubscribed_at;
        });

        const subscribers = usersRes.rows.map(u => ({
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
            created_at: u.created_at,
            is_subscribed: !unsubscribedMap[u.email.toLowerCase()],
            unsubscribed_at: unsubscribedMap[u.email.toLowerCase()] || null
        }));

        // Also add people who are in unsubscribed_emails but NOT in the users table (if any)
        const userEmails = new Set(usersRes.rows.map(u => u.email.toLowerCase()));
        unsubRes.rows.forEach(r => {
            if (!userEmails.has(r.email.toLowerCase())) {
                subscribers.push({
                    email: r.email,
                    first_name: 'לא מזוהה',
                    last_name: '',
                    created_at: null,
                    is_subscribed: false,
                    unsubscribed_at: r.unsubscribed_at
                });
            }
        });

        return NextResponse.json({ subscribers });
    } catch (err) {
        console.error('Error fetching subscribers:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req) {
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    if (role !== 'admin' && role !== 'deputy') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { email, action } = await req.json();
        const normalizedEmail = email.toLowerCase().trim();

        if (action === 'unsubscribe') {
            await pool.query(`
                INSERT INTO unsubscribed_emails (email, unsubscribed_at)
                VALUES ($1, NOW())
                ON CONFLICT (email) DO NOTHING
            `, [normalizedEmail]);
        } else if (action === 'subscribe') {
            await pool.query(`
                DELETE FROM unsubscribed_emails WHERE email = $1
            `, [normalizedEmail]);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error toggling subscriber:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
