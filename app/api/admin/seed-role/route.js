const { clerkClient } = require('@clerk/nextjs/server');

// Mocking the Next.js server environment for script execution
// In a real script outside Next.js context, we'd need to fetch the secret key differently or use the API directly.
// However, since we are running this "locally" in the context of the app, let's try to simulate or use a route.

// actually, running a script that imports @clerk/nextjs/server might fail if not in the build context.
// Let's create a temporary API route to run this once.

// c:/Users/Lior/OneDrive - mail.tau.ac.il/Desktop/ml/app/app/api/admin/seed-role/route.js
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const client = await clerkClient();
        console.log("Searching for user...");

        const response = await client.users.getUserList({
            emailAddress: ['lior31197@gmail.com'],
            limit: 1
        });

        if (response.data.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = response.data[0];
        console.log("Found user:", user.id);

        await client.users.updateUserMetadata(user.id, {
            publicMetadata: {
                role: 'admin'
            }
        });

        return NextResponse.json({ success: true, userId: user.id, role: 'admin' });
    } catch (error) {
        console.error("Seeding failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
