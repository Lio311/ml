import pool from '../../lib/db';
import Link from 'next/link';
import Image from 'next/image';

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
            <nav className="text-sm text-gray-500 mb-8 flex gap-2 items-center flex-wrap">
                <Link href="/" className="hover:underline">ראשי</Link>
                <span>/</span>
                <Link href="/blog" className="hover:underline">מגזין</Link>
                <span>/</span>
                <span className="text-gray-900 truncate max-w-[200px] md:max-w-none">{article.title}</span>
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
                            <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                                <Image src="/ml_CHAT.png" alt="ml_tlv" width={32} height={32} className="w-full h-full object-cover" />
                            </div>
                            <span>מאת צוות ml_tlv</span>
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
                            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
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
