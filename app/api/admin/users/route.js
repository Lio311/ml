import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import pool from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const client = await pool.connect();
    try {
        console.log("Fetching users from Local DB...");

        const res = await client.query(`
            SELECT id, first_name, last_name, email, role, created_at 
            FROM users 
            ORDER BY created_at DESC
        `);

        const users = res.rows.map(user => ({
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
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

        const validRoles = ['admin', 'deputy', 'warehouse', 'customer'];
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

        return NextResponse.json({ success: true, userId, role });

    } catch (error) {
        console.error("Failed to update user role:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    } finally {
        client.release();
    }
}
