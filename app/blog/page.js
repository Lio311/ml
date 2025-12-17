import Link from 'next/link';
import pool from '../lib/db';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'מגזין הבישום | ml_tlv',
    description: 'כתבות, סקירות, מדריכים וטיפים על עולם הבישום, דוגמיות בשמים ומותגי נישה.',
    openGraph: {
        title: 'מגזין הבישום | ml_tlv',
        description: 'הבלוג הרשמי של ml_tlv - כל המידע על עולם דוגמיות הבושם.',
        type: 'website'
    }
};

async function getArticles(page = 1) {
    const LIMIT = 6;
    const OFFSET = (page - 1) * LIMIT;

    const client = await pool.connect();
    try {
        const res = await client.query('SELECT title, slug, excerpt, image_url, created_at, tags FROM blog_posts ORDER BY created_at DESC LIMIT $1 OFFSET $2', [LIMIT, OFFSET]);
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
    const searchParams = await props.searchParams;
    const page = parseInt(searchParams?.page || '1');
    const { articles, totalPages } = await getArticles(page);

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-serif font-bold mb-4">מגזין הבישום</h1>
                    <p className="text-gray-500 max-w-2xl mx-auto">
                        ברוכים הבאים לבלוג שלנו. כאן תמצאו את כל המידע שצריך לדעת על עולם הבישום,
                        סקירות של מותגי נישה מובילים וטיפים לבחירת הריח הבא שלכם.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                    {articles.map((article) => (
                        <Link
                            key={article.slug}
                            href={`/blog/${article.slug}`}
                            className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full"
                        >
                            <div className="h-48 bg-gray-100 relative overflow-hidden">
                                {article.image_url && article.image_url.startsWith('/') ? (
                                    // Use absolute path for generated images or placeholders
                                    <img
                                        src={article.image_url}
                                        alt={article.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-4xl">
                                        🧴
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-1 flex-wrap">
                                    {article.tags && article.tags.map(tag => (
                                        <span key={tag} className="bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 flex flex-col flex-1">
                                <div className="text-xs text-gray-400 mb-2">
                                    {new Date(article.created_at).toLocaleDateString('he-IL')}
                                </div>
                                <h2 className="text-xl font-bold mb-3 group-hover:text-blue-600 transition">
                                    {article.title}
                                </h2>
                                <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">
                                    {article.excerpt}
                                </p>
                                <span className="text-blue-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                    קרא עוד
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                                    </svg>
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2" dir="ltr">
                        {page > 1 && (
                            <Link
                                href={`/blog?page=${page - 1}`}
                                className="w-10 h-10 flex items-center justify-center rounded-lg border bg-white hover:bg-gray-50 text-gray-600"
                            >
                                &lt;
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
                                &gt;
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
