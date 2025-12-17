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
        openGraph: {
            title: article.title,
            description: article.excerpt,
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
                <span className="font-bold text-black truncate max-w-[200px]">{article.title}</span>
            </nav>

            <article className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
                <header className="mb-8 border-b pb-8">
                    <div className="flex gap-2 mb-4">
                        {article.tags && article.tags.map(tag => (
                            <span key={tag} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-bold">
                                {tag}
                            </span>
                        ))}
                    </div>
                    <h1 className="text-3xl md:text-5xl font-serif font-bold mb-6 leading-tight">
                        {article.title}
                    </h1>
                    <div className="text-gray-500 text-sm">
                        פורסם בתאריך {new Date(article.created_at).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </header>

                <div
                    className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:font-bold prose-a:text-blue-600 prose-img:rounded-xl"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                ></div>
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
