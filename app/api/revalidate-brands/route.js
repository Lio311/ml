import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        console.log('Manually revalidating brands cache...');
        revalidateTag('brands');
        revalidateTag('globals');
        return NextResponse.json({ revalidated: true, now: Date.now() });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
