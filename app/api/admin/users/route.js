import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const client = await clerkClient();
        console.log("Fetching users...");

        // Fetch user list (limit 100 for now, add pagination if needed later)
        const response = await client.users.getUserList({
            limit: 100
        });

        // The response might be the array directly or an object with 'data' depending on version.
        // Recent Clerk SDK returns generic objects with data property for paginated lists.
        const usersList = response.data || response;

        const users = usersList.map(user => ({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.emailAddresses[0]?.emailAddress,
            role: user.publicMetadata.role || 'customer',
            createdAt: user.createdAt,
            lastSignInAt: user.lastSignInAt
        }));

        // Sort by Role Priority: Admin > Deputy > Warehouse > Customer
        const rolePriority = { 'admin': 1, 'deputy': 2, 'warehouse': 3, 'customer': 4 };
        users.sort((a, b) => {
            const priorityA = rolePriority[a.role] || 4;
            const priorityB = rolePriority[b.role] || 4;
            return priorityA - priorityB;
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

export async function PUT(request) {
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

        const client = await clerkClient();
        await client.users.updateUserMetadata(userId, {
            publicMetadata: {
                role: role
            }
        });

        return NextResponse.json({ success: true, userId, role });

    } catch (error) {
        console.error("Failed to update user role:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
