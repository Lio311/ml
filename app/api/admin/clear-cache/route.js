import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, message: "Full cache cleared" });
}
