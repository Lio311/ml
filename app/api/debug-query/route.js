import { NextResponse } from 'next/server';
import { getProducts } from '../../catalog/dbQueries';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    try {
        const res = await getProducts(q, null, null, null, null, 'random', 1, {});
        return NextResponse.json({ query: q, products: res.products.map(p => p.name) });
    } catch (e) {
        return NextResponse.json({ error: e.message });
    }
}
