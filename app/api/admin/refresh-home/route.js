import { NextResponse } from 'next/server';
import { checkAdmin } from '../../../lib/admin';
import { revalidateTag } from 'next/cache';

export async function POST(req) {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        revalidateTag('home-data');
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Refresh Home Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
