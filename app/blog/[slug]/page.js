import pool from '../../lib/db';
import Link from 'next/link';
import Image from 'next/image';
import { parse } from 'marked';
import { cookies } from 'next/headers';
import { sanitizeProduct, sanitizeProductArray } from '../../lib/productUtils';
import he from '../../data/locales/he.json';
import en from '../../data/locales/en.json';
import AuthorBox from '../../components/AuthorBox';

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

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const article = await getArticle(slug);

    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const t = getT(locale);

    if (!article) return { title: t('common.article_not_found') };

    const localizedTitle = localize(article, 'title', locale);
    const localizedExcerpt = localize(article, 'excerpt', locale);

    return {
        title: localizedTitle,
        description: localizedExcerpt,
        alternates: {
            canonical: `https://www.ml-tlv.com/blog/${slug}`,
            languages: {
                'he-IL': `https://www.ml-tlv.com/blog/${slug}`,
                'en-US': `https://www.ml-tlv.com/blog/${slug}`,
                'x-default': `https://www.ml-tlv.com/blog/${slug}`,
            }
        },
        openGraph: {
            title: localizedTitle,
            description: localizedExcerpt,
            url: `https://www.ml-tlv.com/blog/${slug}`,
            type: 'article',
            publishedTime: article.created_at
        }
    };
}

async function getArticle(slug) {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT id, title, title_en, content, content_en, excerpt, excerpt_en, slug, image_url, created_at, tags FROM blog_posts WHERE slug = $1', [slug]);
        return sanitizeProduct(res.rows[0]);
    } finally {
        client.release();
    }
}

