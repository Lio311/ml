import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="border-t bg-black text-white py-8 relative z-20">
            <div className="container grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-right">

                <div>
                    <h3 className="text-lg font-bold mb-4">ml_tlv</h3>
                    <p className="text-sm text-gray-400">
                        דוגמיות בשמים יוקרתיות במחירים הוגנים.
                        <br />
                        נבחרו בקפידה כדי שתמצאו את הריח שלכם.
                    </p>
                    <div className="mt-4">
                        <Link href="/catalogs-info" className="text-yellow-400 font-bold hover:underline transition">
                            צור חנות משלך!
                        </Link>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold mb-4">מותגים פופולריים</h3>
                    <ul className="grid grid-cols-2 gap-x-2 gap-y-2 text-xs text-right text-gray-400">
                        <li><Link href="/brands/Xerjoff" className="hover:text-white">Xerjoff</Link></li>
                        <li><Link href="/brands/Creed" className="hover:text-white">Creed</Link></li>
                        <li><Link href="/brands/Kilian" className="hover:text-white">Kilian</Link></li>
                        <li><Link href="/brands/Initio" className="hover:text-white">Initio</Link></li>
                        <li><Link href="/brands/Casamorati" className="hover:text-white">Casamorati</Link></li>
                        <li><Link href="/brands/Amouage" className="hover:text-white">Amouage</Link></li>
                        <li><Link href="/brands/Nishane" className="hover:text-white">Nishane</Link></li>
                        <li><Link href="/brands/Roja" className="hover:text-white">Roja</Link></li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-lg font-bold mb-4">קטגוריות מובילות</h3>
                    <ul className="space-y-2 text-sm text-gray-400">
                        <li><Link href="/catalog?category=בוטיק" className="hover:text-white">בשמי בוטיק</Link></li>
                        <li><Link href="/catalog?category=נישה" className="hover:text-white">בשמי נישה</Link></li>
                        <li><Link href="/catalog?category=דיזיינר" className="hover:text-white">בשמי דיזיינר</Link></li>
                        <li><Link href="/catalog?category=יוניסקס" className="hover:text-white">בשמי יוניסקס</Link></li>
                        <li><Link href="/catalog?category=גברים" className="hover:text-white">בשמים לגברים</Link></li>
                        <li><Link href="/catalog?category=נשים" className="hover:text-white">בשמים לנשים</Link></li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-lg font-bold mb-4">עקבו אחרינו</h3>
                    <a
                        href="https://instagram.com/ml_tlv"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24" height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="bg-gradient-to-tr from-yellow-400 to-purple-600 text-white rounded-lg p-0.5" // Optional colorful bg or just stroke
                        >
                            {/* Standard Instagram Icon needs path */}
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                        <span>ml_tlv@</span>
                    </a>

                    <div className="mt-4 space-y-2">
                        <Link href="/blog" className="text-sm text-gray-400 hover:text-white transition block">
                            מגזין הבישום - כתבות ומדריכים
                        </Link>
                        <Link href="/reviews" className="text-sm text-gray-400 hover:text-white transition block">
                            ביקורות גולשים על דוגמיות בשמים
                        </Link>
                        <div className="pt-4 space-y-2 border-t border-gray-800">
                            <Link href="/about" className="text-xs text-gray-500 hover:text-gray-300 block">אודות</Link>
                            <Link href="/faq" className="text-xs text-gray-500 hover:text-gray-300 block">שאלות ותשובות</Link>
                            <Link href="/contact" className="text-xs text-gray-500 hover:text-gray-300 block">צור קשר</Link>
                            <Link href="/terms" className="text-xs text-gray-500 hover:text-gray-300 block">תקנון ומשלוחים</Link>
                        </div>
                    </div>
                </div>

            </div>
            <div className="container mt-8 pt-4 border-t border-gray-800 text-center text-xs text-gray-500">
                © 2022 ml_tlv. כל הזכויות שמורות.
            </div>
        </footer>
    );
}
