import Link from 'next/link';
import Image from 'next/image';
import pool from '../lib/db';
import { cookies } from 'next/headers';
import he from '../data/locales/he.json';
import en from '../data/locales/en.json';

const getT = (locale) => {
    const dict = locale === 'en' ? en : he;
    return (key) => {
        const keys = key.split('.');
        let result = dict;
        for (const k of keys) {
            if (result[k]) result = result[k];
            else return key;
        }
        return result;
    };
};

const localize = (obj, field, locale) => {
    if (!obj) return '';
    if (locale === 'en') {
        return obj[`${field}_en`] || obj[`${field}_EN`] || obj[field] || '';
    }
    return obj[`${field}_he`] || obj[`${field}_HE`] || obj[field] || '';
};

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const t = getT(locale);

    return {
        title: `${t('common.magazine_title')} | ml_tlv`,
        description: t('common.magazine_desc'),
        alternates: {
            canonical: 'https://www.ml-tlv.com/blog',
        },
        openGraph: {
            title: `${t('common.magazine_title')} | ml_tlv`,
            description: t('common.magazine_desc'),
            url: 'https://www.ml-tlv.com/blog',
            type: 'website'
        }
    };
}

async function getArticles(page = 1) {
    const LIMIT = 6;
    const OFFSET = (page - 1) * LIMIT;

    const client = await pool.connect();
    try {
        const res = await client.query('SELECT title, slug, excerpt, image_url, created_at, tags, title_en, excerpt_en FROM blog_posts ORDER BY created_at DESC LIMIT $1 OFFSET $2', [LIMIT, OFFSET]);
        const countRes = await client.query('SELECT COUNT(*) FROM blog_posts');

        return {
            articles: res.rows,
            total: parseInt(countRes.rows[0].count),
            totalPages: Math.ceil(parseInt(countRes.rows[0].count) / LIMIT)
        };
    } finally {
        client.release();
    }
}

export default async function BlogIndex(props) {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const t = getT(locale);
    const dir = locale === 'he' ? 'rtl' : 'ltr';

    const searchParams = await props.searchParams;
    const page = parseInt(searchParams?.page || '1');
    const { articles, totalPages } = await getArticles(page);

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container px-4">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-serif font-bold mb-4">{t('common.magazine_title')}</h1>
                    <p className="text-gray-500 max-w-2xl mx-auto">
                        {t('common.magazine_header_desc')}
                    </p>
                </div>

                {/* Blog ItemList Schema for rich search results */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "ItemList",
                            "name": locale === 'he' ? "מגזין הבשמים של ml-tlv" : "ml-tlv Fragrance Magazine",
                            "description": locale === 'he'
                                ? "מדריכים, סקירות וטיפים מעולם הבשמים והנישה"
                                : "Guides, reviews, and tips from the world of niche perfumery",
                            "numberOfItems": articles.length,
                            "itemListElement": articles.map((article, i) => ({
                                "@type": "ListItem",
                                "position": i + 1,
                                "url": `https://www.ml-tlv.com/blog/${article.slug}`,
                                "name": localize(article, 'title', locale),
                            }))
                        })
                    }}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                    {articles.map((article) => {
                        const readingTime = Math.ceil((article.excerpt?.length || 0) / 100) + 1; // Simple estimate
                        return (
                            <Link
                                key={article.slug}
                                href={`/blog/${article.slug}`}
                                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col h-full transform hover:-translate-y-2"
                            >
                                <div className="h-56 bg-gray-100 relative overflow-hidden">
                                    {article.image_url ? (
                                        <Image
                                            src={article.image_url}
                                            alt={article.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition duration-700"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center text-4xl transform group-hover:scale-110 transition duration-700">
                                            🧴
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 flex gap-1.5 flex-wrap z-10">
                                        {article.tags && article.tags.map(tag => (
                                            <span key={tag} className="bg-white/90 text-black text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md shadow-sm">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent"></div>
                                </div>

                                <div className={`p-7 flex flex-col flex-1 relative ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 tracking-widest mb-4">
                                        <span>{new Date(article.created_at).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US')}</span>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                        <span>{readingTime} {t('common.minutes_read')}</span>
                                    </div>
                                    
                                    <h2 className="text-2xl font-serif font-bold mb-4 group-hover:text-blue-600 transition-colors leading-tight">
                                        {localize(article, 'title', locale)}
                                    </h2>
                                    
                                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-6 flex-1">
                                        {localize(article, 'excerpt', locale)}
                                    </p>
                                    
                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="text-black font-bold text-xs uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                                            {t('common.read_more')}
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 ${dir === 'rtl' ? '' : 'rotate-180'}`}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                                            </svg>
                                        </span>
                                        
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2" dir={dir}>
                        {page > 1 && (
                            <Link
                                href={`/blog?page=${page - 1}`}
                                className="w-10 h-10 flex items-center justify-center rounded-lg border bg-white hover:bg-gray-50 text-gray-600"
                            >
                                {dir === 'rtl' ? '&gt;' : '&lt;'}
                            </Link>
                        )}

                        {[...Array(totalPages)].map((_, i) => {
                            const p = i + 1;
                            const isCurrent = p === page;
                            return (
                                <Link
                                    key={p}
                                    href={`/blog?page=${p}`}
                                    className={`w-10 h-10 flex items-center justify-center rounded-lg border transition ${isCurrent
                                        ? 'bg-black text-white border-black'
                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {p}
                                </Link>
                            );
                        })}

                        {page < totalPages && (
                            <Link
                                href={`/blog?page=${page + 1}`}
                                className="w-10 h-10 flex items-center justify-center rounded-lg border bg-white hover:bg-gray-50 text-gray-600"
                            >
                                {dir === 'rtl' ? '&lt;' : '&gt;'}
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
