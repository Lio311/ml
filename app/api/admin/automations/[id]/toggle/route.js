import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db";
import { auth } from "@clerk/nextjs/server";

export async function POST(req, { params }) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const { active } = await req.json();

        const res = await query(`
            UPDATE workflows 
            SET is_active = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `, [active, id]);

        if (res.rows.length === 0) {
            return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
        }

        return NextResponse.json(res.rows[0]);
    } catch (err) {
        console.error("Toggle Automation Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
