import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import pool from '../../../../lib/db';

export async function GET() {
    try {
        // 1. Fetch all users from Clerk
        const client = await clerkClient();
        const { data: users } = await client.users.getUserList({ limit: 500 });

        // 2. Fetch Order Counts from DB
        const ordersRes = await pool.query(`
            SELECT customer_details->>'clerk_id' as uid, COUNT(*) as count 
            FROM orders 
            GROUP BY uid
        `);

        // Map order counts for quick lookup
        const orderCounts = {};
        ordersRes.rows.forEach(row => {
            if (row.uid) orderCounts[row.uid] = parseInt(row.count);
        });

        // 3. Merge Data
        const enrichedUsers = users.map(user => {
            const uid = user.id;
            const primaryEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress || user.emailAddresses[0]?.emailAddress;

            return {
                id: uid,
                firstName: user.firstName,
                lastName: user.lastName,
                email: primaryEmail,
                image: user.imageUrl,
                createdAt: user.createdAt,
                lastSignInAt: user.lastSignInAt,
                manualPhone: user.publicMetadata?.manualPhone || '',
                ordersCount: orderCounts[uid] || 0
            };
        });

        return NextResponse.json(enrichedUsers);
    } catch (error) {
        console.error("Admin Users GET Error:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const { userId, manualPhone } = await req.json();
        if (!userId) {
            return NextResponse.json({ error: "Missing User ID" }, { status: 400 });
        }

        const client = await clerkClient();
        await client.users.updateUserMetadata(userId, {
            publicMetadata: {
                manualPhone: manualPhone
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update Phone Error:", error);
        return NextResponse.json({ error: "Failed to update phone" }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: "Missing User ID" }, { status: 400 });
        }

        const client = await clerkClient();
        await client.users.deleteUser(userId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete User Error:", error);
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}
