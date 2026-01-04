'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Menu, X } from 'lucide-react'
import { Button } from '../components/ui/button'
import ProductCard from '../components/ProductCard'
import BrandCarousel from '../components/BrandCarousel'
import LiveStats from '../components/LiveStats'

export default function ClientLanding({ newArrivals, stats }) {
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
        },
        {
            id: 'new-arrivals',
            type: 'products',
            title: 'חדש על המדף',
            titleEn: 'NEW ARRIVALS',
            bgColor: 'from-white via-gray-50 to-white',
        },
        {
            id: 'bonuses-brands',
            type: 'bonuses-brands',
            title: 'הטבות ומותגים',
            description: 'מפנקים אתכם בכל הזמנה',
            bgColor: 'from-black via-zinc-900 to-black',
        },
        {
            id: 'collections',
            type: 'collections',
            title: 'קולקציות',
            bgColor: 'from-slate-50 via-white to-slate-50',
        },
        {
            id: 'footer',
            type: 'footer',
            bgColor: 'bg-black',
        }
    ]

    // --- אין צורך ב-Style גלובלי להסתרת סקול בר כי אין סקול בר ---

    // --- איפוס גלילה בטעינה ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if ('scrollRestoration' in window.history) {
                window.history.scrollRestoration = 'manual';
            }
            window.scrollTo(0, 0);
            setCurrentSection(0);
        }
    }, []);

    // --- לוגיקת גלילה (פשוטה יותר כעת - ללא גלילה פנימית) ---
    const handleWheel = (e) => {
        if (isScrolling) return
        if (Math.abs(e.deltaY) < 30) return;

        setIsScrolling(true)

        if (e.deltaY > 0 && currentSection < sections.length - 1) {
            setCurrentSection(prev => prev + 1)
        } else if (e.deltaY < 0 && currentSection > 0) {
            setCurrentSection(prev => prev - 1)
        }

        setTimeout(() => setIsScrolling(false), 1000)
    }

    // --- לוגיקת מגע (Mobile) ---
    const touchStart = useRef(null)

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
        <div ref={containerRef} className="h-screen w-full overflow-hidden relative bg-black text-white" dir="rtl">

            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                        <Link href="/"><span className="text-2xl font-bold tracking-widest uppercase mix-blend-difference text-white">ML_TLV</span></Link>
                    </motion.div>
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/catalog"><Button variant="ghost" className="text-white hover:bg-white/10 rounded-full px-6 mix-blend-difference">קטלוג</Button></Link>
                        <Link href="/sign-in"><Button variant="ghost" className="text-white hover:bg-white/10 rounded-full px-6 mix-blend-difference">כניסה</Button></Link>
                    </div>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-white p-2 mix-blend-difference z-50">
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            {/* Main Container */}
            <div
                className="h-full w-full transition-transform duration-1000 ease-[cubic-bezier(0.645,0.045,0.355,1.000)]"
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

            {/* Scroll Indicator */}
            <AnimatePresence>
                {currentSection === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed bottom-8 right-1/2 translate-x-1/2 z-40 flex flex-col items-center gap-2 mix-blend-difference pointer-events-none"
                    >
                        <span className="text-white text-xs tracking-widest uppercase opacity-60">Scroll</span>
                        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                            <ChevronDown className="text-white opacity-60" size={24} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function Section({ section, isActive, newArrivals, stats }) {

    const renderContent = () => {
        switch (section.type) {
            case 'hero':
                return (
                    <div className="h-full w-full relative flex flex-col justify-center items-center">
                        <div className="absolute inset-0 z-0">
                            <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-80">
                                <source src="/hero-video.mp4" type="video/mp4" />
                            </video>
                            <div className="absolute inset-0 bg-black/30" />
                        </div>
                        <div className="relative z-10 text-center px-4 max-w-4xl">
                            <h2 className="text-sm md:text-lg tracking-[0.3em] font-light uppercase mb-4 text-white drop-shadow-lg">{section.title}</h2>
                            <h1 className="text-5xl md:text-8xl font-bold mb-6 text-white drop-shadow-2xl">{section.subtitle}</h1>
                            <p className="text-lg md:text-xl text-white/90 mb-8 font-light leading-relaxed">{section.description}</p>
                            <Link href="/catalog">
                                <Button size="lg" className="bg-white text-black hover:bg-gray-200 rounded-full px-12 py-8 text-xl tracking-wider uppercase border-0">
                                    SHOP NOW
                                </Button>
                            </Link>
                        </div>
                        <div className="absolute bottom-0 w-full z-20">
                            <LiveStats stats={stats} />
                        </div>
                    </div>
                );

            case 'products':
                return (
                    // שימוש ב-justify-between מפזר את האלמנטים: כותרת למעלה, כפתור למטה, תוכן באמצע
                    <div className="h-screen w-full flex flex-col justify-between pt-24 pb-8 container mx-auto px-4 relative z-10">
                        {/* 1. Header (Fixed Height) */}
                        <div className="text-center shrink-0">
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">{section.title}</h2>
                            <p className="text-gray-500 uppercase tracking-widest mt-1 text-sm">{section.titleEn}</p>
                        </div>

                        {/* 2. Content (Takes available space and fits content inside) */}
                        {/* min-h-0 is crucial for flexbox to shrink content! */}
                        <div className="flex-1 min-h-0 flex items-center justify-center py-4">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full h-full max-h-[60vh]">
                                {newArrivals.slice(0, 4).map(product => ( // מגביל ל-4 מוצרים בדיוק
                                    <div key={product.id} className="h-full w-full flex flex-col">
                                        {/* מעביר h-full לכרטיס כדי שיתפוס את הגובה הנתון ולא יותר */}
                                        <div className="h-full">
                                            <ProductCard product={product} className="h-full object-contain" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. Footer Button (Fixed Height) */}
                        <div className="text-center shrink-0">
                            <Link href="/catalog">
                                <Button className="rounded-full px-8 py-6 text-lg bg-black text-white hover:bg-gray-800 shadow-xl">
                                    לכל הקטלוג
                                </Button>
                            </Link>
                        </div>
                    </div>
                );

            case 'bonuses-brands':
                return (
                    <div className="h-screen w-full flex flex-col pt-24 pb-0 relative z-10 bg-black">
                        {/* 1. Header */}
                        <div className="text-center mb-4 shrink-0 px-4">
                            <h2 className="text-3xl md:text-5xl font-bold mb-2 text-white">{section.title}</h2>
                            <p className="text-lg text-white/60">{section.description}</p>
                        </div>

                        {/* 2. Bonuses Area (Flex Grow) */}
                        <div className="flex-1 min-h-0 container mx-auto px-4 flex flex-col justify-center mb-4">
                            <div className="grid grid-cols-3 gap-4 h-full max-h-[45vh]">
                                {[
                                    { price: 300, gift: '2 דוגמיות', label: 'Basic' },
                                    { price: 500, gift: '4 דוגמיות', label: 'Popular', highlight: true },
                                    { price: 1000, gift: '6 דוגמיות', label: 'Premium' },
                                ].map((tier, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={isActive ? { opacity: 1, scale: 1 } : {}}
                                        transition={{ delay: 0.2 + (i * 0.1) }}
                                        // h-full מכריח את הכרטיס למלא את הגריד
                                        className={`rounded-2xl border flex flex-col items-center justify-center text-center p-4 h-full ${tier.highlight ? 'bg-white/10 border-white shadow-xl shadow-white/5' : 'bg-zinc-900/50 border-zinc-700'}`}
                                    >
                                        {tier.highlight && <span className="text-[10px] font-bold text-white bg-red-600 px-2 py-0.5 rounded mb-2">מומלץ</span>}
                                        <h3 className="text-sm md:text-base text-gray-400 mb-1 font-bold">בקנייה מעל {tier.price} ₪</h3>
                                        <div className="text-2xl md:text-4xl font-black text-white mb-1">{tier.gift}</div>
                                        <div className="text-xs text-gray-500">2 מ"ל במתנה</div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* 3. Brands Area (Fixed Bottom Section) */}
                        <div className="shrink-0 w-full bg-white py-6 md:py-8 mt-auto">
                            <div className="container mx-auto text-center mb-4">
                                <h2 className="text-xl font-serif text-black uppercase tracking-widest">המותגים שלנו</h2>
                                <div className="w-8 h-0.5 bg-black/20 mx-auto mt-2"></div>
                            </div>
                            <div className="w-full max-w-[90%] mx-auto h-12 md:h-16 flex items-center">
                                <BrandCarousel brands={stats.allBrands} />
                            </div>
                        </div>
                    </div>
                );

            case 'collections':
                return (
                    <div className="h-screen w-full flex flex-col justify-between container mx-auto px-4 relative z-10 pt-24 pb-12">
                        <div className="text-center mb-4 shrink-0">
                            <h2 className="text-4xl font-bold text-gray-900">{section.title}</h2>
                        </div>
                        {/* Grid fills available height without scroll */}
                        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
                            {[
                                { title: 'EXCLUSIVE', img: '/collection-exclusive.png', link: 'נדיר' },
                                { title: 'SUMMER', img: '/collection-summer.png', link: 'קיץ' },
                                { title: 'DATE NIGHT', img: '/collection-datenight.png', link: 'ערב' },
                            ].map((col, i) => (
                                <Link href={`/catalog?category=${col.link}`} key={i} className="relative group overflow-hidden rounded-2xl w-full h-full block">
                                    <div className="relative w-full h-full bg-gray-200">
                                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors" />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
                                            <h3 className="text-3xl font-serif font-bold tracking-widest">{col.title}</h3>
                                            <span className="mt-4 text-sm uppercase tracking-widest border-b border-transparent group-hover:border-white transition-all">Shop Collection</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                );

            case 'footer':
                return (
                    <div className="h-screen w-full flex flex-col justify-center items-center relative bg-black text-white">
                        <div className="container mx-auto px-4 text-center">

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto mb-12 text-sm">
                                <div className="flex flex-col gap-4">
                                    <h4 className="font-bold text-lg mb-2 text-white">עקבו אחרינו</h4>
                                    <a href="#" className="hover:text-primary transition-colors flex items-center justify-center gap-2 text-gray-400 hover:text-white">
                                        <span>ml_tlv@</span>
                                    </a>
                                </div>

                                <div className="flex flex-col gap-2 text-gray-400">
                                    <h4 className="font-bold text-white text-lg mb-2">מידע ונהלים</h4>
                                    <Link href="/terms" className="hover:text-white transition-colors">תקנון האתר</Link>
                                    <Link href="/shipping" className="hover:text-white transition-colors">משלוחים והחזרות</Link>
                                    <Link href="/privacy" className="hover:text-white transition-colors">מדיניות פרטיות</Link>
                                </div>

                                <div className="flex flex-col gap-2 text-gray-400">
                                    <h4 className="font-bold text-white text-lg mb-2">שירות לקוחות</h4>
                                    <Link href="/about" className="hover:text-white transition-colors">אודות</Link>
                                    <Link href="/contact" className="hover:text-white transition-colors">צור קשר</Link>
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-8 mt-8 text-white/30 text-xs w-full max-w-3xl mx-auto">
                                <p>© 2026 ML_TLV. כל הזכויות שמורות.</p>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    }

    return (
        <div className={`h-screen w-full relative overflow-hidden bg-gradient-to-br ${section.bgColor || 'from-black to-gray-900'} flex items-center justify-center`}>
            {section.type !== 'hero' && section.type !== 'footer' && section.type !== 'products' && (
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                </div>
            )}
            {renderContent()}
        </div>
    )
}