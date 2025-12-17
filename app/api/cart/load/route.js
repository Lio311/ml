import pool from "../../../lib/db";
import { NextResponse } from "next/server";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        const res = await client.query(
            'SELECT items FROM shared_carts WHERE id = $1',
            [id]
        );

        if (res.rows.length === 0) {
            return NextResponse.json({ error: "Cart not found" }, { status: 404 });
        }

        return NextResponse.json(res.rows[0].items);
    } catch (e) {
        console.error("Error loading shared cart:", e);
        return NextResponse.json({ error: "Failed to load cart" }, { status: 500 });
    } finally {
        client.release();
    }
}