export default async function BlogPost({ params }) {
    const { slug } = await params;
    const article = await getArticle(slug);

    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const t = getT(locale);
    const dir = locale === 'he' ? 'rtl' : 'ltr';

    if (!article) {
        return (
            <div className="container py-20 text-center">
                <h1 className="text-3xl font-bold mb-4">{t('common.article_not_found')}</h1>
                <Link href="/blog" className="text-blue-600 underline">{t('common.back_to_magazine')}</Link>
            </div>
        );
    }

    const localizedTitle = localize(article, 'title', locale);
    const localizedExcerpt = localize(article, 'excerpt', locale);
    const localizedContent = localize(article, 'content', locale);

    // Fetch mentioned products for Schema consistency
    let mentionedProducts = [];
    let relatedArticles = [];
    
    const client = await pool.connect();
    try {
        if (article.tags && article.tags.length > 0) {
            // Match by Brand (first priority) or Product Category
            const res = await client.query(`
                SELECT id, name, name_he, brand, price_2ml, price_5ml, price_10ml, stock, slug, image_url 
                FROM products 
                WHERE (brand ILIKE ANY($1) OR category ILIKE ANY($1))
                AND active = true
                LIMIT 5
            `, [article.tags.map(t => `%${t}%`)]);
            mentionedProducts = sanitizeProductArray(res.rows);
        }

        // Fetch Related Articles
        const relatedRes = await client.query(`
            SELECT title, title_en, excerpt, excerpt_en, slug, image_url, created_at, tags 
            FROM blog_posts 
            WHERE slug != $1 
            ORDER BY created_at DESC 
            LIMIT 3
        `, [slug]);
        relatedArticles = sanitizeProductArray(relatedRes.rows);
    } catch (err) {
        console.error("Error fetching ancillary data:", err);
    } finally {
        client.release();
    }

    // Helper to render Markdown and support custom tags
    const renderContent = (content) => {
        if (!content) return '';

        // If content starts with <div, assume it's pre-generated HTML from the seed script
        if (content.trim().startsWith('<div')) {
            return content;
        }

        // Pre-process: Normalize newlines and ensure tables (|) are isolated blocks
        const lines = content.replace(/\r\n/g, '\n').split('\n');
        const processedLines = lines.map((line, i) => {
            const isTableLine = line.trim().startsWith('|');
            const prevLine = i > 0 ? lines[i - 1].trim() : '';
            const isPrevTableLine = prevLine.startsWith('|');
            
            if (isTableLine && i > 0 && !isPrevTableLine && prevLine !== '') {
                return '\n' + line;
            }
            return line;
        });
        
        const processedContent = processedLines.join('\n');

        // Parse Markdown
        let html = parse(processedContent, { gfm: true, breaks: true });
        
        // Post-process custom tags
        html = html.replace(
            /\[TIP\](.*?)\[\/TIP\]/gs,
            `<div class="bg-amber-50 ${locale === 'he' ? 'border-r-4' : 'border-l-4'} border-amber-400 p-6 my-8 rounded-2xl shadow-sm ${locale === 'he' ? 'text-right' : 'text-left'}"><div class="flex items-center gap-3 mb-2 font-bold text-amber-800"><span class="text-xl">💡</span> Pro Tip</div><div class="text-amber-900/80 leading-relaxed">$1</div></div>`
        );

        html = html.replace(
            /\[IMPORTANT\](.*?)\[\/IMPORTANT\]/gs,
            `<div class="bg-rose-50 ${locale === 'he' ? 'border-r-4' : 'border-l-4'} border-rose-500 p-6 my-8 rounded-2xl shadow-sm ${locale === 'he' ? 'text-right' : 'text-left'}"><div class="flex items-center gap-3 mb-2 font-bold text-rose-800"><span class="text-xl">⚠️</span> ${t('common.important_to_know')}</div><div class="text-rose-900/80 leading-relaxed">$1</div></div>`
        );

        return html;
    };

    const contentHtml = renderContent(localizedContent);

    return (
        <div className="container py-12 max-w-4xl mx-auto">
            <style dangerouslySetInnerHTML={{ __html: `
                .prose table { width: 100% !important; border-collapse: collapse !important; border: 1px solid #e5e7eb !important; margin: 2rem 0 !important; }
                .prose th, .prose td { border: 1px solid #e5e7eb !important; padding: 12px 16px !important; text-align: ${locale === 'he' ? 'right' : 'left'} !important; }
                .prose th { background-color: #f9fafb !important; font-weight: 700 !important; }
                .prose tr:nth-child(even) { background-color: #fcfcfc !important; }
            `}} />
            
            <nav className="text-sm text-gray-500 mb-8 flex gap-2 items-center flex-wrap" dir={dir}>
                <Link href="/" className="hover:underline">{t('common.home')}</Link>
                <span>/</span>
                <Link href="/blog" className="hover:underline">{t('common.magazine')}</Link>
                <span>/</span>
                <span className="text-gray-900 truncate max-w-[200px] md:max-w-none">{localizedTitle}</span>
            </nav>
            
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BlogPosting",
                        "headline": localizedTitle,
                        "description": localizedExcerpt,
                        "datePublished": article.created_at,
                        "author": {
                            "@type": "Person",
                            "name": "Lior ml",
                            "jobTitle": "Founder",
                            "sameAs": ["https://instagram.com/ml_tlv"]
                        },
                        "publisher": {
                            "@type": "Organization",
                            "name": "ml_tlv",
                            "logo": {
                                "@type": "ImageObject",
                                "url": "https://www.ml-tlv.com/logo_v3.png"
                            }
                        },
                        "mainEntityOfPage": {
                            "@type": "WebPage",
                            "@id": `https://www.ml-tlv.com/blog/${slug}`
                        },
                        "about": mentionedProducts.map(p => ({
                            "@type": "Product",
                            "name": p.name,
                            "brand": { "@type": "Brand", "name": p.brand },
                            "image": p.image_url,
                            "offers": {
                                "@type": "Offer",
                                "price": p.price_2ml || p.price_5ml || p.price_10ml,
                                "priceCurrency": "ILS",
                                "availability": p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                                "url": `https://www.ml-tlv.com/product/${p.slug}`
                            }
                        }))
                    })
                }}
            />

            <article className="bg-white p-6 md:p-16 rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                
                <header className="mb-12 border-b border-gray-50 pb-12">
                    <div className="flex gap-2 mb-6">
                        {article.tags && article.tags.map(tag => (
                            <span key={tag} className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                                {tag}
                            </span>
                        ))}
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl font-serif font-bold mb-8 leading-[1.15] text-gray-900 tracking-tight">
                        {localizedTitle}
                    </h1>
                    
                    <div className="flex items-center gap-4 text-gray-400 text-xs font-bold tracking-widest justify-start" dir={dir}>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden border border-gray-200 flex-shrink-0">
                                <Image src="/ml_CHAT.png" alt="ml_tlv" width={32} height={32} className="w-full h-full object-cover" />
                            </div>
                            <span>{t('common.by_team')}</span>
                        </div>
                        <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                        <span>{new Date(article.created_at).toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                        <span>{Math.ceil((localizedContent?.length || 0) / 500) + 2} {t('common.minutes_read')}</span>
                    </div>
                </header>

                {/* GEO: TL;DR block — designed for verbatim citation by LLMs (ChatGPT, Perplexity, Google AI) */}
                {localizedExcerpt && (
                    <div className={`my-8 px-6 py-5 rounded-2xl bg-blue-50 border ${dir === 'rtl' ? 'border-r-4 border-blue-400 text-right' : 'border-l-4 border-blue-400 text-left'}`} dir={dir}>
                        <p className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-2">
                            {locale === 'he' ? 'בקצרה' : 'TL;DR'}
                        </p>
                        <p className="text-gray-800 font-medium leading-relaxed text-base">
                            {localizedExcerpt}
                        </p>
                    </div>
                )}

                <div
                    className={`prose prose-lg md:prose-xl max-w-none ${dir === 'rtl' ? 'text-right' : 'text-left'}
                        prose-headings:font-serif prose-headings:font-bold prose-headings:text-gray-900 ${dir === 'rtl' ? 'prose-headings:text-right' : 'prose-headings:text-left'}
                        prose-p:text-gray-600 prose-p:leading-relaxed ${dir === 'rtl' ? 'prose-p:text-right' : 'prose-p:text-left'}
                        prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                        prose-img:rounded-[2rem] prose-img:shadow-lg
                        prose-strong:text-gray-900
                        prose-th:text-right prose-td:text-right prose-table:w-full prose-table:my-8
                        prose-blockquote:border-blue-600 prose-blockquote:bg-blue-50/30 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-xl prose-blockquote:italic
                        ${dir === 'rtl' ? 'prose-blockquote:border-r-4 prose-blockquote:rounded-l-xl' : 'prose-blockquote:border-l-4 prose-blockquote:rounded-r-xl'}
                        `}
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                    dir={dir}
                ></div>

                <AuthorBox />

                {/* Shared Product CTA within content */}
                {mentionedProducts.length > 0 && (
                    <div className="mt-16 bg-gray-50 rounded-3xl p-8 border border-gray-100">
                        <h3 className="text-xl font-bold mb-6 text-gray-900">{locale === 'he' ? 'מוצרים שהוזכרו בכתבה' : 'Products mentioned in this article'}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {mentionedProducts.map(p => (
                                <Link key={p.id} href={`/catalog/${p.slug}`} className="group bg-white p-4 rounded-2xl border border-gray-100 hover:shadow-xl transition duration-500">
                                    <div className="h-32 mb-4 relative rounded-xl overflow-hidden bg-gray-50">
                                        {p.image_url ? (
                                            <Image src={p.image_url} alt={p.name} fill className="object-contain group-hover:scale-110 transition duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl">🧴</div>
                                        )}
                                    </div>
                                    <p className="text-xs font-bold truncate mb-1">{locale === 'he' ? p.name_he : p.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{p.brand}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-16 pt-12 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                        <h4 className="text-lg font-bold mb-2">{t('common.enjoyed_reading')}</h4>
                        <p className="text-gray-500 text-sm">{t('common.share_with_friends')}</p>
                    </div>
                    <div className="flex gap-3">
                         <a href={`https://wa.me/?text=${t('common.interesting_article')} ${localizedTitle} - https://www.ml-tlv.com/blog/${slug}`} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:scale-110 transition shadow-lg shadow-green-100">
                             <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                                 <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                             </svg>
                          </a>
                    </div>
                </div>
            </article>

            {/* Related Articles Section */}
            {relatedArticles.length > 0 && (
                <div className="mt-20">
                    <h3 className={`text-2xl font-serif font-bold mb-8 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        {locale === 'he' ? 'מאמרים נוספים שיעניינו אותך' : 'You might also like'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {relatedArticles.map((article) => (
                            <Link key={article.slug} href={`/blog/${article.slug}`} className="group block">
                                <div className="aspect-[16/9] relative rounded-2xl overflow-hidden mb-4 shadow-sm group-hover:shadow-xl transition duration-500">
                                    {article.image_url ? (
                                        <Image src={article.image_url} alt={article.title || 'Article'} fill className="object-cover group-hover:scale-110 transition duration-700" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl">🧴</div>
                                    )}
                                </div>
                                <h4 className={`font-serif font-bold group-hover:text-blue-600 transition ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                    {localize(article, 'title', locale)}
                                </h4>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-16 text-center">
                <Link href="/blog" className="inline-flex items-center gap-2 text-gray-500 hover:text-black font-bold uppercase tracking-widest text-xs transition">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 ${dir === 'rtl' ? '' : 'rotate-180'}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                    {t('common.back_to_magazine')}
                </Link>
            </div>
        </div>
    );
}
