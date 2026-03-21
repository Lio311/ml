import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function GET() {
    revalidatePath('/', 'layout');
    revalidatePath('/brands', 'layout');
    revalidatePath('/catalog', 'layout');
    revalidatePath('/brands/[brand]', 'page');
    revalidatePath('/product/[slug]', 'page');
    revalidateTag('insights');
    revalidateTag('brands');
    revalidateTag('products');
    return NextResponse.json({ revalidated: true, now: Date.now(), msg: "All caches cleared" });
}
