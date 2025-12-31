import { currentUser } from "@clerk/nextjs/server";

export async function checkAdmin() {
    const user = await currentUser();
    if (!user) return false;

    // Super Admin from Env
    const email = user.emailAddresses?.[0]?.emailAddress;
    const adminEmail = process.env.ADMIN_EMAIL || 'lior31197@gmail.com'; // Fallback for dev convenience, but best to set env
    if (email === adminEmail) return true;

    // Role Based
    const role = user.publicMetadata?.role;
    // Allowed roles for modifying data: admin, deputy
    // warehouse might need read-only or specific write, but for general "admin check" strictly for critical data:
    if (role === 'admin' || role === 'deputy') return true;

    return false;
}
