import { NextResponse } from 'next/server';
import db from '@/app/lib/db';
import { currentUser } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await currentUser();
        const role = user?.publicMetadata?.role;
        const email = user?.emailAddresses?.[0]?.emailAddress;
        
        const isSuperAdmin = email === process.env.ADMIN_EMAIL;
        
        if (!isSuperAdmin && role !== 'admin' && role !== 'deputy') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await db.query(
            "SELECT count(*) as count FROM pending_recommendation_emails WHERE status = 'pending';"
        );

        return NextResponse.json({ count: parseInt(result.rows[0].count) });
    } catch (error) {
        console.error("Pending count error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
