import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function POST(req) {
    try {
        const origin = req.headers.get('origin') || req.headers.get('referer');
        const host = req.headers.get('host');
        if (origin && !origin.includes(host)) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await req.json();
        const { items } = body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            const res = await client.query(
                'INSERT INTO shared_carts (items) VALUES ($1) RETURNING id',
                [JSON.stringify(items)]
            );
            return NextResponse.json({ id: res.rows[0].id });
        } finally {
            client.release();
        }
    } catch (e) {
        Sentry.captureException(e);
        console.error("Error sharing cart:", e);
        return NextResponse.json({ error: "Failed to share cart" }, { status: 500 });
    }
}
