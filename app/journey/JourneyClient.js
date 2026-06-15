'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { ArrowLeft, ArrowRight, Plus, Check, ShoppingBag, X } from 'lucide-react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function JourneyClient({ initialProducts }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [box, setBox] = useState([]);
    const [isHoveringProduct, setIsHoveringProduct] = useState(false);
    const { addToCart } = useCart();
    const router = useRouter();
    const containerRef = useRef(null);

    const BOX_SIZE = 5;
    const currentProduct = initialProducts[currentIndex];

    // Custom Cursor Logic
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);
    const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
    const cursorXSpring = useSpring(cursorX, springConfig);
    const cursorYSpring = useSpring(cursorY, springConfig);

    // Parallax Logic
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    useEffect(() => {
        const moveCursor = (e) => {
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);
            
            // Normalize mouse position for parallax (-1 to 1)
            const x = (e.clientX / window.innerWidth - 0.5) * 2;
            const y = (e.clientY / window.innerHeight - 0.5) * 2;
            mouseX.set(x);
            mouseY.set(y);
        };
        window.addEventListener('mousemove', moveCursor);
        return () => window.removeEventListener('mousemove', moveCursor);
    }, []);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % initialProducts.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + initialProducts.length) % initialProducts.length);
    };

    const handleDragEnd = (e, { offset, velocity }) => {
        const swipe = offset.x;
        if (swipe < -50) {
            handleNext();
        } else if (swipe > 50) {
            handlePrev();
        }
    };

    const handleAddToBox = () => {
        if (box.length >= BOX_SIZE) {
            toast.error('הקופסה כבר מלאה! עברו לקופה.');
            return;
        }

        const size = currentProduct.price_5ml ? 5 : 2;
        const price = currentProduct.price_5ml || currentProduct.price_2ml;

        if (!price) return;

        setBox([...box, { ...currentProduct, selectedSize: size, selectedPrice: price, uniqueId: Date.now() }]);
        
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate([30, 50, 30]);
        }
    };

    const handleRemoveFromBox = (index) => {
        const newBox = [...box];
        newBox.splice(index, 1);
        setBox(newBox);
    };

    const handleFinish = async () => {
        if (box.length === 0) return;

        confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.9 },
            colors: ['#D4AF37', '#FFDF00', '#ffffff', '#000000']
        });

        for (const item of box) {
            await addToCart({
                id: item.id,
                brand: item.brand,
                name: item.name,
                image_url: item.image_url,
                price: item.selectedPrice,
                size: item.selectedSize,
                category: item.category
            }, 1);
        }

        toast.success('חותם הריח שלכם נוצר בהצלחה!');
        setTimeout(() => router.push('/cart'), 1500);
    };

    // Derived color based on category (mock logic)
    const getGlowColor = (category) => {
        const cat = category?.toLowerCase() || '';
        if (cat.includes('עץ') || cat.includes('wood')) return 'bg-amber-900/30';
        if (cat.includes('מתוק') || cat.includes('sweet')) return 'bg-pink-900/30';
        if (cat.includes('רענן') || cat.includes('fresh')) return 'bg-blue-900/30';
        if (cat.includes('פרח') || cat.includes('floral')) return 'bg-purple-900/30';
        return 'bg-gray-700/30';
    };

    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.8,
            rotateY: direction > 0 ? 45 : -45
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1,
            rotateY: 0
        },
        exit: (direction) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.8,
            rotateY: direction < 0 ? 45 : -45
        })
    };

    return (
        <div ref={containerRef} className="fixed inset-0 overflow-hidden bg-[#eef0f2] font-sans select-none z-[99999]" dir="rtl" style={{ cursor: 'none' }}>
            <style dangerouslySetInnerHTML={{__html: `
                header, footer, nav, 
                [id*="smart-advisor"], [class*="smart-advisor"],
                [id*="nagish"], [class*="nagish"],
                [id*="accessibility"], [class*="accessibility"],
                .intercom-lightweight-app, #intercom-container
                { display: none !important; }
                body { overflow: hidden !important; }
            `}} />
            
            {/* Custom Cursor */}
            <motion.div 
                className="pointer-events-none fixed top-0 left-0 z-50 rounded-full flex items-center justify-center"
                style={{
                    x: cursorXSpring,
                    y: cursorYSpring,
                    width: isHoveringProduct ? 120 : 30,
                    height: isHoveringProduct ? 120 : 30,
                    backgroundColor: isHoveringProduct ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0.5)',
                    translateX: '-50%',
                    translateY: '-50%',
                }}
            >
                {isHoveringProduct && (
                    <span className="text-white text-sm font-bold tracking-widest uppercase opacity-90">Add</span>
                )}
            </motion.div>

            {/* Ambient Background Glow */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentProduct.id + "-glow"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className={`absolute inset-0 transition-colors duration-1000 ${getGlowColor(currentProduct.category)}`}
                    style={{ filter: 'blur(150px)' }}
                />
            </AnimatePresence>

            {/* Giant Parallax Typography */}
            <motion.div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] overflow-hidden"
                style={{
                    x: useSpring(useMotionValue(mouseX.get() * -50), springConfig),
                    y: useSpring(useMotionValue(mouseY.get() * -30), springConfig),
                }}
            >
                <h1 className="text-[15vw] md:text-[18vw] font-black leading-none text-black whitespace-nowrap blur-[1px]">
                    {currentProduct.brand.toUpperCase()}
                </h1>
            </motion.div>

            {/* Main Carousel Area */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-10 pb-40 px-4 md:px-20">
                <AnimatePresence initial={false} custom={1}>
                    <motion.div
                        key={currentIndex}
                        custom={1}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.5 },
                            scale: { duration: 0.5 }
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={handleDragEnd}
                        className="relative w-full max-w-md aspect-[3/4] flex items-center justify-center group"
                        onMouseEnter={() => setIsHoveringProduct(true)}
                        onMouseLeave={() => setIsHoveringProduct(false)}
                        onClick={handleAddToBox}
                    >
                        {/* The Bottle with Mix Blend Mode */}
                        <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-700 ease-out flex items-center justify-center" style={{ mixBlendMode: 'multiply' }}>
                            <Image 
                                src={currentProduct.image_url || '/logo_v5.png'} 
                                alt={currentProduct.name}
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 100vw, 50vw"
                                priority
                            />
                            {/* Artificial Floor Shadow */}
                            <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-3/4 h-8 bg-black/10 blur-xl rounded-[100%]" />
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Product Info (Fades in/out) */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex + "-info"}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="absolute top-[10%] md:top-[15%] right-8 md:right-20 text-right pointer-events-none"
                    >
                        <p className="text-xl md:text-2xl text-gray-500 font-light tracking-widest uppercase mb-2">{currentProduct.brand}</p>
                        <h2 className="text-4xl md:text-6xl font-bold text-black mb-4 drop-shadow-sm">{currentProduct.name}</h2>
                        {currentProduct.top_notes && (
                            <p className="text-gray-600 text-sm md:text-base max-w-xs">{currentProduct.top_notes}</p>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Arrows */}
            <div className="absolute top-1/2 -translate-y-1/2 left-4 md:left-10 z-40 flex flex-col gap-4">
                <button 
                    onClick={handleNext} 
                    className="w-14 h-14 rounded-full border border-black/10 bg-white/50 backdrop-blur-md flex items-center justify-center text-black hover:bg-black hover:text-white transition-all group shadow-lg"
                    onMouseEnter={() => cursorX.set(-100)} // Hide cursor
                >
                    <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                </button>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 right-4 md:right-10 z-40 flex flex-col gap-4">
                <button 
                    onClick={handlePrev} 
                    className="w-14 h-14 rounded-full border border-black/10 bg-white/50 backdrop-blur-md flex items-center justify-center text-black hover:bg-black hover:text-white transition-all group shadow-lg"
                >
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            {/* Immersive Glassmorphism Dock */}
            <motion.div 
                className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-3xl"
                initial={{ y: 150 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 100, delay: 0.5 }}
            >
                <div className="bg-white/80 backdrop-blur-2xl border border-white rounded-full p-4 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
                    <div className="flex items-center gap-2 md:gap-4 px-4">
                        {[...Array(BOX_SIZE)].map((_, i) => (
                            <div key={i} className="relative w-12 h-12 md:w-16 md:h-16">
                                <div className={`absolute inset-0 rounded-full border border-dashed transition-all duration-500 flex items-center justify-center ${box[i] ? 'border-transparent bg-black/5 scale-100' : 'border-black/20 scale-90'}`}>
                                    {!box[i] && <div className="w-1.5 h-1.5 rounded-full bg-black/20" />}
                                </div>
                                
                                <AnimatePresence>
                                    {box[i] && (
                                        <motion.div
                                            initial={{ scale: 0, y: 50, rotate: 180 }}
                                            animate={{ scale: 1, y: 0, rotate: 0 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                            className="absolute inset-0 rounded-full overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.1)] bg-white group"
                                        >
                                            <Image src={box[i].image_url || '/logo_v5.png'} alt="item" fill className="object-cover mix-blend-multiply p-1" />
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleRemoveFromBox(i); }}
                                                className="absolute inset-0 bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                            >
                                                <X className="w-5 h-5 text-red-500" />
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleFinish}
                        disabled={box.length === 0}
                        className={`flex items-center gap-3 px-8 py-4 md:py-5 rounded-full font-bold text-sm md:text-base tracking-wide uppercase transition-all duration-500 ${box.length === BOX_SIZE ? 'bg-black text-white shadow-[0_10px_30px_rgba(0,0,0,0.3)]' : box.length > 0 ? 'bg-black/90 text-white hover:bg-black' : 'bg-transparent text-black/30 border border-black/10 cursor-not-allowed'}`}
                        onMouseEnter={() => cursorX.set(-100)} // Hide custom cursor
                    >
                        <span>{box.length === 0 ? 'Pick Scents' : box.length === BOX_SIZE ? 'Checkout Now' : `Add ${BOX_SIZE - box.length} More`}</span>
                        {box.length === BOX_SIZE ? <Check className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                    </button>
                </div>
            </motion.div>

        </div>
    );
}
