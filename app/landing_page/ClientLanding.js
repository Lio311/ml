'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Menu, X, ArrowLeft, ShoppingBag, Star, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ProductCard from '../components/ProductCard'
import BrandCarousel from '../components/BrandCarousel'
import LiveStats from '../components/LiveStats'

export default function ClientLanding({ newArrivals, stats }) {
    const [currentSection, setCurrentSection] = useState(0)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isScrolling, setIsScrolling] = useState(false)
    const containerRef = useRef(null)

    // Updated sections mapping: Removed 'stats' and 'brands', merged them.
    const sections = [
        {
            id: 'hero',
            type: 'hero',
            title: 'Niche & Boutique',
            subtitle: 'Sample Collections',
            description: 'הדרך החכמה לגלות בשמי נישה יוקרתיים. הזמינו דוגמיות לפני רכישת בקבוק מלא.',
            bgColor: 'from-slate-900 via-slate-800 to-slate-900',
            textColor: 'text-black',
        },
        {
            id: 'new-arrivals',
            type: 'products',
            title: 'חדש על המדף',
            subtitle: 'הניחוחות שכולם מדברים עליהם',
            description: '',
            bgColor: 'from-white via-gray-50 to-white',
            textColor: 'text-gray-900',
        },
        {
            id: 'bonuses',
            type: 'bonuses', // Includes Brands now
            title: 'הבונוסים שלנו',
            subtitle: 'מפנקים אתכם בכל הזמנה',
            description: 'ככל שסכום ההזמנה גבוה יותר, כך תקבלו יותר מתנות.',
            bgColor: 'from-black via-zinc-900 to-black',
            textColor: 'text-white',
        },
        {
            id: 'collections',
            type: 'collections',
            title: 'קולקציות',
            subtitle: 'בחרו את הסגנון שלכם',
            bgColor: 'from-slate-50 via-white to-slate-50',
            textColor: 'text-black',
        }
    ]

    // Scroll Logic
    const touchStart = useRef(null)

    const handleWheel = (e) => {
        if (isScrolling) return

        const target = e.target;
        const scrollable = target.closest('.scrollable-content');
        if (scrollable) {
            const atTop = scrollable.scrollTop === 0;
            const atBottom = Math.abs(scrollable.scrollHeight - scrollable.scrollTop - scrollable.clientHeight) < 1;

            if (e.deltaY > 0 && !atBottom) return;
            if (e.deltaY < 0 && !atTop) return;
        }

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
            setTimeout(() => setIsScrolling(false), 800)
        }
        touchStart.current = null
    }

    useEffect(() => {
        const container = containerRef.current
        if (!container) return
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
        <div ref={containerRef} className="h-screen w-full overflow-hidden relative" dir="rtl">

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
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
                        <Link href="/cart">
                            <Button className="bg-white text-black hover:bg-gray-100 rounded-full px-6 shadow-xl transition-all hover:scale-105 border-0">
                                סל קניות <ShoppingBag size={16} className="mr-2" />
                            </Button>
                        </Link>
                    </div>

                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden text-white p-2 mix-blend-difference z-50"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

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


            <div className="fixed left-8 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-3 mix-blend-difference">
                {sections.map((section, index) => (
                    <button
                        key={section.id}
                        onClick={() => setCurrentSection(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${currentSection === index ? 'bg-white w-8' : 'bg-white/30 hover:bg-white/50'}`}
                    />
                ))}
            </div>

            <div
                className="h-full transition-transform duration-1000 ease-in-out"
                style={{ transform: `translateY(-${currentSection * 100}vh)` }}
            >
                {sections.map((section, index) => (
                    <Section
                        key={section.id}
                        section={section}
                        isActive={currentSection === index}
                        newArrivals={newArrivals}
                        stats={stats}
                    />
                ))}
            </div>

            {currentSection < sections.length - 1 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed bottom-8 right-1/2 translate-x-1/2 z-40 flex flex-col items-center gap-2 mix-blend-difference pointer-events-none"
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

        </div>
    )
}

function Section({ section, isActive, newArrivals, stats }) {

    const renderContent = () => {
        switch (section.type) {
            case 'hero':
                return (
                    <>
                        <div className="absolute inset-0 z-0">
                            <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-90">
                                <source src="/hero-video.mp4" type="video/mp4" />
                            </video>
                            <div className="absolute inset-0 bg-black/10" />
                        </div>
                        <div className="relative z-10 w-full h-full flex flex-col justify-center">
                            <div className="text-center max-w-4xl mx-auto px-4 mb-20 md:mb-32"> {/* Added MB to push content up */}
                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }}
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
                                    className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-md"
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
                            </div>

                            {/* Live Stats Integrated Here at Bottom of Hero */}
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={isActive ? { opacity: 1, y: 0 } : {}}
                                transition={{ delay: 1.2 }}
                                className="absolute bottom-0 left-0 right-0 z-20"
                            >
                                <LiveStats stats={stats} />
                            </motion.div>
                        </div>
                    </>
                );
            case 'products':
                return (
                    <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10 pt-20"> {/* Added padding top */}
                        <div className="text-center mb-8 shrink-0">
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">{section.title}</h2>
                            <div className="w-20 h-1 bg-black mx-auto" />
                        </div>
                        <div className="scrollable-content overflow-y-auto overflow-x-hidden p-4 md:p-8 flex-1">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-20">
                                {newArrivals.map(product => (
                                    <div key={product.id} className="transform transition-all active:scale-95">
                                        <ProductCard product={product} />
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Button moved inside scrollable area or kept fixed? Kept fixed for visibility */}
                        <div className="text-center pb-8 pt-4 shrink-0 bg-white/80 backdrop-blur-sm absolute bottom-0 left-0 right-0 w-full">
                            <Link href="/catalog">
                                <Button className="rounded-full px-8 bg-black text-white hover:bg-gray-800">לכל הקטלוג</Button>
                            </Link>
                        </div>
                    </div>
                );
            case 'bonuses':
                return (
                    <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10 scrollable-content overflow-y-auto">
                        {/* Bonuses Content */}
                        <div className="mt-20 mb-12">
                            <div className="text-center mb-16 text-white">
                                <h2 className="text-4xl md:text-6xl font-bold mb-4">{section.title}</h2>
                                <p className="text-xl text-white/70">{section.description}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full px-4">
                                {[
                                    { price: 300, gift: '2 דוגמיות', label: 'Basic' },
                                    { price: 500, gift: '4 דוגמיות', label: 'Popular', highlight: true },
                                    { price: 1000, gift: '6 דוגמיות', label: 'Premium' },
                                ].map((tier, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 50 }}
                                        animate={isActive ? { opacity: 1, y: 0 } : {}}
                                        transition={{ delay: 0.2 + (i * 0.1) }}
                                        className={`relative p-8 rounded-2xl border ${tier.highlight ? 'bg-white/10 border-white scale-105 shadow-2xl shadow-white/10' : 'bg-zinc-900/50 border-zinc-700'}`}
                                    >
                                        {tier.highlight && <span className="absolute top-0 right-0 bg-white text-black text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">מומלץ</span>}
                                        <h3 className="text-lg text-gray-400 mb-2 font-bold">בקנייה מעל {tier.price} ₪</h3>
                                        <div className="text-3xl md:text-4xl font-black text-white mb-2">{tier.gift}</div>
                                        <div className="text-sm text-gray-500">בגודל 2 מ"ל במתנה</div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Merged Brands Content */}
                        <div className="mb-20">
                            <div className="container mx-auto text-center mb-10">
                                <h2 className="text-2xl md:text-3xl font-serif font-medium text-white tracking-widest uppercase">המותגים שלנו</h2>
                                <div className="w-12 h-0.5 bg-white/50 mx-auto mt-4"></div>
                            </div>
                            {/* Make brand carousel white text friendly if needed, or wrap in white container */}
                            <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm">
                                <BrandCarousel brands={stats.allBrands} />
                            </div>
                        </div>
                    </div>
                );
            case 'collections':
                return (
                    <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10 pt-20">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[60vh]">
                            {[
                                { title: 'EXCLUSIVE', img: '/collection-exclusive.png', link: 'נדיר' },
                                { title: 'SUMMER', img: '/collection-summer.png', link: 'קיץ' },
                                { title: 'DATE NIGHT', img: '/collection-datenight.png', link: 'ערב' },
                            ].map((col, i) => (
                                <Link href={`/catalog?category=${col.link}`} key={i} className="relative group overflow-hidden rounded-2xl h-full w-full block">
                                    <Image
                                        src={col.img}
                                        alt={col.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors" />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                                        <h3 className="text-3xl font-serif font-bold tracking-widest">{col.title}</h3>
                                        <span className="mt-4 text-sm uppercase tracking-widest border-b border-transparent group-hover:border-white transition-all">Shop Collection</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        {/* Footer Text Removed */}
                    </div>
                );
            default:
                return null;
        }
    }


    return (
        <div className={`h-screen w-full relative overflow-hidden bg-gradient-to-br ${section.bgColor} flex items-center justify-center`}>
            {section.id !== 'hero' && (
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                </div>
            )}

            {renderContent()}
        </div>
    )
}
