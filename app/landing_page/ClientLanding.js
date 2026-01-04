'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
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
            id: 'bonuses',
            type: 'bonuses',
            title: 'הבונוסים שלנו',
            description: 'ככל שסכום ההזמנה גבוה יותר, כך תקבלו יותר מתנות.',
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

    // --- לוגיקת איפוס גלילה ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if ('scrollRestoration' in window.history) {
                window.history.scrollRestoration = 'manual';
            }
            window.scrollTo(0, 0);
            setCurrentSection(0);
        }
    }, []);

    // --- לוגיקת גלילה (Wheel) ---
    const handleWheel = (e) => {
        if (isScrolling) return

        // בדיקה קריטית: האם אנחנו בתוך אזור גלילה פנימי?
        const target = e.target;
        const scrollable = target.closest('.internal-scroll');
        
        if (scrollable) {
            // האם הגענו לקצה העליון של הגלילה הפנימית ואנחנו מנסים לעלות?
            const atTop = scrollable.scrollTop === 0;
            // האם הגענו לקצה התחתון של הגלילה הפנימית ואנחנו מנסים לרדת?
            const atBottom = Math.abs(scrollable.scrollHeight - scrollable.scrollTop - scrollable.clientHeight) < 2;

            // אם אנחנו לא בקצוות - תן למשתמש לגלול את התוכן הפנימי ואל תעביר סקשן
            if ((e.deltaY > 0 && !atBottom) || (e.deltaY < 0 && !atTop)) return;
        }

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

        // אותה לוגיקה לגבי גלילה פנימית במובייל
        const target = e.target;
        const scrollable = target.closest('.internal-scroll');
        if (scrollable) {
             const atTop = scrollable.scrollTop === 0;
             const atBottom = Math.abs(scrollable.scrollHeight - scrollable.scrollTop - scrollable.clientHeight) < 2;
             if ((deltaY > 0 && !atBottom) || (deltaY < 0 && !atTop)) return;
        }

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
            {/* ... (Navbar and Dots remain the same as previous code) ... */}
            
             {/* Main Sliding Container */}
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
        </div>
    )
}

function Section({ section, isActive, newArrivals, stats }) {
    
    const renderContent = () => {
        switch (section.type) {
            case 'hero':
                return (
                    // הוספתי h-full flex flex-col כדי לוודא ניצול מלא של הגובה
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
                    // Flex Column Layout: Header -> Scrollable Area -> Footer
                    <div className="h-full w-full flex flex-col pt-20 pb-4 container mx-auto px-4 relative z-10">
                        
                        {/* 1. כותרת קבועה */}
                        <div className="text-center mb-4 shrink-0">
                            <h2 className="text-4xl md:text-6xl font-bold text-gray-900">{section.title}</h2>
                            <p className="text-gray-500 uppercase tracking-widest mt-2">{section.titleEn}</p>
                        </div>

                        {/* 2. אזור גלילה פנימי (internal-scroll) */}
                        {/* המחלקה internal-scroll חשובה לזיהוי בלוגיקת הגלילה הראשית */}
                        <div className="internal-scroll flex-1 w-full overflow-y-auto overflow-x-hidden px-2 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {newArrivals.map(product => (
                                    <div key={product.id} className="transform transition-all hover:scale-[1.02] duration-300">
                                        <ProductCard product={product} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. כפתור קבוע */}
                        <div className="text-center pt-4 shrink-0 bg-white/80 backdrop-blur-sm">
                            <Link href="/catalog">
                                <Button className="rounded-full px-10 py-6 text-lg bg-black text-white hover:bg-gray-800 shadow-xl">
                                    לכל הקטלוג
                                </Button>
                            </Link>
                        </div>
                    </div>
                );

            case 'bonuses':
                return (
                    <div className="h-full w-full flex flex-col justify-center items-center container mx-auto px-4 relative z-10 py-10">
                        {/* כותרת קבועה */}
                        <div className="text-center mb-8 shrink-0">
                            <h2 className="text-4xl md:text-6xl font-bold mb-4 text-white">{section.title}</h2>
                            <p className="text-xl text-white/70">{section.description}</p>
                        </div>

                        {/* אזור תוכן גמיש - אם המסך קטן, זה יהיה גליל */}
                        <div className="internal-scroll flex-1 w-full overflow-y-auto px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex items-center justify-center">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
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
                                        className={`relative p-8 rounded-2xl border flex flex-col items-center justify-center text-center min-h-[300px] ${tier.highlight ? 'bg-white/10 border-white md:scale-110 shadow-2xl shadow-white/10 z-10' : 'bg-zinc-900/50 border-zinc-700'}`}
                                    >
                                        {tier.highlight && <span className="absolute top-0 right-0 bg-white text-black text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">מומלץ</span>}
                                        <h3 className="text-lg text-gray-400 mb-2 font-bold">בקנייה מעל {tier.price} ₪</h3>
                                        <div className="text-4xl md:text-5xl font-black text-white mb-2">{tier.gift}</div>
                                        <div className="text-sm text-gray-500">בגודל 2 מ"ל במתנה</div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'collections':
                 return (
                    <div className="h-full w-full flex flex-col justify-center container mx-auto px-4 relative z-10 py-20">
                         <div className="text-center mb-8 shrink-0">
                            <h2 className="text-4xl font-bold text-gray-900">{section.title}</h2>
                        </div>
                        {/* Flex-1 מבטיח שהתמונות יתפסו את כל המקום שנשאר */}
                        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-4 pb-8 overflow-hidden">
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
                    <div className="h-full w-full flex flex-col">
                        <div className="h-[35%] bg-white w-full flex flex-col justify-center items-center py-4 overflow-hidden">
                            <div className="w-full max-w-[90%] mx-auto">
                                <BrandCarousel brands={stats.allBrands} />
                            </div>
                        </div>
                        <div className="h-[65%] bg-black text-white w-full flex flex-col justify-center items-center relative overflow-hidden">
                            <div className="container mx-auto px-4 text-center">
                                {/* Footer Content... */}
                                <span className="text-4xl font-bold tracking-widest uppercase text-white block mb-4">ML_TLV</span>
                                {/* שאר תוכן הפוטר */}
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    }

    return (
        // התיקון הקריטי: h-screen במקום h-full
        // זה מכריח את הדיב להיות בדיוק בגובה המסך, לא מילימטר יותר
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