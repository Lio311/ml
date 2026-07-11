import pool from '@/app/lib/db';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function PATCH(req, { params }) {
    try {
        const { id } = await params;
        const { secondary_email } = await req.json();

        // Admin Auth Check
        const user = await currentUser();
        const role = user?.publicMetadata?.role;
        const email = user?.emailAddresses[0]?.emailAddress;
        
        if (role !== 'admin' && email !== process.env.ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await pool.query(
            `UPDATE users SET secondary_email = $1 WHERE id = $2`,
            [secondary_email, id]
        );
            
        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error updating secondary email:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
