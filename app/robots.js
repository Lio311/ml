import { headers } from 'next/headers';

export default function robots() {
    const headersList = headers();
    const host = headersList.get('host');
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin', '/api'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
