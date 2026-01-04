'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Menu, X, ChevronDown } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import BrandCarousel from '../components/BrandCarousel';
import LiveStats from '../components/LiveStats';

export default function ClientLiquidLanding({ newArrivals, stats }) {
    const [currentSection, setCurrentSection] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const containerRef = useRef(null);
    const sectionsCount = 5; // Hero, New Arrivals, Bonuses, Brands, Collections

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
            className="fixed inset-0 z-50 bg-[#15161b] text-white flex flex-col md:flex-row dir-ltr"
        >
            <div className="w-full md:w-1/2 p-12 flex flex-col justify-center bg-[#15161b] border-r border-gray-800">
                <button onClick={() => setIsMenuOpen(false)} className="absolute top-8 right-8 md:left-8 md:right-auto text-white">
                    <X size={32} />
                </button>

                <h2 className="text-4xl font-bold mb-8 leading-tight">
                    We create experiences.<br />
                    <span className="text-[#ff4015]">Solid & Lasting.</span>
                </h2>

                <div className="space-y-6 text-gray-400">
                    <p>ML TLV is a premiere boutique for exclusive fragrances.</p>
                    <div className="flex flex-col gap-2 mt-8">
                        <div className="text-sm uppercase tracking-wide text-[#ff4015]">Contact Us</div>
                        <a href="mailto:support@ml-tlv.com" className="text-2xl font-light hover:text-white transition">support@ml-tlv.com</a>
                        <a href="tel:+972500000000" className="text-2xl font-light hover:text-white transition">+972 50 000 0000</a>
                    </div>
                </div>
            </div>

            <div className="w-full md:w-1/2 overflow-y-auto bg-[#1a1c20] p-12 flex flex-col justify-center">
                <div className="space-y-4">
                    {[
                        { title: "Home", num: "01", link: "/" },
                        { title: "New Arrivals", num: "02", link: "/products" },
                        { title: "Brands", num: "03", link: "/brands" },
                        { title: "Samples", num: "04", link: "/samples" },
                    ].map((item, i) => (
                        <Link href={item.link} key={i} className="group flex items-center gap-6 p-4 hover:bg-white/5 transition border-b border-white/10">
                            <span className="text-sm font-bold text-[#ff4015]">{item.num}</span>
                            <span className="text-3xl font-bold text-white group-hover:translate-x-2 transition">{item.title}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="bg-black text-white h-screen overflow-hidden font-sans dir-rtl" style={{ direction: 'rtl' }}>
            <style jsx global>{`
                body, html { overflow: hidden; height: 100%; }
            `}</style>

            {/* Header / Nav Trigger */}
            <header className="fixed top-0 left-0 w-full z-40 p-6 flex justify-between items-center mix-blend-difference text-white">
                <div className="text-2xl font-bold tracking-tighter">ML TLV</div>
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="flex items-center gap-2 group"
                >
                    <span className="hidden md:block text-sm uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Menu</span>
                    <div className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-black transition">
                        <Menu size={20} />
                    </div>
                </button>
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
                <section className="h-screen w-full relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <video
                            src="https://res.cloudinary.com/dtsuvx8dz/video/upload/v1706985537/perfume-video_pr8i0h.mp4"
                            autoPlay muted loop playsInline
                            className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-black/40"></div>
                    </div>

                    <div className="relative z-10 text-center text-white p-4 max-w-4xl">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-sm md:text-lg tracking-[0.3em] font-light uppercase mb-4 drop-shadow-lg"
                        >
                            Discover Your Signature Scent
                        </motion.h2>
                        <motion.h1
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                            className="text-5xl md:text-8xl font-black mb-6 tracking-tighter leading-tight"
                        >
                            Niche & Boutique <br /> Sample Collections
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-lg md:text-xl font-light text-gray-200 mb-8 leading-relaxed"
                        >
                            הדרך החכמה לגלות בשמי נישה יוקרתיים.<br />
                            הזמינו דוגמיות 2 מ״ל, 5 מ״ל או 10 מ״ל לפני רכישת בקבוק מלא.
                        </motion.p>

                        <Link href="/catalog">
                            <button className="bg-white text-black px-12 py-4 rounded-full text-lg font-bold uppercase tracking-widest hover:bg-gray-200 transition">
                                SHOP NOW
                            </button>
                        </Link>
                    </div>

                    <div className="absolute bottom-0 left-0 w-full z-20">
                        <LiveStats stats={stats} />
                    </div>
                </section>

                {/* SECTION 2: NEW ARRIVALS */}
                <section className="h-screen w-full relative flex flex-col md:flex-row bg-[#1a1617] text-white">
                    <div className="w-full md:w-1/2 bg-[url('https://liquid.co.il/wp-content/uploads/2021/01/bg-8.jpg')] bg-cover bg-center relative hidden md:block">
                        <div className="absolute inset-0 bg-black/50"></div>
                        <div className="absolute bottom-12 left-12 text-white p-8 border-l-4 border-[#ff4015]">
                            <h3 className="text-4xl font-bold mb-2">New Arrivals</h3>
                            <p className="opacity-70">Check out the latest additions to our collection.</p>
                        </div>
                    </div>
                    <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-[#1a1617] h-full">
                        <div className="mb-4 flex items-center gap-4 text-white">
                            <span className="text-sm font-bold">02.</span>
                            <div className="h-[2px] w-12 bg-white"></div>
                            <span className="text-sm uppercase tracking-wide">Fresh Cuts</span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-bold mb-8 text-white">
                            חדש על המדף
                        </h2>

                        <div className="grid grid-cols-2 gap-4 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                            {newArrivals.slice(0, 4).map((product) => (
                                <div key={product.id} className="h-auto">
                                    <ProductCard product={product} />
                                </div>
                            ))}
                        </div>

                        <Link href="/catalog" className="mt-8 self-start text-sm uppercase tracking-widest border-b border-white pb-2 hover:text-[#ff4015] hover:border-[#ff4015] transition">
                            צפייה בכל המוצרים
                        </Link>
                    </div>
                </section>

                {/* SECTION 3: BONUSES */}
                <section className="h-screen w-full relative flex flex-col bg-[#e9eef3] justify-center items-center">
                    <div className="container mx-auto px-4 text-center z-10">
                        <div className="mb-6 flex items-center justify-center gap-4 text-[#15161b]">
                            <span className="text-sm font-bold">03.</span>
                            <div className="h-[2px] w-12 bg-[#15161b]"></div>
                            <span className="text-sm uppercase tracking-wide">Rewards</span>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-bold mb-4 text-[#15161b]">הבונוסים שלנו</h2>
                        <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto">
                            ככל שסכום ההזמנה גבוה יותר, כך אנחנו מפנקים יותר.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                            {/* Tier 1 */}
                            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 flex flex-col items-center justify-center">
                                <div className="text-lg font-bold text-gray-500 mb-2">בקנייה מעל 300 ₪</div>
                                <div className="text-4xl font-black mb-4 text-[#15161b]">2 דוגמיות</div>
                                <div className="text-sm text-gray-400 uppercase tracking-wide">מתנה</div>
                            </div>

                            {/* Tier 2 */}
                            <div className="bg-[#15161b] text-white p-10 rounded-xl shadow-2xl border-2 border-[#ff4015] transform scale-105 relative">
                                <span className="absolute top-0 right-0 bg-[#ff4015] text-white text-xs px-3 py-1 font-bold rounded-bl-lg">POPULAR</span>
                                <div className="text-lg font-bold text-gray-400 mb-2">בקנייה מעל 500 ₪</div>
                                <div className="text-5xl font-black mb-4">4 דוגמיות</div>
                                <div className="text-sm text-gray-400 uppercase tracking-wide">מתנה</div>
                            </div>

                            {/* Tier 3 */}
                            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 flex flex-col items-center justify-center">
                                <div className="text-lg font-bold text-gray-500 mb-2">בקנייה מעל 1000 ₪</div>
                                <div className="text-4xl font-black mb-4 text-[#15161b]">6 דוגמיות</div>
                                <div className="text-sm text-gray-400 uppercase tracking-wide">מתנה</div>
                            </div>
                        </div>
                    </div>
                    {/* Background Blob */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-[#ff4015]/10 to-transparent rounded-full blur-3xl -z-0"></div>
                </section>

                {/* SECTION 4: BRANDS */}
                <section className="h-screen w-full relative bg-[#1d1d20] text-white flex flex-col justify-center">
                    <div className="container mx-auto px-12 mb-12">
                        <div className="mb-6 flex items-center gap-4">
                            <span className="text-sm font-bold">04.</span>
                            <div className="h-[2px] w-12 bg-white"></div>
                            <span className="text-sm uppercase tracking-wide">Curated</span>
                        </div>
                        <h2 className="text-5xl md:text-6xl font-bold">המותגים המובילים</h2>
                    </div>

                    <div className="w-full bg-white py-24">
                        <BrandCarousel brands={stats.allBrands} />
                    </div>
                </section>

                {/* SECTION 5: COLLECTIONS */}
                <section className="h-screen w-full relative flex flex-col bg-black text-white p-8 md:p-12 justify-center">
                    <div className="container mx-auto h-full flex flex-col">
                        <div className="mb-8 shrink-0">
                            <div className="mb-4 flex items-center gap-4">
                                <span className="text-sm font-bold">05.</span>
                                <div className="h-[2px] w-12 bg-white"></div>
                                <span className="text-sm uppercase tracking-wide">Explore</span>
                            </div>
                            <h2 className="text-5xl md:text-7xl font-bold">קולקציות</h2>
                        </div>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden pb-12">
                            {[
                                { title: 'EXCLUSIVE FRAGRANCES', subtitle: 'The Most', img: '/collection-exclusive.png', link: 'נדיר' },
                                { title: 'SUMMER SCENTS', subtitle: 'The Best', img: '/collection-summer.png', link: 'קיץ' },
                                { title: 'DATE NIGHT ESSENTIALS', subtitle: 'Choose your favorite', img: '/collection-datenight.png', link: 'ערב' },
                            ].map((col, i) => (
                                <Link href={`/catalog?category=${col.link}`} key={i} className="relative group overflow-hidden rounded-2xl w-full h-full block">
                                    <div className="relative w-full h-full bg-gray-900 border border-white/10">
                                        <Image
                                            src={col.img}
                                            alt={col.title}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                        <div className="absolute bottom-0 left-0 w-full p-8 text-center">
                                            <span className="text-xs tracking-[0.2em] uppercase mb-2 block text-gray-300">{col.subtitle}</span>
                                            <h3 className="text-2xl md:text-3xl font-serif font-bold mb-4">{col.title.replace('FRAGRANCES', '').replace('SCENTS', '').replace('ESSENTIALS', '')}</h3>
                                            <span className="inline-block px-6 py-2 border border-white/30 rounded-full text-xs uppercase tracking-widest hover:bg-white hover:text-black transition">Shop Now</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

            </motion.div>
        </div>
    );
}
