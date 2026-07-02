import { NextResponse } from 'next/server';

export async function middleware(request) {
    const url = request.nextUrl.clone();
    
    // We avoid hitting the API for every single asset request
    if (url.pathname.startsWith('/_next') || 
        url.pathname.startsWith('/static') || 
        url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico)$/)) {
        return NextResponse.next();
    }

    // Do not redirect admin routes, API routes, sign-in, or the maintenance page itself
    if (url.pathname.startsWith('/admin') || 
        url.pathname.startsWith('/api') || 
        url.pathname.startsWith('/sign-in') || 
        url.pathname === '/maintenance') {
        return NextResponse.next();
    }

    try {
        // Fetch maintenance status from our edge-compatible API
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
        const res = await fetch(`${baseUrl}/api/maintenance`, {
            next: { revalidate: 60 } // Cache for 60 seconds
        });
        
        if (res.ok) {
            const data = await res.json();
            if (data.enabled) {
                url.pathname = '/maintenance';
                return NextResponse.rewrite(url);
            }
        }
    } catch (err) {
        console.error('Middleware maintenance check failed:', err);
        // Fail open - don't block traffic if DB is down, or maybe we want to fail closed?
        // Usually better to fail open to avoid accidental lockouts.
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
