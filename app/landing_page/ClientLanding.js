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

    // הגדרת הסקשנים - הפוטר הוא הסקשן האחרון
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
            subtitle: 'הניחוחות שכולם מדברים עליהם',
            bgColor: 'from-white via-gray-50 to-white',
        },
        {
            id: 'bonuses',
            type: 'bonuses',
            title: 'הבונוסים שלנו',
            subtitle: 'מפנקים אתכם בכל הזמנה',
            description: 'ככל שסכום ההזמנה גבוה יותר, כך תקבלו יותר מתנות.',
            bgColor: 'from-black via-zinc-900 to-black',
        },
        {
            id: 'collections',
            type: 'collections',
            title: 'קולקציות',
            subtitle: 'בחרו את הסגנון שלכם',
            bgColor: 'from-slate-50 via-white to-slate-50',
        },
        {
            id: 'footer',
            type: 'footer', // סקשן עצמאי לחלוטין
            title: 'סיום',
            bgColor: 'bg-black', // צבע בסיס (התוכן יחולק פנימית)
        }
    ]

    // --- לוגיקת איפוס גלילה ברענון ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if ('scrollRestoration' in window.history) {
                window.history.scrollRestoration = 'manual';
            }
            window.scrollTo(0, 0);
            setCurrentSection(0);
        }
    }, []);

    // --- לוגיקת גלילה מבוקרת (Wheel) ---
    const handleWheel = (e) => {
        // מניעת גלילה כפולה בזמן אנימציה
        if (isScrolling) return

        // בדיקה אם המשתמש נמצא בתוך אלמנט עם גלילה פנימית (כמו רשימת המוצרים)
        const target = e.target;
        const scrollable = target.closest('.scrollable-content');
        if (scrollable) {
            const atTop = scrollable.scrollTop === 0;
            const atBottom = Math.abs(scrollable.scrollHeight - scrollable.scrollTop - scrollable.clientHeight) < 1;

            // אם אנחנו לא בקצוות של האלמנט הפנימי, תן לו לגלול רגיל ולא את כל המסך
            if ((e.deltaY > 0 && !atBottom) || (e.deltaY < 0 && !atTop)) return;
        }

        // סף רגישות (למנוע תזוזות עכבר קטנות)
        if (Math.abs(e.deltaY) < 30) return;

        setIsScrolling(true)
        
        if (e.deltaY > 0 && currentSection < sections.length - 1) {
            setCurrentSection(prev => prev + 1)
        } else if (e.deltaY < 0 && currentSection > 0) {
            setCurrentSection(prev => prev - 1)
        }

        // נעילת גלילה ל-1000ms (זמן האנימציה) כדי למנוע דילוג מהיר
        setTimeout(() => setIsScrolling(false), 1000)
    }

    // --- לוגיקת מקלדת (חצים) ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isScrolling) return;
            if (e.key === 'ArrowDown' && currentSection < sections.length - 1) {
                setIsScrolling(true);
                setCurrentSection(prev => prev + 1);
                setTimeout(() => setIsScrolling(false), 1000);
            }
            if (e.key === 'ArrowUp' && currentSection > 0) {
                setIsScrolling(true);
                setCurrentSection(prev => prev - 1);
                setTimeout(() => setIsScrolling(false), 1000);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSection, isScrolling, sections.length]);


    // --- לוגיקת מגע (Mobile) ---
    const touchStart = useRef(null)
    
    const handleTouchStart = (e) => {
        touchStart.current = e.touches[0].clientY
    }

    const handleTouchEnd = (e) => {
        if (isScrolling || touchStart.current === null) return
        const touchEnd = e.changedTouches[0].clientY
        const deltaY = touchStart.current - touchEnd

        if (Math.abs(deltaY) > 50) { // סף החלקה
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

    // הוספת האזנה לאירועים
    useEffect(() => {
        const container = containerRef.current
        if (!container) return
        // Passive: false חשוב כדי למנוע את הגלילה הטבעית של הדפדפן
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
            
            {/* Navbar Overlay */}
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
                    </div>

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

            {/* Side Dots Navigation */}
            <div className="fixed left-8 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-3 mix-blend-difference">
                {sections.map((section, index) => (
                    <button
                        key={section.id}
                        onClick={() => {
                            if (!isScrolling) {
                                setIsScrolling(true);
                                setCurrentSection(index);
                                setTimeout(() => setIsScrolling(false), 1000);
                            }
                        }}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${currentSection === index ? 'bg-white w-8' : 'bg-white/30 hover:bg-white/50'}`}
                    />
                ))}
            </div>

            {/* Main Sliding Container */}
            <div
                className="h-full w-full transition-transform duration-1000 ease-[cubic-bezier(0.645,0.045,0.355,1.000)]" // אפקט Ease יוקרתי יותר
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
            
            {/* Scroll Indicator (Only on first section) */}
            <AnimatePresence>
            {currentSection === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
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
            </AnimatePresence>
        </div>
    )
}

// --- קומפוננטת סקשן בודד ---
function Section({ section, isActive, newArrivals, stats }) {
    
    // רנדור תוכן דינמי לפי סוג הסקשן
    const renderContent = () => {
        switch (section.type) {
            case 'hero':
                return (
                    <>
                        <div className="absolute inset-0 z-0">
                            {/* Placeholder for Video - Ensure /hero-video.mp4 exists in public folder */}
                            <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-80">
                                <source src="/hero-video.mp4" type="video/mp4" />
                            </video>
                            <div className="absolute inset-0 bg-black/30" />
                        </div>
                        <div className="relative z-10 w-full h-full flex flex-col justify-center items-center text-center px-4">
                             <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={isActive ? { opacity: 1, y: 0 } : {}}
                                transition={{ delay: 0.3, duration: 0.8 }}
                             >
                                <h2 className="text-sm md:text-lg tracking-[0.3em] font-light uppercase mb-4 text-white drop-shadow-lg">{section.title}</h2>
                                <h1 className="text-5xl md:text-8xl font-bold mb-6 text-white drop-shadow-2xl">{section.subtitle}</h1>
                                <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto font-light leading-relaxed">{section.description}</p>
                                <Link href="/catalog">
                                    <Button size="lg" className="bg-white text-black hover:bg-gray-200 rounded-full px-12 py-8 text-xl tracking-wider uppercase transition-all hover:scale-105 border-0">
                                        SHOP NOW
                                    </Button>
                                </Link>
                             </motion.div>
                        </div>
                        <div className="absolute bottom-0 w-full z-20">
                            <LiveStats stats={stats} />
                        </div>
                    </>
                );

            case 'products':
                return (
                    <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10 pt-16">
                        <div className="text-center mb-6 shrink-0">
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">{section.title}</h2>
                            <div className="w-20 h-1 bg-black mx-auto" />
                        </div>
                        {/* Scrollable Content Container with Hidden Scrollbar */}
                        <div className="scrollable-content overflow-y-auto overflow-x-hidden p-2 flex-1 w-full max-w-[95vw] mx-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-12">
                                {newArrivals.map(product => (
                                    <div key={product.id} className="transform transition-all hover:scale-105 duration-300">
                                        <ProductCard product={product} />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="text-center pb-8 pt-4 shrink-0">
                            <Link href="/catalog">
                                <Button className="rounded-full px-8 bg-black text-white hover:bg-gray-800 shadow-xl">לכל הקטלוג</Button>
                            </Link>
                        </div>
                    </div>
                );

            case 'bonuses':
                return (
                    <div className="container mx-auto px-4 h-full flex flex-col justify-center items-center relative z-10">
                        <div className="text-center mb-16 text-white">
                            <h2 className="text-4xl md:text-6xl font-bold mb-4">{section.title}</h2>
                            <p className="text-xl text-white/70">{section.description}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto w-full px-4">
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
                                    className={`relative p-8 rounded-2xl border flex flex-col items-center justify-center text-center h-64 md:h-80 ${tier.highlight ? 'bg-white/10 border-white scale-110 shadow-2xl shadow-white/10 z-10' : 'bg-zinc-900/50 border-zinc-700'}`}
                                >
                                    {tier.highlight && <span className="absolute top-0 right-0 bg-white text-black text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">מומלץ</span>}
                                    <h3 className="text-lg text-gray-400 mb-2 font-bold">בקנייה מעל {tier.price} ₪</h3>
                                    <div className="text-4xl md:text-5xl font-black text-white mb-2">{tier.gift}</div>
                                    <div className="text-sm text-gray-500">בגודל 2 מ"ל במתנה</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                );

            case 'collections':
                return (
                    <div className="container mx-auto px-4 h-full flex flex-col justify-center relative z-10 pt-20">
                         <div className="text-center mb-8">
                            <h2 className="text-4xl font-bold text-gray-900">{section.title}</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[60vh]">
                            {[
                                { title: 'EXCLUSIVE', img: '/collection-exclusive.png', link: 'נדיר' },
                                { title: 'SUMMER', img: '/collection-summer.png', link: 'קיץ' },
                                { title: 'DATE NIGHT', img: '/collection-datenight.png', link: 'ערב' },
                            ].map((col, i) => (
                                <Link href={`/catalog?category=${col.link}`} key={i} className="relative group overflow-hidden rounded-2xl h-full w-full block">
                                    <div className="relative w-full h-full">
                                        {/* Placeholder images - replace with real paths */}
                                        <div className="absolute inset-0 bg-gray-200" /> 
                                        {/* Uncomment Image below when real images are ready */}
                                        {/* <Image src={col.img} alt={col.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" /> */}
                                        
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
                // חלוקת הפוטר ל-2 חלקים: למעלה מותגים (לבן), למטה מידע (שחור) כדי ליצור סקשן מלא 100vh
                return (
                    <div className="h-full w-full flex flex-col">
                        
                        {/* Top Part: Brands (White Background) - ~35% height */}
                        <div className="h-[35%] bg-white w-full flex flex-col justify-center items-center py-8">
                            <div className="w-full max-w-[90%] mx-auto">
                                <BrandCarousel brands={stats.allBrands} />
                            </div>
                        </div>

                        {/* Bottom Part: Info & Links (Black Background) - ~65% height */}
                        <div className="h-[65%] bg-black text-white w-full flex flex-col justify-center items-center relative">
                            <div className="container mx-auto px-4 text-center">
                                {/* Logo */}
                                <div className="mb-8">
                                    <span className="text-4xl font-bold tracking-widest uppercase text-white block">ML_TLV</span>
                                    <p className="text-white/60 max-w-md mx-auto mt-4">חיו את הרגע, עצבו את הזיכרון. בשמי נישה יוקרתיים שנבחרו בקפידה עבורכם.</p>
                                </div>

                                {/* Columns */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto mb-12 text-sm">
                                    <div className="flex flex-col gap-4">
                                        <h4 className="font-bold text-lg mb-2">עקבו אחרינו</h4>
                                        <a href="#" className="hover:text-primary transition-colors flex items-center justify-center gap-2">
                                           <span>ml_tlv@</span> 
                                           {/* Instagram Icon Placeholder */}
                                           <div className="w-5 h-5 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-md"></div>
                                        </a>
                                        <span className="text-gray-400">מגזין הבישום</span>
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
                                        <Link href="/faq" className="hover:text-white transition-colors">שאלות ותשובות</Link>
                                        <Link href="/contact" className="hover:text-white transition-colors">צור קשר</Link>
                                    </div>
                                </div>

                                {/* Copyright */}
                                <div className="border-t border-white/10 pt-8 mt-8 text-white/30 text-xs flex flex-col md:flex-row justify-between items-center w-full max-w-5xl mx-auto">
                                    <p>© 2026 ML_TLV. כל הזכויות שמורות.</p>
                                    <div className="flex gap-4 mt-2 md:mt-0">
                                       <span>עיצוב ופיתוח</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Accessibility Icon Placeholder */}
                            <div className="absolute bottom-6 left-6 bg-blue-500 p-2 rounded-full cursor-pointer hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 14.14 14.14"/></svg>
                            </div>
                            {/* Whatsapp Icon Placeholder */}
                            <div className="absolute bottom-6 right-6 bg-green-500 p-2 rounded-full cursor-pointer hover:scale-110 transition-transform">
                                <div className="w-6 h-6 bg-white rounded-full"></div> 
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
            {/* Background Pattern for specific sections */}
            {section.type !== 'hero' && section.type !== 'footer' && section.type !== 'products' && (
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                </div>
            )}
            
            {renderContent()}
        </div>
    )
}