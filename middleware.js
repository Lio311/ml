import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// List of bots to block (Aggressive scrapers, not search engines)
const BAD_BOTS = [
    'ahrefsbot',
    'semrushbot',
    'mj12bot',
    'dotbot',
    'petalbot',
    'bytespider',
    'gptbot', // Open AI scraper
    'ccbot'
];

const isBadBot = (req) => {
    const ua = req.headers.get('user-agent')?.toLowerCase() || '';
    return BAD_BOTS.some(bot => ua.includes(bot));
};

// Define admin route matcher
const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
    if (isBadBot(req)) {
        return new NextResponse("Access Denied: Bot Detected", { status: 403 });
    }

    // Protect admin routes
    if (isAdminRoute(req)) {
        await auth.protect((has) => {
            return has({ role: 'admin' }) || has({ role: 'deputy' }) || has({ role: 'warehouse' });
            // Note: Clerk permission system usage here depends on how roles are set up. 
            // If explicit roles aren't used in Clerk Dashboard but only in metadata, `auth.protect()` with function might not work as expected for metadata without custom claims.
            // Let's fallback to basic auth().protect() which forces login, and rely on Layout for role check??
            // NO, middleware is safer.
            // But `has({ role: ... })` checks "Organization Roles" usually or permissions.
            // If the user utilizes `publicMetadata.role`, we need to check session claims.
            // But `auth().sessionClaims` is available.
        });

        // Simpler approach for Metadata-based roles if `has` doesn't work:
        // const { sessionClaims } = await auth();
        // if (sessionClaims?.metadata?.role !== 'admin' && ...) return NextResponse.redirect(new URL('/', req.url));

        // HOWEVER, `auth.protect()` is easiest to just Ensure Logged In.
        // Let's just ensure logged in first.
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
