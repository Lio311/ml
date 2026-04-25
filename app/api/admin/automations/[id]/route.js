import { NextResponse } from "next/server";
import { query } from "../../../../../lib/db";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(req, { params }) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = params;
        const { nodes, edges } = await req.json();

        const res = await query(`
            UPDATE workflows 
            SET nodes = $1, edges = $2, updated_at = NOW()
            WHERE id = $3
            RETURNING *
        `, [JSON.stringify(nodes), JSON.stringify(edges), id]);

        if (res.rows.length === 0) {
            return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
        }

        return NextResponse.json(res.rows[0]);
    } catch (err) {
        console.error("Update Automation Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = params;

        await query(`DELETE FROM workflows WHERE id = $1`, [id]);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Delete Automation Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
