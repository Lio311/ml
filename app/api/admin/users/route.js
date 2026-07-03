import { clerkClient, auth as clerkAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import pool from '../../../lib/db';
import { recordAuditLog } from '../../../lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    const client = await pool.connect();
    try {
        console.log("Fetching users from Local DB...");

        // Ensure address column exists (fixes 500 error)
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address JSONB;`);

        let sql = `
            SELECT id, first_name, last_name, email, phone, role, created_at, address 
            FROM users 
        `;
        let params = [];

        if (query) {
            sql += `
                WHERE (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 OR id ILIKE $1)
            `;
            params.push(`%${query}%`);
        }

        sql += ` ORDER BY created_at DESC `;
        
        const res = await client.query(sql, params);

        const users = res.rows.map(user => ({
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            role: user.role || 'customer',
            createdAt: user.created_at,
            lastSignInAt: null // DB doesn't track this yet, optional
        }));

        // Sort by Role Priority: Admin > Deputy > Warehouse > Customer
        const rolePriority = { 'admin': 1, 'deputy': 2, 'warehouse': 3, 'customer': 4 };
        users.sort((a, b) => {
            const priorityA = rolePriority[a.role] || 4;
            const priorityB = rolePriority[b.role] || 4;
            if (priorityA !== priorityB) return priorityA - priorityB;
            return new Date(b.createdAt) - new Date(a.createdAt); // Secondary sort by date
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("Failed to fetch users from DB:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function PUT(request) {
    const client = await pool.connect();
    try {
        const body = await request.json();
        const { userId, role } = body;

        if (!userId || !role) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const validRoles = ['admin', 'deputy', 'warehouse', 'viewer', 'customer'];
        if (!validRoles.includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        // 1. Update Clerk (Source of Auth Truth)
        const clerk = await clerkClient();
        await clerk.users.updateUserMetadata(userId, {
            publicMetadata: {
                role: role
            }
        });

        // 2. Update Local DB (Source of Dashboard Truth)
        await client.query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [role, userId]);

        const authData = await clerkAuth();
        await recordAuditLog({
            userId: authData?.userId,
            action: 'update_user_role',
            entityType: 'user',
            entityId: String(userId),
            details: { newRole: role },
            req: request
        });

        return NextResponse.json({ success: true, userId, role });

    } catch (error) {
        console.error("Failed to update user role:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    } finally {
        client.release();
    }
}
