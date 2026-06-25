import { currentUser } from "@clerk/nextjs/server";

export async function checkAdmin({ allowViewer = false } = {}) {
    const user = await currentUser();
    if (!user) return false;

    // Super Admin from Env
    const email = user.emailAddresses?.[0]?.emailAddress;
    const adminEmail = process.env.ADMIN_EMAIL;
    if (email === adminEmail) return true;

    // Role Based
    const role = user.publicMetadata?.role;
    // Allowed roles for modifying data: admin, deputy
    // warehouse might need read-only or specific write, but for general "admin check" strictly for critical data:
    if (role === 'admin' || role === 'deputy') return true;

    // Allowed for viewing data only
    if (allowViewer && role === 'viewer') return true;

    return false;
}

export async function checkCronOrAdmin(req) {
    // In development, allow bypass for easy local testing
    if (process.env.NODE_ENV !== 'production') return true;

    const authHeader = req.headers?.get?.('authorization');
    const isCronSecretValid = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
    if (isCronSecretValid) return true;

    // Check if the user is a logged-in admin
    try {
        const isAdmin = await checkAdmin();
        if (isAdmin) return true;
    } catch (e) {
        console.error("checkCronOrAdmin admin check error:", e);
    }

    return false;
}
