import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
    return (
        <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden font-assistant">
            {/* Immersive Background */}
            <div className="absolute inset-0 z-0">
                <Image 
                    src="/404-bg.png" 
                    alt="Luxury Perfume" 
                    fill 
                    className="object-cover opacity-60 scale-105 animate-pulse-slow"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
            </div>

            {/* Glassmorphic Content Card */}
            <div className="relative z-10 w-full max-w-2xl mx-4 p-8 md:p-12 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl text-center text-white">
                <div className="mb-6 inline-block">
                    <span className="text-sm tracking-[0.4em] uppercase opacity-70 mb-2 block">Error Code</span>
                    <h1 className="text-8xl md:text-9xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/30 drop-shadow-lg">
                        404
                    </h1>
                </div>

                <h2 className="text-2xl md:text-4xl font-light mb-6">
                    אופס... הריח שחיפשת <span className="font-bold underline decoration-amber-400/50">התנדף</span>
                </h2>

                <p className="text-lg md:text-xl opacity-80 mb-10 leading-relaxed max-w-md mx-auto">
                    הדף שחיפשת אינו קיים או שהועבר למקום אחר. אל דאגה, אנחנו כאן כדי לעזור לך למצוא את הניחוח הבא שלך.
                </p>

                <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-12">
                    <Link 
                        href="/" 
                        className="w-full md:w-auto px-10 py-4 bg-white text-black rounded-full font-bold text-lg shadow-xl hover:bg-gray-100 hover:scale-105 transition-all duration-300"
                    >
                        חזרה לדף הבית
                    </Link>
                    <Link 
                        href="/catalog" 
                        className="w-full md:w-auto px-10 py-4 bg-white/10 backdrop-blur-md border border-white/30 rounded-full font-bold text-lg hover:bg-white/20 hover:scale-105 transition-all duration-300"
                    >
                        לקטלוג המלא
                    </Link>
                </div>

                {/* Discovery Quick Links */}
                <div className="pt-8 border-t border-white/10">
                    <p className="text-sm uppercase tracking-widest opacity-50 mb-6">גלו את הקולקציות שלנו</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <Link href="/catalog?category=niche" className="px-5 py-2 bg-white/5 border border-white/10 rounded-full text-sm hover:bg-white/10 transition-colors">בשמי נישה</Link>
                        <Link href="/catalog?category=boutique" className="px-5 py-2 bg-white/5 border border-white/10 rounded-full text-sm hover:bg-white/10 transition-colors">בשמי בוטיק</Link>
                        <Link href="/brands" className="px-5 py-2 bg-white/5 border border-white/10 rounded-full text-sm hover:bg-white/10 transition-colors">כל המותגים</Link>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.55; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.03); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 8s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
