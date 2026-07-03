import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { recordAuditLog } from "@/app/lib/audit";

export async function PATCH(request, { params }) {
    try {
        const user = await currentUser();
        const role = user?.publicMetadata?.role;

        if (role !== 'admin' && role !== 'deputy') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = params.id;
        const body = await request.json();
        const { address } = body;

        const client = await pool.connect();
        try {
            // Ensure the column exists
            await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address JSONB;`);

            // Update user
            await client.query(
                `UPDATE users SET address = $1, updated_at = NOW() WHERE id = $2`,
                [address ? JSON.stringify(address) : null, userId]
            );

            await recordAuditLog({
                userId: user.id,
                action: 'update_user_address',
                entityType: 'user',
                entityId: userId,
                details: { address },
                req: request
            });

            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Failed to update user address:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
