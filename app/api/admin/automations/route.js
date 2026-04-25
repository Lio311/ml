import { NextResponse } from "next/server";
import { query } from "../../../lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const res = await query(`
            SELECT * FROM workflows 
            ORDER BY created_at DESC
        `);
        
        return NextResponse.json(res.rows);
    } catch (err) {
        console.error("GET Automations Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { name } = await req.json();
        if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

        const res = await query(`
            INSERT INTO workflows (name, nodes, edges)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [name, JSON.stringify([]), JSON.stringify([])]);

        return NextResponse.json(res.rows[0]);
    } catch (err) {
        console.error("POST Automation Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
