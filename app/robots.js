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
                    '/_next/static/',
                    '/*?sort=*',
                    '/*?min=*',
                    '/*?max=*',
                    '/*?page=*',
                    '/*&sort=*',
                    '/*&min=*',
                    '/*&max=*',
                    '/*&page=*',
                ],
            },
            // Explicitly allow AI crawlers
            {
                userAgent: 'GPTBot',
                allow: '/',
            },
            {
                userAgent: 'ChatGPT-User',
                allow: '/',
            },
            {
                userAgent: 'PerplexityBot',
                allow: '/',
            },
            {
                userAgent: 'Google-Extended',
                allow: '/',
            },
            {
                userAgent: 'ClaudeBot',
                allow: '/',
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
