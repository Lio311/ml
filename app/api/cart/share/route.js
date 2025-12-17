import pool from "../../../lib/db";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
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
        console.error("Error sharing cart:", e);
        return NextResponse.json({ error: "Failed to share cart" }, { status: 500 });
    }
}
