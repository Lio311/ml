import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function GET() {
    revalidateTag('home-data');
    revalidatePath('/');
    return NextResponse.json({ success: true, message: 'Cache cleared!' });
}
