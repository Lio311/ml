export default function robots() {
    const baseUrl = 'https://www.ml-tlv.com';

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/admin',
                    '/api',
                    '/sign-in',
                    '/sign-up',
                    '/checkout',
                    '/inbox',
                    '/wishlist',
                    '/orders',
                    '/review',
                    '/my-catalogs',
                    '/unsubscribe',
                    '/lottery',
                    '/maintenance',
                    '/matching',
                    '/requests',
                    '/app',
                ],
            },
            // Explicitly allow AI crawlers
            {
                userAgent: 'GPTBot',
                allow: '/',
                disallow: ['/admin', '/api', '/sign-in', '/sign-up', '/checkout', '/inbox', '/wishlist', '/orders', '/review', '/my-catalogs', '/unsubscribe', '/maintenance', '/requests', '/app'],
            },
            {
                userAgent: 'ChatGPT-User',
                allow: '/',
                disallow: ['/admin', '/api', '/sign-in', '/sign-up', '/checkout', '/inbox', '/wishlist', '/orders', '/review', '/my-catalogs', '/unsubscribe', '/maintenance', '/requests', '/app'],
            },
            {
                userAgent: 'PerplexityBot',
                allow: '/',
                disallow: ['/admin', '/api', '/sign-in', '/sign-up', '/checkout', '/inbox', '/wishlist', '/orders', '/review', '/my-catalogs', '/unsubscribe', '/maintenance', '/requests', '/app'],
            },
            {
                userAgent: 'Google-Extended',
                allow: '/',
                disallow: ['/admin', '/api', '/sign-in', '/sign-up', '/checkout', '/inbox', '/wishlist', '/orders', '/review', '/my-catalogs', '/unsubscribe', '/maintenance', '/requests', '/app'],
            },
            {
                userAgent: 'ClaudeBot',
                allow: '/',
                disallow: ['/admin', '/api', '/sign-in', '/sign-up', '/checkout', '/inbox', '/wishlist', '/orders', '/review', '/my-catalogs', '/unsubscribe', '/maintenance', '/requests', '/app'],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
