'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowLeft, Droplet, Check, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function JourneyClient({ initialProducts }) {
    const [step, setStep] = useState(0); // 0 = Hero, 1 = Builder
    const [box, setBox] = useState([]); // Up to 5 items
    const [activeCategory, setActiveCategory] = useState('All');
    const { addToCart } = useCart();
    const router = useRouter();

    const BOX_SIZE = 5;

    // Categories derived from products
    const categories = ['All', ...new Set(initialProducts.map(p => p.category).filter(Boolean))].slice(0, 5);
    
    const filteredProducts = activeCategory === 'All' 
        ? initialProducts 
        : initialProducts.filter(p => p.category === activeCategory);

    const handleAddToBox = (product) => {
        if (box.length >= BOX_SIZE) {
            toast.error('הקופסה כבר מלאה! לחץ על סיום כדי להמשיך.');
            return;
        }

        const size = product.price_5ml ? 5 : 2;
        const price = product.price_5ml || product.price_2ml;

        if (!price) return;

        setBox([...box, { ...product, selectedSize: size, selectedPrice: price, uniqueId: Date.now() }]);
        
        // Haptic feedback & sound (if supported, mobile mostly)
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(50);
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
            particleCount: 150,
            spread: 70,
            origin: { y: 0.8 },
            colors: ['#D4AF37', '#FFDF00', '#ffffff'] // Gold/Luxury colors
        });

        // Add all items to real cart context
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

        toast.success('הקולקציה נשמרה בהצלחה!');
        
        // Slight delay for effect, then redirect to cart/login
        setTimeout(() => {
            router.push('/cart');
        }, 1500);
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] font-sans" dir="rtl">
            {/* Background Ambient Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-600/10 blur-[120px] rounded-full pointer-events-none" />

            <AnimatePresence mode="wait">
                {step === 0 && (
                    <motion.div 
                        key="hero"
                        className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, y: -50, filter: 'blur(10px)' }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                        >
                            <Sparkles className="w-12 h-12 text-yellow-500 mx-auto mb-6 opacity-80" />
                        </motion.div>
                        
                        <motion.h1 
                            className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                        >
                            מעבדת הבשמים
                        </motion.h1>
                        
                        <motion.p 
                            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.8 }}
                        >
                            במקום לנחש, בואו להרכיב את חותם הריח הבא שלכם. בחרו עד 5 ניחוחות יוקרתיים וקבלו אותם בקופסת גילוי אישית היישר אליכם.
                        </motion.p>
                        
                        <motion.button
                            onClick={() => setStep(1)}
                            className="group relative px-8 py-4 bg-white text-black font-semibold rounded-full text-lg overflow-hidden transition-transform hover:scale-105 active:scale-95"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8, duration: 0.8 }}
                        >
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-gray-200 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative flex items-center gap-2">
                                התחל להרכיב
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            </span>
                        </motion.button>
                    </motion.div>
                )}

                {step === 1 && (
                    <motion.div 
                        key="builder"
                        className="relative z-10 flex flex-col h-screen"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* Header */}
                        <div className="flex-none p-6 border-b border-white/10 bg-black/50 backdrop-blur-md">
                            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold">בחירת ניחוחות</h2>
                                    <p className="text-gray-400 text-sm">בחרו {BOX_SIZE} בשמים לקופסה שלכם</p>
                                </div>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${activeCategory === cat ? 'bg-white text-black font-medium scale-105' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                                        >
                                            {cat === 'All' ? 'הכל' : cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Product Grid */}
                        <div className="flex-1 overflow-y-auto p-6 pb-40 scrollbar-hide">
                            <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                <AnimatePresence>
                                    {filteredProducts.map((p, idx) => (
                                        <motion.div
                                            key={p.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.4, delay: idx * 0.05 }}
                                            className="group relative bg-white/5 rounded-2xl p-4 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all cursor-pointer overflow-hidden"
                                            onClick={() => handleAddToBox(p)}
                                        >
                                            <div className="aspect-square relative mb-4 rounded-xl overflow-hidden bg-black/50">
                                                <Image 
                                                    src={p.image_url || '/logo_v5.png'} 
                                                    alt={p.name} 
                                                    fill 
                                                    className="object-contain p-2 group-hover:scale-110 transition-transform duration-700" 
                                                    sizes="(max-width: 768px) 50vw, 25vw"
                                                />
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xs text-gray-400 mb-1">{p.brand}</div>
                                                <h3 className="font-semibold text-sm line-clamp-1">{p.name}</h3>
                                            </div>
                                            
                                            {/* Hover overlay add button */}
                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center scale-75 group-hover:scale-100 transition-transform duration-300">
                                                    <Droplet className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Floating Box Dock */}
                        <motion.div 
                            className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/90 to-transparent"
                            initial={{ y: 100 }}
                            animate={{ y: 0 }}
                            transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
                        >
                            <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-4 md:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex gap-3 md:gap-4 flex-1 w-full justify-center md:justify-start">
                                    {[...Array(BOX_SIZE)].map((_, i) => (
                                        <div key={i} className="relative w-14 h-14 md:w-16 md:h-16">
                                            <div className={`absolute inset-0 rounded-2xl border-2 border-dashed transition-colors duration-300 flex items-center justify-center ${box[i] ? 'border-transparent bg-white/10' : 'border-white/20'}`}>
                                                {!box[i] && <div className="w-2 h-2 rounded-full bg-white/20" />}
                                            </div>
                                            
                                            <AnimatePresence>
                                                {box[i] && (
                                                    <motion.div
                                                        initial={{ scale: 0, rotate: -45 }}
                                                        animate={{ scale: 1, rotate: 0 }}
                                                        exit={{ scale: 0 }}
                                                        className="absolute inset-0 bg-white rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.3)] cursor-pointer group"
                                                        onClick={() => handleRemoveFromBox(i)}
                                                    >
                                                        <Image src={box[i].image_url || '/logo_v5.png'} alt="item" fill className="object-cover" />
                                                        <div className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <div className="w-4 h-1 bg-white rounded-full rotate-45 absolute" />
                                                            <div className="w-4 h-1 bg-white rounded-full -rotate-45 absolute" />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                                
                                <button
                                    onClick={handleFinish}
                                    disabled={box.length === 0}
                                    className={`flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold transition-all w-full md:w-auto ${box.length === BOX_SIZE ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.5)] scale-105' : box.length > 0 ? 'bg-white/90 text-black hover:bg-white' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
                                >
                                    {box.length === BOX_SIZE ? <Check className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                                    <span>{box.length === 0 ? 'בחר בשמים' : box.length === BOX_SIZE ? 'המשך לקופה' : `המשך עם ${box.length} פריטים`}</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
