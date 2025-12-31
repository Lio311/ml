import { currentUser } from "@clerk/nextjs/server";

export async function checkAdmin() {
    const user = await currentUser();
    if (!user) return false;

    // Super Admin Hardcoded
    const email = user.emailAddresses?.[0]?.emailAddress;
    if (email === 'lior31197@gmail.com') return true;

    // Role Based
    const role = user.publicMetadata?.role;
    // Allowed roles for modifying data: admin, deputy
    // warehouse might need read-only or specific write, but for general "admin check" strictly for critical data:
    if (role === 'admin' || role === 'deputy') return true;

    return false;
}
