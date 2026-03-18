import pool from '../../lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const article = await getArticle(slug);

    if (!article) return { title: 'מאמר לא נמצא' };

    return {
        title: `${article.title} | ml_tlv`,
        description: article.excerpt,
        alternates: {
            canonical: `https://www.ml-tlv.com/blog/${slug}`,
        },
        openGraph: {
            title: article.title,
            description: article.excerpt,
            url: `https://www.ml-tlv.com/blog/${slug}`,
            type: 'article',
            publishedTime: article.created_at
        }
    };
}

async function getArticle(slug) {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT * FROM blog_posts WHERE slug = $1', [slug]);
        return res.rows[0];
    } finally {
        client.release();
    }
}

export default async function BlogPost({ params }) {
    const { slug } = await params;
    const article = await getArticle(slug);

    if (!article) {
        return (
            <div className="container py-20 text-center">
                <h1 className="text-3xl font-bold mb-4">המאמר לא נמצא</h1>
                <Link href="/blog" className="text-blue-600 underline">חזרה למגזין</Link>
            </div>
        );
    }

    return (
        <div className="container py-12 max-w-4xl mx-auto">
            <nav className="text-sm text-gray-500 mb-8 flex gap-2 items-center">
                <Link href="/" className="hover:underline">ראשי</Link>
                <span>/</span>
                <Link href="/blog" className="hover:underline">מגזין</Link>
                <span>/</span>
            </nav>
            
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BlogPosting",
                        "headline": article.title,
                        "description": article.excerpt,
                        "datePublished": article.created_at,
                        "author": {
                            "@type": "Organization",
                            "name": "ml_tlv"
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
                        }
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
                        {article.title}
                    </h1>
                    
                    <div className="flex items-center gap-4 text-gray-400 text-xs font-bold uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">ML</div>
                            <span>מאת צוות ML_TLV</span>
                        </div>
                        <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                        <span>{new Date(article.created_at).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                        <span>{Math.ceil((article.content?.length || 0) / 500) + 2} דקות קריאה</span>
                    </div>
                </header>

                <div
                    className="prose prose-lg md:prose-xl max-w-none 
                        prose-headings:font-serif prose-headings:font-bold prose-headings:text-gray-900
                        prose-p:text-gray-600 prose-p:leading-relaxed
                        prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                        prose-img:rounded-[2rem] prose-img:shadow-lg
                        prose-strong:text-gray-900
                        prose-blockquote:border-r-4 prose-blockquote:border-blue-600 prose-blockquote:bg-blue-50/30 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-l-xl prose-blockquote:italic
                        "
                    dangerouslySetInnerHTML={{ 
                        __html: article.content.replace(
                            /\[TIP\](.*?)\[\/TIP\]/gs, 
                            '<div class="bg-amber-50 border-r-4 border-amber-400 p-6 my-8 rounded-l-2xl shadow-sm"><div class="flex items-center gap-3 mb-2 font-bold text-amber-800"><span class="text-xl">💡</span> Pro Tip</div><div class="text-amber-900/80 leading-relaxed">$1</div></div>'
                        ) 
                    }}
                ></div>

                <div className="mt-16 pt-12 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <h4 className="text-lg font-bold mb-2">נהניתם מהקריאה?</h4>
                        <p className="text-gray-500 text-sm">שתפו את המאמר עם חברים חובבי בישום</p>
                    </div>
                    <div className="flex gap-3">
                         <a href={`https://wa.me/?text=מצאתי מאמר מעניין במגזין ml_tlv: ${article.title} - https://www.ml-tlv.com/blog/${slug}`} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center hover:scale-110 transition shadow-lg shadow-green-200">
                            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.319 1.592 5.548 0 10.058-4.51 10.06-10.059 0-2.689-1.046-5.217-2.946-7.117s-4.43-2.946-7.119-2.946c-5.544 0-10.059 4.51-10.061 10.059-.001 2.12.539 4.113 1.561 5.829l-.994 3.635 3.713-.974zm12.081-7.712c-.033-.055-.123-.082-.258-.15s-.803-.396-.926-.441-.212-.067-.3-.067-.175.021-.25.132-.287.441-.352.508-.13.123-.265.055-.54-.224-.894-.539c-.276-.246-.463-.55-.517-.641s-.019-.138.049-.206c.06-.061.134-.157.2-.236s.089-.132.133-.221.022-.17-.011-.238-.25-.6-.341-.823c-.08-.194-.161-.167-.25-.167s-.183-.007-.282-.007-.259.037-.394.183-.518.508-.518 1.242.54 1.444.613 1.541.05.066 1.063 1.626c.469.722.862 1.144 1.309 1.359.447.215.753.23 1.02.188.298-.046.803-.328.915-.644s.112-.587.078-.644z"/></svg>
                         </a>
                    </div>
                </div>
            </article>

            <div className="mt-12 text-center">
                <h3 className="text-xl font-bold mb-4">אהבתם את המאמר?</h3>
                <Link href="/catalog" className="btn btn-primary px-8 py-3 text-lg">
                    גלו את הקטלוג שלנו
                </Link>
            </div>
        </div>
    );
}
