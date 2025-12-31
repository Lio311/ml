const { clerkClient } = require('@clerk/nextjs/server');

// Mocking the Next.js server environment for script execution
// In a real script outside Next.js context, we'd need to fetch the secret key differently or use the API directly.
// However, since we are running this "locally" in the context of the app, let's try to simulate or use a route.

// actually, running a script that imports @clerk/nextjs/server might fail if not in the build context.
// Let's create a temporary API route to run this once.

// c:/Users/Lior/OneDrive - mail.tau.ac.il/Desktop/ml/app/app/api/admin/seed-role/route.js
import { NextResponse } from 'next/server';
import { checkAdmin } from '@/app/lib/admin';

export async function GET() {
    // Security: Only allow if explicitly authorized or in dev mode? 
    // Better to just block it now that setup is done.
    // Or require a secret.
    // Let's require the Admin Email to be the one requesting? No, currentUser() might not be working if I am using it to setup.
    // I will disable this route by default or protect it.

    // Protect with CRON_SECRET or similar "God Mode" secret if needed, or checkAdmin.
    // Since it seeds ADMIN role, checking isAdmin is circular if you aren't invalid.
    // But if you are already admin, you don't need it.
    // This script is dangerous. I will protect it with a hard requirement for a specific secret query param.
    // Or just checkAdmin() assuming it's for 'repairing' other users.

    // Let's use checkAdmin.
    const isAdmin = await checkAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

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
