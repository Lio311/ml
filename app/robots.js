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
                    '/*?sort=*',
                    '/*?min=*',
                    '/*?max=*',
                    '/*?page=*',
                    '/*&sort=*',
                    '/*&min=*',
                    '/*&max=*',
                    '/*&page=*',
                ],
            }
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
