import { NextResponse } from 'next/server';
import { getProducts } from '../../catalog/dbQueries';

export async function GET(req) {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || 'FUGAZZI';
    const result = await getProducts(q, null, null, null, null, 'random', 1, {});
    return NextResponse.json(result);
}
