'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Menu, X, ChevronDown } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import BrandCarousel from '../components/BrandCarousel';

function Counter({ end, duration = 2000, prefix = "" }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime = null;
        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const easeOutQuad = (t) => t * (2 - t);
            setCount(Math.floor(easeOutQuad(progress) * end));
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }, [end, duration]);

    return <span>{prefix}{count.toLocaleString()}</span>;
}

export default function ClientLiquidLanding({ newArrivals, stats }) {
    const [currentSection, setCurrentSection] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const containerRef = useRef(null);
    const sectionsCount = 6; // Hero, Stats, New Arrivals, Bonuses, Brands, Collections

    // Handle Scroll
    useEffect(() => {
        const handleWheel = (e) => {
            if (isMenuOpen) return;
            // Basic debounce could be added here if needed, but for now simple checks
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
            className="fixed inset-0 z-50 bg-[#15161b] text-white flex flex-col md:flex-row dir-ltr" // Force LTR for menu structure to match design
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

            <div className="w-full md:w-1/2 overflow-y-auto bg-[#1a1c20]">
                {/* Project Links Style Menu */}
                <div className="grid grid-cols-1">
                    <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
                        {[
                            { title: 'EXCLUSIVE FRAGRANCES', subtitle: 'The Most', img: '/collection-exclusive.png', link: 'נדיר' },
                            { title: 'SUMMER SCENTS', subtitle: 'The Best', img: '/collection-summer.png', link: 'קיץ' },
                            { title: 'DATE NIGHT ESSENTIALS', subtitle: 'Choose your favorite', img: '/collection-datenight.png', link: 'ערב' },
                        ].map((col, i) => (
                            <Link href={`/catalog?category=${col.link}`} key={i} className="relative group overflow-hidden rounded-2xl w-full h-full block">
                                <div className="relative w-full h-full bg-gray-200">
                                    <Image
                                        src={col.img}
                                        alt={col.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors" />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 text-center p-4">
                                        <span className="text-xs md:text-sm tracking-[0.2em] uppercase mb-2">{col.subtitle}</span>
                                        <h3 className="text-2xl md:text-3xl font-serif font-medium tracking-wide leading-tight mb-4">{col.title.split(' ').map((line, k) => <span key={k} className="block">{line}</span>)}</h3>
                                        <div className="w-8 h-0.5 bg-white mb-4" />
                                        <span className="text-xs font-bold underline decoration-1 underline-offset-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-4 group-hover:translate-y-0 duration-300">
                                            Shop Collection
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="bg-black text-white h-screen overflow-hidden font-sans dir-rtl" style={{ direction: 'rtl' }}>
            <style jsx global>{`
                /* Hide scrollbars */
                body, html { overflow: hidden; height: 100%; }
                /* Custom Font utility if needed, defaulting to sans */
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
                transition={{ duration: 0.8, ease: [0.6, 0.05, -0.01, 0.9] }} // Custom bezier for that "premium" slow-snap feel
            >
                {/* SECTION 1: HERO */}
                <section className="h-screen w-full relative flex items-center justify-center overflow-hidden">
                    {/* Background Video */}
                    <div className="absolute inset-0 z-0">
                        <video
                            src="https://res.cloudinary.com/dtsuvx8dz/video/upload/v1706985537/perfume-video_pr8i0h.mp4"
                            autoPlay muted loop playsInline
                            className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-black/40"></div>
                    </div>

                    <div className="relative z-10 text-center text-white p-4">
                        <motion.h1
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: currentSection === 0 ? 1 : 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="text-6xl md:text-8xl font-black mb-4 tracking-tighter"
                        >
                            MAKING <br /> SCENTS.
                        </motion.h1>
                        {/* 1. Header (Fixed Height) */}
                        <div className="text-center mb-4 shrink-0 px-4">
                            <h2 className="text-3xl md:text-5xl font-bold mb-2 text-white">הבונוסים שלנו</h2>
                            <p className="text-lg text-white/60">ככל שסכום ההזמנה גבוה יותר, כך אנחנו מפנקים יותר.</p>
                        </div>
                    </div>

                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
                        <p className="text-xs uppercase tracking-widest mb-2 opacity-70">Scroll</p>
                        <ChevronDown className="mx-auto opacity-70" />
                    </div>
                </section>

                {/* SECTION 2: STATS (Liquid Style Split) */}
                <section className="h-screen w-full relative flex flex-col md:flex-row bg-[#e9eef3] text-[#15161b]">
                </div>
                {/* Visual Side */}
                <div className="w-full md:w-1/2 bg-[#dadddf] relative overflow-hidden">
                    {/* Abstract visual/image placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <span className="text-[20rem] font-bold">ML</span>
                    </div>
                </div>
            </section>

            {/* SECTION 3: NEW ARRIVALS */}
            <section className="h-screen w-full relative flex flex-col md:flex-row bg-[#1a1617] text-white">
                <div className="w-full md:w-1/2 bg-[url('https://liquid.co.il/wp-content/uploads/2021/01/bg-8.jpg')] bg-cover bg-center relative">
                    <div className="absolute inset-0 bg-black/50"></div>
                </div>
                <div className="w-full md:w-1/2 p-12 md:p-24 flex flex-col justify-center bg-[#1a1617]">
                    <div className="mb-6 flex items-center gap-4 text-white">
                        <span className="text-sm font-bold">02.</span>
                        <div className="h-[2px] w-12 bg-white"></div>
                        <span className="text-sm uppercase tracking-wide">Fresh Cuts</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-none text-white">
                        New <br /> Arrivals
                    </h2>
                    <div className="h-[1px] w-full bg-white/20 mb-8"></div>

                    <div className="grid grid-cols-2 gap-6">
                        {newArrivals.slice(0, 4).map((product) => (
                            <div key={product.id} className="h-full">
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </div>

                    <Link href="/catalog" className="mt-8 px-8 py-4 bg-[#ff4015] text-white font-bold uppercase tracking-wider hover:bg-[#d52700] transition self-start flex items-center gap-4 inline-block">
                        View All <ArrowLeft size={16} />
                    </Link>
                </div>
            </section>

            {/* SECTION 4: BONUSES (Liquid Color Pop) */}
            <section className="h-screen w-full relative flex flex-col md:flex-row bg-[#e9eef3]">
                <div className="w-full h-full flex flex-col justify-center items-center p-12 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[#f7572b] z-0"></div> {/* Orange/Red bg */}
                    <div className="relative z-10 text-white max-w-4xl">
                        <div className="mb-6 flex items-center justify-center gap-4">
                            <span className="text-sm font-bold">03.</span>
                            <div className="h-[2px] w-12 bg-white"></div>
                            <span className="text-sm uppercase tracking-wide">Rewards</span>
                        </div>
                        <h2 className="text-6xl md:text-9xl font-bold mb-4">FREE <br /> SAMPLES</h2>
                        <p className="text-2xl md:text-3xl font-light mb-12 opacity-90">
                            Get free samples with every order over ₪300.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                            {/* Tier 1 */}
                            <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20 text-center relative overflow-hidden hover:bg-white/20 transition duration-300">
                                <div className="text-lg font-bold text-white/80 mb-2">בקנייה מעל 300 ₪</div>
                                <div className="text-3xl font-bold mb-4 text-white">2 דוגמיות מתנה</div>
                                <div className="text-sm text-white/60">בגודל 2 מ״ל</div>
                            </div>

                            {/* Tier 2 */}
                            <div className="bg-white/20 backdrop-blur-md p-8 rounded-xl border-2 border-white text-center relative shadow-xl transform md:-translate-y-4 hover:-translate-y-6 transition duration-300">
                                <div className="absolute top-0 right-0 bg-white text-[#f7572b] text-xs px-3 py-1 rounded-bl-lg rounded-tr-xl font-bold">מומלץ</div>
                                <div className="text-lg font-bold text-white/90 mb-2">בקנייה מעל 500 ₪</div>
                                <div className="text-3xl font-bold mb-4 text-white">4 דוגמיות מתנה</div>
                                <div className="text-sm text-white/80">בגודל 2 מ״ל</div>
                            </div>

                            {/* Tier 3 */}
                            <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20 text-center relative overflow-hidden hover:bg-white/20 transition duration-300">
                                <div className="text-lg font-bold text-white/80 mb-2">בקנייה מעל 1000 ₪</div>
                                <div className="text-3xl font-bold mb-4 text-white">6 דוגמיות מתנה</div>
                                <div className="text-sm text-white/60">בגודל 2 מ״ל</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 5: BRANDS */}
            <section className="h-screen w-full relative bg-[#1d1d20] text-white flex flex-col">
                <div className="p-12 md:p-24 pb-0">
                    <div className="mb-6 flex items-center gap-4">
                        <span className="text-sm font-bold">04.</span>
                        <div className="h-[2px] w-12 bg-white"></div>
                        <span className="text-sm uppercase tracking-wide">Curated</span>
                    </div>
                    <h2 className="text-5xl md:text-6xl font-bold">Our Brands</h2>
                </div>

                <div className="flex-1 overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center bg-white">
                        <BrandCarousel brands={stats.allBrands} />
                    </div>
                </div>
            </section>

            {/* SECTION 6: FOOTER / COLLECTIONS */}
            <section className="h-screen w-full relative flex flex-col bg-black text-white p-12 md:p-24 justify-between">
                <div>
                    <div className="mb-6 flex items-center gap-4">
                        <span className="text-sm font-bold">05.</span>
                        <div className="h-[2px] w-12 bg-white"></div>
                        <span className="text-sm uppercase tracking-wide">Explore</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-bold mb-12">Start Your <br /> Journey.</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {['Men', 'Women', 'Unisex'].map((col) => (
                        <Link href={`/collections/${col.toLowerCase()}`} key={col} className="h-48 border border-white/20 flex items-center justify-center text-3xl font-bold uppercase tracking-widest hover:bg-white hover:text-black transition duration-500">
                            {col}
                        </Link>
                    ))}
                </div>

                <div className="border-t border-white/20 pt-8 flex justify-between items-end">
                    <div>
                        <p className="text-gray-500 text-sm">© 2024 ML TLV. All rights reserved.</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold">studio@liquid.co.il</p> {/* Left as homage or placeholder */}
                    </div>
                </div>
            </section>

        </motion.div>
        </div >
    );
}
