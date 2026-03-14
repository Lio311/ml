export default function robots() {
    const baseUrl = 'https://www.ml-tlv.com';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin', '/api'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
