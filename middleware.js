import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { rateLimit } from "./app/lib/rate-limit";

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
