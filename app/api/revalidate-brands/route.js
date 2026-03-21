import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        console.log('Manually revalidating brands and insights cache...');
        revalidateTag('brands');
        revalidateTag('insights');
        revalidateTag('globals');
        return NextResponse.json({ 
            revalidated: true, 
            tags: ['brands', 'insights', 'globals'],
            now: Date.now() 
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
