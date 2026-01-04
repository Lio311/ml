'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Menu, X, ArrowLeft, ShoppingBag } from 'lucide-react'
import { Button } from '../components/ui/button'
import ProductCard from '../components/ProductCard'
import BrandCarousel from '../components/BrandCarousel'
import LiveStats from '../components/LiveStats'

export default function ClientLandingV2({ newArrivals, stats }) {
    const [currentSection, setCurrentSection] = useState(0)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isScrolling, setIsScrolling] = useState(false)
    const containerRef = useRef(null)

    const sections = [
        {
            id: 'hero',
            type: 'hero',
            title: 'Niche & Boutique',
            subtitle: 'Sample Collections',
            description: 'הדרך החכמה לגלות בשמי נישה יוקרתיים. הזמינו דוגמיות לפני רכישת בקבוק מלא.',
            bgColor: 'from-slate-900 via-slate-800 to-slate-900',
            textColor: 'text-white',
        },
        {
            id: 'new-arrivals',
            type: 'products',
            title: 'חדש על המדף',
            subtitle: 'הניחוחות שכולם מדברים עליהם',
            description: 'הקולקציה החדשה שלנו נחתה. מגוון בשמים ייחודיים שלא תמצאו בשום מקום אחר.',
            bgColor: 'from-gray-100 via-gray-200 to-gray-300',
            textColor: 'text-gray-900',
            accentColor: 'gray'
        },
        {
            id: 'bonuses',
            type: 'bonuses',
            title: 'הבונוסים שלנו',
            subtitle: 'מפנקים אתכם בכל הזמנה',
            description: 'ככל שסכום ההזמנה גבוה יותר, כך תקבלו יותר מתנות. דוגמיות יוקרתיות בכל משלוח.',
            bgColor: 'from-zinc-900 via-zinc-800 to-black',
            textColor: 'text-white',
            accentColor: 'zinc'
        },
        {
            id: 'collections',
            type: 'collections',
            title: 'קולקציות',
            subtitle: 'בחרו את הסגנון שלכם',
            description: 'מגוון קולקציות מותאמות אישית לכל עונה, אירוע ומצב רוח.',
            bgColor: 'from-slate-50 via-slate-100 to-white',
            textColor: 'text-black',
            accentColor: 'slate'
        },
        {
            id: 'footer',
            type: 'footer',
            title: 'יצירת קשר',
            bgColor: 'hidden' // Special case for footer handling
        }
    ]

    const touchStart = useRef(null)

    // Global scroll handler to prevent default scrolling and use transform
    const handleWheel = (e) => {
        if (isScrolling) return

        // Check if we are inside a scrollable div that actually needs to scroll
        const target = e.target;
        const scrollable = target.closest('.allow-scroll');

        if (scrollable) {
            const atTop = scrollable.scrollTop === 0;
            const atBottom = Math.abs(scrollable.scrollHeight - scrollable.scrollTop - scrollable.clientHeight) < 1;

            // If we can scroll more in the current direction, let it happen naturally
            if ((e.deltaY > 0 && !atBottom) || (e.deltaY < 0 && !atTop)) {
                return; // Do NOT prevent default, let internal scroll happen
            }
        }

        // Otherwise (or if reached end of internal scroll), trigger section switch
        // e.preventDefault() // Removed to avoid 'passive' listener issues, handled by style overflow-hidden on body/game

        if (Math.abs(e.deltaY) < 20) return;

        setIsScrolling(true)
        if (e.deltaY > 0 && currentSection < sections.length - 1) {
            setCurrentSection(prev => prev + 1)
        } else if (e.deltaY < 0 && currentSection > 0) {
            setCurrentSection(prev => prev - 1)
        }
        setTimeout(() => setIsScrolling(false), 1000)
    }

    const handleTouchStart = (e) => {
        touchStart.current = e.touches[0].clientY
    }

    const handleTouchEnd = (e) => {
        if (isScrolling || touchStart.current === null) return
        const touchEnd = e.changedTouches[0].clientY
        const deltaY = touchStart.current - touchEnd

        if (Math.abs(deltaY) > 50) {
            setIsScrolling(true)
            if (deltaY > 0 && currentSection < sections.length - 1) {
                setCurrentSection(prev => prev + 1)
            } else if (deltaY < 0 && currentSection > 0) {
                setCurrentSection(prev => prev - 1)
            }
            setTimeout(() => setIsScrolling(false), 1000)
        }
        touchStart.current = null
    }

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        // Passive: false is crucial for preventing default wheel behavior if needed, 
        // but React/Next events might be passive by default.
        window.addEventListener('wheel', handleWheel, { passive: false })
        window.addEventListener('touchstart', handleTouchStart, { passive: true })
        window.addEventListener('touchend', handleTouchEnd, { passive: true })

        return () => {
            window.removeEventListener('wheel', handleWheel)
            window.removeEventListener('touchstart', handleTouchStart)
            window.removeEventListener('touchend', handleTouchEnd)
        }
    }, [currentSection, isScrolling])

    return (
        <div ref={containerRef} className="h-screen w-full overflow-hidden relative selection:bg-black/30" dir="rtl">
            {/* Global Styles for removing scrollbars */}
            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent transition-all duration-300">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2"
                    >
                        <Link href="/">
                            <span className="text-2xl font-bold tracking-widest uppercase mix-blend-difference text-white">ML_TLV</span>
                        </Link>
                    </motion.div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/catalog">
                            <Button variant="ghost" className="text-white hover:bg-white/10 rounded-full px-6 mix-blend-difference">
                                קטלוג
                            </Button>
                        </Link>
                        <Link href="/sign-in">
                            <Button variant="ghost" className="text-white hover:bg-white/10 rounded-full px-6 mix-blend-difference">
                                כניסה
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden text-white p-2 mix-blend-difference z-50"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        className="fixed inset-0 bg-black/95 backdrop-blur-xl z-40 md:hidden flex flex-col items-center justify-center gap-8"
                    >
                        <Link href="/catalog" onClick={() => setIsMenuOpen(false)}>
                            <Button variant="ghost" size="lg" className="text-white text-2xl">קטלוג</Button>
                        </Link>
                        <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>
                            <Button variant="ghost" size="lg" className="text-white text-2xl">כניסה</Button>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Section Indicators */}
            <div className="fixed left-8 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-3 mix-blend-difference">
                {sections.map((section, index) => (
                    <button
                        key={section.id}
                        onClick={() => setCurrentSection(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${currentSection === index ? 'bg-white w-8' : 'bg-white/30 hover:bg-white/50'
                            }`}
                    />
                ))}
            </div>

            {/* Main Content Slider */}
            <div
                className="h-full transition-transform duration-1000 ease-in-out"
                style={{ transform: `translateY(-${currentSection * 100}vh)` }}
            >
                {sections.map((section, index) => (
                    <Section
                        key={section.id}
                        section={section}
                        isActive={currentSection === index}
                        index={index}
                        newArrivals={newArrivals}
                        stats={stats}
                    />
                ))}
            </div>

            {/* Scroll Indicator */}
            {currentSection < sections.length - 1 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed bottom-8 right-1/2 translate-x-1/2 z-50 flex flex-col items-center gap-2 mix-blend-difference pointer-events-none"
                >
                    <span className="text-white text-xs tracking-widest uppercase opacity-60">Scroll</span>
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        <ChevronDown className="text-white opacity-60" size={24} />
                    </motion.div>
                </motion.div>
            )}

            {/* Footer attached to the last section visually, or always present if we want fixed? 
                User asked for footer to be a section.
            */}
        </div>
    )
}

function Section({ section, isActive, index, newArrivals, stats }) {

    if (section.type === 'hero') {
        return (
            <div className="h-screen w-full relative overflow-hidden bg-black">
                {/* Video Background */}
                <div className="absolute inset-x-0 bottom-0 top-0 z-0">
                    <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-90">
                        <source src="/hero-video.mp4" type="video/mp4" />
                    </video>
                    <div className="absolute inset-0 bg-black/10" />
                </div>

                <div className="relative z-10 w-full h-full flex flex-col justify-center items-center text-center px-4">
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        animate={isActive ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.3 }}
                        className="text-sm md:text-lg tracking-[0.3em] font-light uppercase mb-4 text-white drop-shadow-lg"
                    >
                        {section.title}
                    </motion.h2>
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={isActive ? { opacity: 1, scale: 1 } : {}}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="text-5xl md:text-8xl font-bold mb-6 text-white drop-shadow-2xl"
                    >
                        {section.subtitle}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={isActive ? { opacity: 1 } : {}}
                        transition={{ delay: 0.7 }}
                        className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl font-light leading-relaxed drop-shadow-md"
                    >
                        {section.description}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isActive ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.9 }}
                    >
                        <Link href="/catalog">
                            <Button size="lg" className="bg-white text-black hover:bg-gray-200 rounded-full px-12 py-8 text-xl tracking-wider uppercase transition-all hover:scale-105 border-0">
                                Shop Now
                            </Button>
                        </Link>
                    </motion.div>

                    {/* Live Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={isActive ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 1.2 }}
                        className="absolute bottom-0 left-0 right-0 z-20"
                    >
                        <LiveStats stats={stats} />
                    </motion.div>
                </div>
            </div>
        )
    }

    if (section.type === 'footer') {
        return (
            <div className="h-screen w-full relative overflow-hidden bg-black flex flex-col items-center justify-center text-center">
                <div className="mb-12">
                    <span className="text-4xl font-bold tracking-widest uppercase text-white mb-4 block">ML_TLV</span>
                    <p className="text-white/60 max-w-md mx-auto">חיו את הרגע, עצבו את הזיכרון. בשמי נישה יוקרתיים שנבחרו בקפידה עבורכם.</p>
                </div>
                <div className="flex justify-center gap-8 mb-12">
                    {['אינסטגרם', 'פייסבוק', 'טיקטוק', 'וואטסאפ'].map((social, i) => (
                        <a key={i} href="#" className="text-white/40 hover:text-white transition-colors border-b border-transparent hover:border-white pb-1">
                            {social}
                        </a>
                    ))}
                </div>
                <div className="flex flex-col md:flex-row justify-center items-center gap-8 text-sm text-white/30">
                    <Link href="/terms" className="hover:text-white/60">תקנון</Link>
                    <Link href="/privacy" className="hover:text-white/60">מדיניות פרטיות</Link>
                    <Link href="/shipping" className="hover:text-white/60">משלוחים והחזרות</Link>
                </div>
                <div className="mt-12 text-white/20 text-xs">
                    <p>© 2026 ML_TLV. כל הזכויות שמורות.</p>
                </div>
            </div>
        )
    }

    // Standard Split Layout for Products, Bonuses, Collections
    return (
        <div className={`h-screen w-full relative overflow-hidden bg-gradient-to-br ${section.bgColor}`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03]">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }} />
            </div>

            <div className="container mx-auto px-6 h-full flex items-center relative z-10">
                <div className="grid md:grid-cols-2 gap-12 items-center w-full h-full">

                    {/* LEFT SIDE: Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-right flex flex-col justify-center h-full order-1 md:order-1"
                    >
                        {/* Optional Tag or Subtitle */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={isActive ? { opacity: 1 } : { opacity: 0 }}
                            className="text-lg font-bold mb-4 opacity-70"
                        >
                            {section.subtitle}
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                            transition={{ delay: 0.4 }}
                            className={`text-5xl md:text-7xl font-black ${section.textColor} mb-6 leading-tight`}
                        >
                            {section.title}
                        </motion.h1>

                        <motion.div className="w-24 h-2 bg-black/20 mb-8 rounded-full" />

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={isActive ? { opacity: 1 } : { opacity: 0 }}
                            transition={{ delay: 0.6 }}
                            className={`text-xl ${section.textColor} opacity-80 mb-8 max-w-xl leading-relaxed`}
                        >
                            {section.description}
                        </motion.p>

                        {/* Action Buttons specific to section */}
                        <div className="mt-4">
                            {section.type === 'products' && (
                                <Link href="/catalog">
                                    <Button size="lg" className="rounded-full px-8 py-6 text-lg">לכל הקטלוג <ArrowLeft className="mr-2" /></Button>
                                </Link>
                            )}
                            {section.type === 'collections' && (
                                <Link href="/catalog">
                                    <Button size="lg" className="rounded-full px-8 py-6 text-lg">גלה קולקציות <ArrowLeft className="mr-2" /></Button>
                                </Link>
                            )}
                        </div>
                    </motion.div>

                    {/* RIGHT SIDE: Visual Content (Products Grid / Carousel) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="relative h-full flex items-center justify-center p-4 order-2 md:order-2 allow-scroll overflow-y-auto no-scrollbar"
                    >
                        {/* 
                            Crucial: This container has 'allow-scroll' and 'no-scrollbar'
                            It allows internal scrolling if content is too tall, but hides bar.
                        */}

                        {section.type === 'products' && (
                            <div className="grid grid-cols-2 gap-4 w-full">
                                {newArrivals.map(product => (
                                    <div key={product.id} className="transform transition-all hover:scale-105">
                                        <ProductCard product={product} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {section.type === 'bonuses' && (
                            <div className="w-full flex flex-col gap-6">
                                <div className="grid grid-cols-1 gap-4">
                                    {[
                                        { price: 300, gift: '2 דוגמיות', label: 'Basic' },
                                        { price: 500, gift: '4 דוגמיות', label: 'Popular', highlight: true },
                                        { price: 1000, gift: '6 דוגמיות', label: 'Premium' },
                                    ].map((tier, i) => (
                                        <div key={i} className={`p-6 rounded-xl border ${tier.highlight ? 'bg-white text-black border-transparent shadow-xl' : 'bg-white/5 border-white/20 text-white'}`}>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="text-sm opacity-70">בקנייה מעל {tier.price} ₪</div>
                                                    <div className="text-2xl font-bold">{tier.gift}</div>
                                                </div>
                                                {tier.highlight && <div className="bg-black text-white text-xs px-2 py-1 rounded">מומלץ</div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-white rounded-xl p-4">
                                    <h3 className="text-black text-center mb-2 font-bold uppercase tracking-widest text-sm">המותגים שלנו</h3>
                                    <BrandCarousel brands={stats.allBrands} />
                                </div>
                            </div>
                        )}

                        {section.type === 'collections' && (
                            <div className="grid grid-cols-1 gap-4 w-full">
                                {[
                                    { title: 'EXCLUSIVE', img: '/collection-exclusive.png', link: 'נדיר' },
                                    { title: 'SUMMER', img: '/collection-summer.png', link: 'קיץ' },
                                    { title: 'DATE NIGHT', img: '/collection-datenight.png', link: 'ערב' },
                                ].map((col, i) => (
                                    <Link href={`/catalog?category=${col.link}`} key={i} className="relative h-48 rounded-2xl overflow-hidden group">
                                        <Image
                                            src={col.img}
                                            alt={col.title}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <h3 className="text-white text-2xl font-bold tracking-widest">{col.title}</h3>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                    </motion.div>
                </div>
            </div>
        </div>
    )
}
