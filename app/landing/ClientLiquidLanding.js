'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ChevronDown, ArrowLeft } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import BrandCarousel from '../components/BrandCarousel';
import LiveStats from '../components/LiveStats';
import { Button } from '../components/ui/button';

import { Dancing_Script } from 'next/font/google';

const dancingScript = Dancing_Script({ subsets: ['latin'] });

export default function ClientLiquidLanding({ newArrivals, stats }) {
    const [currentSection, setCurrentSection] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const containerRef = useRef(null);
    const sectionsCount = 5; // Hero, New Arrivals, Bonuses, Collections, Brands+Footer

    // Handle Scroll
    useEffect(() => {
        const handleWheel = (e) => {
            if (isMenuOpen) return;
            if (e.deltaY > 50) {
                setCurrentSection(prev => Math.min(prev + 1, sectionsCount - 1));
            } else if (e.deltaY < -50) {
                setCurrentSection(prev => Math.max(prev - 1, 0));
            }
        };

        let touchStartY = 0;
        const handleTouchStart = (e) => { touchStartY = e.touches[0].clientY; };
        const handleTouchEnd = (e) => {
            if (isMenuOpen) return;
            const touchEndY = e.changedTouches[0].clientY;
            if (touchStartY - touchEndY > 50) {
                setCurrentSection(prev => Math.min(prev + 1, sectionsCount - 1));
            } else if (touchEndY - touchStartY > 50) {
                setCurrentSection(prev => Math.max(prev - 1, 0));
            }
        };

        window.addEventListener('wheel', handleWheel);
        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isMenuOpen]);

    // Menu Overlay
    const MenuOverlay = () => (
        <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 z-50 bg-black text-white flex flex-col md:flex-row dir-rtl"
        >
            <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 left-6 z-50 text-white">
                <X size={32} />
            </button>

            <div className="w-full h-full flex flex-col items-center justify-center p-8">
                <nav className="flex flex-col gap-8 text-center">
                    <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-4xl font-bold hover:text-gray-300 transition">דף הבית</Link>
                    <Link href="/catalog" onClick={() => setIsMenuOpen(false)} className="text-4xl font-bold hover:text-gray-300 transition">קטלוג</Link>
                    <Link href="/brands" onClick={() => setIsMenuOpen(false)} className="text-4xl font-bold hover:text-gray-300 transition">מותגים</Link>
                    <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="text-4xl font-bold hover:text-gray-300 transition">צור קשר</Link>
                </nav>
            </div>
        </motion.div>
    );

    return (
        <div className="bg-black text-white h-screen overflow-hidden font-sans dir-rtl" style={{ direction: 'rtl' }}>
            <style jsx global>{`
                body, html { overflow: hidden; height: 100%; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #555; border-radius: 4px; }
            `}</style>

            {/* Header / Nav Trigger */}
            <header className="fixed top-0 left-0 w-full z-40 px-6 py-4 flex justify-between items-center bg-white border-b border-gray-100 text-black">
                <Link href="/">
                    <span className="text-3xl font-serif font-bold tracking-tight text-black">ml-tlv.</span>
                </Link>

                {/* Desktop Nav - Matching Homepage */}
                <div className="hidden md:flex items-center gap-8 text-sm font-bold tracking-wide">
                    <Link href="/">דף הבית</Link>
                    <Link href="/brands">מותגים</Link>
                    <Link href="/catalog">קטלוג</Link>
                    <Link href="/matching">התאמת מארזים</Link>
                    <Link href="/request">בקשת בשמים</Link>
                    <Link href="/contact">צור קשר</Link>
                </div>

                <div className="flex items-center gap-4">
                    {/* Icons placeholder matching image */}
                    <button className="p-2"><div className="w-5 h-5 border border-black rounded-full text-[10px] flex items-center justify-center">L</div></button>
                    <button className="p-2 hidden md:block">🔍</button>
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="md:hidden flex items-center gap-2"
                    >
                        <Menu size={24} />
                    </button>
                </div>
            </header>

            <AnimatePresence>
                {isMenuOpen && <MenuOverlay />}
            </AnimatePresence>

            {/* Main Scroll Container */}
            <motion.div
                className="h-full w-full"
                animate={{ y: `-${currentSection * 100}%` }}
                transition={{ duration: 0.8, ease: [0.6, 0.05, -0.01, 0.9] }}
            >
                {/* SECTION 1: HERO */}
                <section className="h-screen w-full flex flex-col bg-white overflow-hidden">
                    {/* Video Area - 60% Height */}
                    <div className="relative w-full h-[60%] flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 z-0">
                            <video
                                src="/hero-video.mp4"
                                autoPlay muted loop playsInline
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="relative z-10 text-center text-black bg-white/80 p-6 rounded-xl backdrop-blur-sm shadow-sm max-w-lg mx-4">
                            <h2 className="text-xs tracking-[0.2em] uppercase mb-2 font-bold opacity-90">
                                Discover Your Signature Scent
                            </h2>
                            <h1 className={`${dancingScript.className} text-4xl md:text-6xl font-bold mb-3 leading-tight`}>
                                Niche & Boutique <br /> Sample Collections
                            </h1>
                            <p className="text-sm md:text-base mb-6 font-light leading-relaxed text-gray-800">
                                הדרך החכמה לגלות בשמי נישה יוקרתיים.<br />
                                הזמינו דוגמיות 2 מ״ל, 5 מ״ל או 10 מ״ל לפני רכישת בקבוק מלא.
                            </p>
                            <Link href="/catalog" className="inline-block bg-white text-black px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:bg-gray-100 transition-transform hover:scale-105 duration-300">
                                קנית אותי, בוא נתחיל
                            </Link>
                        </div>
                    </div>

                    {/* Stats Area - 40% Height (Attached to video) */}
                    <div className="w-full h-[40%] flex items-start justify-center pt-8 bg-white relative z-20">
                        <div className="w-full">
                            <LiveStats stats={stats} />
                        </div>
                    </div>
                </section>

                {/* SECTION 2: NEW ARRIVALS */}
                <section className="h-screen w-full relative flex flex-col justify-center items-center bg-white text-black p-4">
                    <div className="container mx-auto px-4 text-center h-full flex flex-col justify-start pt-12">
                        <div className="shrink-0 mb-1">
                            <h2 className="text-xl tracking-[0.2em] uppercase mb-1 font-bold">חדש על המדף</h2>
                            <div className="w-8 h-0.5 bg-black mx-auto"></div>
                        </div>

                        <div className="flex-1 min-h-0 flex items-start justify-center py-0">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-1 w-full max-w-6xl max-h-full">
                                {newArrivals.slice(0, 4).map((product) => (
                                    <div key={product.id} className="h-full flex flex-col justify-start -mb-24">
                                        {/* Reduced scale further to 75% and added negative margin to pull button up */}
                                        <div className="transform scale-75 origin-top h-full">
                                            <ProductCard product={product} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="shrink-0 mt-0 relative z-10">
                            <Link href="/catalog" className="inline-block bg-black text-white px-6 py-2 rounded-full text-sm font-bold tracking-widest uppercase hover:bg-gray-800 transition shadow-md">
                                צפייה בכל המוצרים
                            </Link>
                        </div>
                    </div>
                </section>

                {/* SECTION 3: BONUSES */}
                <section className="h-screen w-full relative flex flex-col justify-center items-center bg-black text-white overflow-hidden p-4">
                    <div className="container mx-auto px-4 text-center pb-32">
                        <h2 className="text-3xl font-bold mb-2">הבונוסים שלנו</h2>
                        <p className="text-gray-400 mb-2 text-sm">ככל שסכום ההזמנה גבוה יותר, כך אנחנו מפנקים יותר.</p>
                        <p className="text-gray-500 text-xs mb-8">* הדוגמיות נבחרות על ידי הצוות שלנו בהתאם למלאי ולטעם שלכם.</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                            {/* Tier 1 */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                                <span className="block text-gray-400 text-sm mb-2">בקנייה מעל 300 ₪</span>
                                <h3 className="text-2xl font-bold mb-2">2 דוגמיות מתנה</h3>
                                <p className="text-gray-500 text-sm">בגודל 2 מ״ל</p>
                            </div>

                            {/* Tier 2 - Highlighted */}
                            <div className="bg-white/10 border border-white/30 rounded-xl p-8 transform scale-105 shadow-2xl relative">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black px-3 py-1 rounded-full text-xs font-bold">
                                    מומלץ
                                </div>
                                <span className="block text-gray-300 text-sm mb-2">בקנייה מעל 500 ₪</span>
                                <h3 className="text-3xl font-bold mb-2">4 דוגמיות מתנה</h3>
                                <p className="text-gray-400 text-sm">בגודל 2 מ״ל</p>
                            </div>

                            {/* Tier 3 */}
                            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                                <span className="block text-gray-400 text-sm mb-2">בקנייה מעל 1000 ₪</span>
                                <h3 className="text-2xl font-bold mb-2">6 דוגמיות מתנה</h3>
                                <p className="text-gray-500 text-sm">בגודל 2 מ״ל</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION 4: COLLECTIONS */}
                <section className="h-screen w-full relative flex flex-col justify-center items-center bg-white text-black p-4">
                    <div className="container mx-auto px-4 h-full flex flex-col justify-center items-center">
                        {/* Shrunken and lifted grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[50vh] w-full max-w-6xl mt-[-15vh]">
                            {/* Collection 1 */}
                            <Link href="/catalog?category=נדיר" className="group relative w-full h-full overflow-hidden rounded-lg">
                                <Image src="/collection-exclusive.png" alt="Exclusive" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
                                    <span className="text-sm tracking-[0.2em] uppercase mb-2">The Most</span>
                                    <h3 className="text-3xl font-serif font-medium mb-4">EXCLUSIVE<br />FRAGRANCES</h3>
                                    <div className="w-8 h-0.5 bg-white mb-4" />
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">Shop Collection</span>
                                </div>
                            </Link>

                            {/* Collection 2 */}
                            <Link href="/catalog?category=קיץ" className="group relative w-full h-full overflow-hidden rounded-lg">
                                <Image src="/collection-summer.png" alt="Summer" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
                                    <span className="text-sm tracking-[0.2em] uppercase mb-2">The Best</span>
                                    <h3 className="text-3xl font-serif font-medium mb-4">SUMMER<br />SCENTS</h3>
                                    <div className="w-8 h-0.5 bg-white mb-4" />
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">Shop Collection</span>
                                </div>
                            </Link>

                            {/* Collection 3 */}
                            <Link href="/catalog?category=ערב" className="group relative w-full h-full overflow-hidden rounded-lg">
                                <Image src="/collection-datenight.png" alt="Date Night" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
                                    <span className="text-sm tracking-[0.2em] uppercase mb-2">Choose your favorite</span>
                                    <h3 className="text-3xl font-serif font-medium mb-4">DATE NIGHT<br />ESSENTIALS</h3>
                                    <div className="w-8 h-0.5 bg-white mb-4" />
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">Shop Collection</span>
                                </div>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* SECTION 5: BRANDS & FOOTER */}
                <section className="h-screen w-full relative flex flex-col">
                    {/* Brands Part - White Background - 40% Height - Zero Gap */}
                    <div className="h-[40%] bg-white text-black flex flex-col justify-center">
                        <div className="w-full flex-1 flex items-center">
                            <BrandCarousel brands={stats.allBrands} />
                        </div>
                    </div>

                    {/* Footer Part - Black Background - 60% Height */}
                    <div className="h-[60%] bg-black text-white py-4 flex flex-col justify-center">
                        <div className="container mx-auto px-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center md:text-right mb-4">
                                <div>
                                    <h3 className="text-lg font-bold mb-2">ml_tlv</h3>
                                    <p className="text-xs text-gray-400">
                                        דוגמיות בשמים יוקרתיות במחירים הוגנים.
                                        <br />
                                        נבחרו בקפידה כדי שתמצאו את הריח שלכם.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold mb-2">שירות לקוחות</h3>
                                    <ul className="space-y-1 text-xs text-gray-400">
                                        <li><Link href="/about" className="hover:text-white">אודות</Link></li>
                                        <li><Link href="/faq" className="hover:text-white">שאלות ותשובות</Link></li>
                                        <li><Link href="/contact" className="hover:text-white">צור קשר</Link></li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold mb-2">מידע ונהלים</h3>
                                    <ul className="space-y-1 text-xs text-gray-400">
                                        <li><Link href="/terms" className="hover:text-white">תקנון האתר</Link></li>
                                        <li><Link href="/shipping" className="hover:text-white">משלוחים והחזרות</Link></li>
                                        <li><Link href="/privacy" className="hover:text-white">מדיניות פרטיות</Link></li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold mb-2">עקבו אחרינו</h3>
                                    <a href="https://instagram.com/ml_tlv" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition justify-center md:justify-start">
                                        <span>@ml_tlv</span>
                                    </a>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-gray-800 text-center text-xs text-gray-500">
                                © 2024 ml_tlv. כל הזכויות שמורות.
                            </div>
                        </div>
                    </div>
                </section>

            </motion.div>
        </div>
    );
}
