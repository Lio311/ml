import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function POST(req) {
    try {
        const { userId } = auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await currentUser();
        const role = user?.publicMetadata?.role?.toLowerCase();
        const isAdmin = role === 'admin' || role === 'deputy' || user?.publicMetadata?.isAdmin === true;

        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
        }

        const body = await req.json();
        const { tag } = body;

        if (!tag) {
            return NextResponse.json({ error: 'Missing tag parameter' }, { status: 400 });
        }

        // Check if array or string
        const tagsToRevalidate = Array.isArray(tag) ? tag : [tag];
        
        for (const t of tagsToRevalidate) {
            revalidateTag(t);
        }

        return NextResponse.json({ 
            success: true, 
            revalidated: true, 
            tags: tagsToRevalidate,
            now: Date.now() 
        });

    } catch (error) {
        console.error('Revalidation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
