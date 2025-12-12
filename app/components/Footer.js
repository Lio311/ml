import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="border-t bg-black text-white py-8 mt-12">
            <div className="container grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-right">

                <div>
                    <h3 className="text-lg font-bold mb-4">ml_tlv</h3>
                    <p className="text-sm text-gray-400">
                        דוגמיות בשמים יוקרתיות במחירים הוגנים.
                        <br />
                        נבחרו בקפידה כדי שתמצאו את הריח שלכם.
                    </p>
                </div>

                <div>
                    <h3 className="text-lg font-bold mb-4">קישורים</h3>
                    <ul className="space-y-2 text-sm text-gray-400">
                        <li><Link href="/catalog">קטלוג</Link></li>
                        <li><Link href="/terms">תקנון</Link></li>
                        <li><Link href="/shipping">משלוחים והחזרות</Link></li>
                        <li><Link href="/privacy">מדיניות פרטיות</Link></li>
                        <li><Link href="/faq">שאלות ותשובות</Link></li>
                        <li><Link href="/contact">צור קשר</Link></li>
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
                        <span>@ml_tlv</span>
                    </a>
                </div>

            </div>
            <div className="container mt-8 pt-4 border-t border-gray-800 text-center text-xs text-gray-500">
                © 2024 ml_tlv. כל הזכויות שמורות.
            </div>
        </footer>
    );
}
