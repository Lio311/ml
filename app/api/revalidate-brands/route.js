import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function GET() {
    revalidatePath('/brands/[brand]', 'page');
    revalidateTag('insights');
    revalidateTag('brands');
    return NextResponse.json({ revalidated: true, now: Date.now() });
}
