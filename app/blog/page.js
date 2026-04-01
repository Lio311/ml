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

async function getArticles(page = 1, tag = null) {
    const GRID_SIZE = 9;
    const hasFeaturedPost = !tag;

    let offset = (page - 1) * GRID_SIZE;
    let limit = GRID_SIZE;

    if (hasFeaturedPost) {
        if (page === 1) {
            offset = 0;
            limit = GRID_SIZE + 1; // 1 featured + 9 grid
        } else {
            offset = ((page - 1) * GRID_SIZE) + 1; // skip the 1 featured post from page 1
            limit = GRID_SIZE;
        }
    } else {
        limit = GRID_SIZE;
    }

    const client = await pool.connect();
    try {
        let query = 'SELECT title, slug, excerpt, image_url, created_at, tags, title_en, excerpt_en FROM blog_posts';
        let params = [limit, offset];
        
        if (tag) {
            query += ' WHERE $3 = ANY(tags)';
            params.push(tag);
        }
        
        query += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';
        
        const res = await client.query(query, params);
        
        let countQuery = 'SELECT COUNT(*) FROM blog_posts';
        let countParams = [];
        if (tag) {
            countQuery += ' WHERE $1 = ANY(tags)';
            countParams.push(tag);
        }
        const countRes = await client.query(countQuery, countParams);

        const totalCount = parseInt(countRes.rows[0].count);
        let totalPages = 1;
        
        if (hasFeaturedPost) {
            if (totalCount > GRID_SIZE + 1) {
                totalPages = 1 + Math.ceil((totalCount - (GRID_SIZE + 1)) / GRID_SIZE);
            }
        } else {
            totalPages = Math.ceil(totalCount / GRID_SIZE);
        }

        // Fetch all unique tags for the filter bar
        const tagsRes = await client.query('SELECT DISTINCT unnest(tags) as tag FROM blog_posts LIMIT 20');

        return {
            articles: res.rows,
            total: totalCount,
            totalPages: totalPages,
            allTags: tagsRes.rows.map(r => r.tag)
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
    const activeTag = searchParams?.tag || null;
    const { articles, totalPages, allTags } = await getArticles(page, activeTag);

    // Featured article for the first page
    const featuredArticle = (page === 1 && articles.length > 0 && !activeTag) ? articles[0] : null;
    const gridArticles = featuredArticle ? articles.slice(1) : articles;

    return (
        <div className="min-h-screen bg-[#fafafa] py-12 md:py-20" dir={dir}>
            <div className="container px-4">
                <header className="mb-16">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                            <h1 className="text-5xl md:text-7xl font-serif font-black mb-6 tracking-tight text-gray-900">
                                {t('common.magazine_title')}
                                <span className="text-blue-600">.</span>
                            </h1>
                            <p className="text-gray-500 max-w-xl text-lg font-medium leading-relaxed">
                                {t('common.magazine_header_desc')}
                            </p>
                        </div>
                        
                        {/* Tag Filter Bar */}
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                            <Link 
                                href="/blog" 
                                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${!activeTag ? 'bg-black text-white border-black shadow-lg shadow-black/10' : 'bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black'}`}
                            >
                                {locale === 'he' ? 'הכל' : 'All Articles'}
                            </Link>
                            {allTags.map(tag => (
                                <Link 
                                    key={tag}
                                    href={`/blog?tag=${tag}`} 
                                    className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${activeTag === tag ? 'bg-black text-white border-black shadow-lg shadow-black/10' : 'bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black'}`}
                                >
                                    {tag}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Featured Hero Article */}
                    {featuredArticle && (
                        <Link 
                            href={`/blog/${featuredArticle.slug}`}
                            className="group relative block w-full h-[600px] rounded-[3rem] overflow-hidden shadow-2xl border border-gray-100 mb-20 bg-black"
                        >
                             <Image 
                                src={featuredArticle.image_url} 
                                alt={featuredArticle.title}
                                fill
                                className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000"
                                priority
                                sizes="100vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                            
                            <div className={`absolute bottom-0 left-0 right-0 p-8 md:p-16 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                <div className="flex gap-2 mb-6">
                                    {featuredArticle.tags && featuredArticle.tags.map(tag => (
                                        <span key={tag} className="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight max-w-4xl tracking-tight">
                                    {localize(featuredArticle, 'title', locale)}
                                </h2>
                                <p className="text-gray-300 text-lg md:text-xl max-w-2xl font-light leading-relaxed mb-8 line-clamp-2">
                                    {localize(featuredArticle, 'excerpt', locale)}
                                </p>
                                <div className="inline-flex items-center gap-3 bg-white text-black px-8 py-3.5 rounded-full font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition duration-300 transform group-hover:translate-x-2">
                                    {t('common.read_more')}
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    )}
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 mb-20">
                    {gridArticles.map((article) => {
                        const readingTime = Math.ceil((article.excerpt?.length || 0) / 100) + 1;
                        return (
                            <Link
                                key={article.slug}
                                href={`/blog/${article.slug}`}
                                className="group flex flex-col h-full"
                            >
                                <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden rounded-[2.5rem] shadow-sm mb-6 border border-gray-100">
                                    {article.image_url ? (
                                        <Image
                                            src={article.image_url}
                                            alt={article.title}
                                            fill
                                            className="object-cover group-hover:scale-110 transition duration-1000 ease-out"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center text-4xl">
                                            🧴
                                        </div>
                                    )}
                                    <div className={`absolute top-6 ${dir === 'rtl' ? 'right-6' : 'left-6'} flex gap-1.5 flex-wrap z-10`}>
                                        {article.tags && article.tags.slice(0, 2).map(tag => (
                                            <span key={tag} className="bg-white/80 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl backdrop-blur-xl border border-white/40 shadow-sm">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition duration-700"></div>
                                </div>

                                <div className={`flex flex-col flex-1 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 tracking-widest mb-4 uppercase">
                                        <span>{new Date(article.created_at).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US')}</span>
                                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                                        <span>{readingTime} {t('common.minutes_read')}</span>
                                    </div>
                                    
                                    <h2 className="text-2xl md:text-3xl font-serif font-bold mb-4 group-hover:text-blue-600 transition-colors leading-tight tracking-tight text-gray-900">
                                        {localize(article, 'title', locale)}
                                    </h2>
                                    
                                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-6 flex-1 font-medium italic">
                                        {localize(article, 'excerpt', locale)}
                                    </p>
                                    
                                    <div className="flex items-center gap-2 text-black font-black text-[10px] uppercase tracking-[0.2em] group-hover:text-blue-600 transition-all transform group-hover:translate-x-1">
                                        {t('common.read_more')}
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-3 h-3 ${dir === 'rtl' ? 'rotate-180' : ''}`}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-3 mt-12 py-12 border-t border-gray-100">
                        {page > 1 && (
                            <Link
                                href={`/blog?page=${page - 1}${activeTag ? `&tag=${activeTag}` : ''}`}
                                className="w-12 h-12 flex items-center justify-center rounded-2xl border border-gray-200 bg-white hover:border-black transition"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 ${dir === 'rtl' ? 'rotate-180' : ''}`}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                                </svg>
                            </Link>
                        )}

                        <div className="flex gap-2">
                        {[...Array(totalPages)].map((_, i) => {
                            const p = i + 1;
                            const isCurrent = p === page;
                            return (
                                <Link
                                    key={p}
                                    href={`/blog?page=${p}${activeTag ? `&tag=${activeTag}` : ''}`}
                                    className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition duration-300 font-bold text-xs ${isCurrent
                                        ? 'bg-black text-white border-black shadow-xl shadow-black/20 transform -translate-y-1'
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-black'
                                        }`}
                                >
                                    {p}
                                </Link>
                            );
                        })}
                        </div>

                        {page < totalPages && (
                            <Link
                                href={`/blog?page=${page + 1}${activeTag ? `&tag=${activeTag}` : ''}`}
                                className="w-12 h-12 flex items-center justify-center rounded-2xl border border-gray-200 bg-white hover:border-black transition"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 ${dir === 'rtl' ? 'rotate-180' : ''}`}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                </svg>
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
