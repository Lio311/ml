import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { rateLimit } from "./app/lib/rate-limit";
import { neon } from "@neondatabase/serverless";

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
const isApiRoute = createRouteMatcher(['/api(.*)']);

export default clerkMiddleware(async (auth, req) => {
    const url = req.nextUrl.clone();
    const hostname = req.headers.get('host') || '';
    const xForwardedProto = req.headers.get('x-forwarded-proto') || 'http';

    // 1. Force HTTPS and WWW (SEO Improvement)
    // Only apply in production
    if (process.env.NODE_ENV === 'production') {
        let redirectNeeded = false;
        
        // Check for non-www
        if (hostname === 'ml-tlv.com') {
            url.hostname = 'www.ml-tlv.com';
            redirectNeeded = true;
        }

        // Check for http
        if (xForwardedProto === 'http') {
            url.protocol = 'https:';
            redirectNeeded = true;
        }

        if (redirectNeeded) {
            return NextResponse.redirect(url, 301);
        }
    }

    if (isBadBot(req)) {
        return new NextResponse("Access Denied: Bot Detected", { status: 403 });
    }

    // Rate Limiting for API routes
    if (isApiRoute(req)) {
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
        // Limit to 60 requests per minute for APIs
        const { success } = rateLimit(ip, 60, 60000);
        
        if (!success) {
            return new NextResponse("Too Many Requests", { status: 429 });
        }
    }

    const bypassCookie = req.cookies.get('bypass_maintenance');
    const userAuth = await auth();
    const isAdmin = userAuth.sessionClaims?.metadata?.role === 'admin';

    // Maintenance Mode — query DB directly (no self-fetch!)
    if (!url.pathname.startsWith('/admin') &&
        !url.pathname.startsWith('/api') &&
        !url.pathname.startsWith('/sign-in') &&
        url.pathname !== '/maintenance' &&
        bypassCookie?.value !== 'true') {
        try {
            const sql = neon(process.env.DATABASE_URL);
            const rows = await sql`SELECT value FROM site_settings WHERE key = 'maintenance_mode'`;
            if (rows.length > 0) {
                const parsed = typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value;
                if (parsed?.enabled) {
                    url.pathname = '/maintenance';
                    const rewriteRes = NextResponse.rewrite(url);
                    rewriteRes.headers.set('x-maintenance', 'true');
                    return rewriteRes;
                }
            }
        } catch (err) {
            console.error('Middleware maintenance check failed:', err);
        }
    }

    // Protect admin routes
    if (isAdminRoute(req)) {
        // Protect admin routes: Must be logged in
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
