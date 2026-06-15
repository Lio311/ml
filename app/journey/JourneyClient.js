'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Plus, Check, ShoppingBag, X } from 'lucide-react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function JourneyClient({ initialProducts }) {
    const [activeBrand, setActiveBrand] = useState(null);
    const [box, setBox] = useState([]);
    const { addToCart } = useCart();
    const router = useRouter();

    const BOX_SIZE = 5;

    // Extract unique brands and sort alphabetically
    const brands = useMemo(() => {
        const uniqueBrands = [...new Set(initialProducts.map(p => p.brand).filter(Boolean))];
        return uniqueBrands.sort((a, b) => a.localeCompare(b));
    }, [initialProducts]);

    // Products for the currently selected brand
    const filteredProducts = useMemo(() => {
        if (!activeBrand) return [];
        return initialProducts.filter(p => p.brand === activeBrand);
    }, [activeBrand, initialProducts]);

    const handleAddToBox = (product) => {
        if (box.length >= BOX_SIZE) {
            toast.error('הקופסה כבר מלאה! עברו לקופה.');
            return;
        }

        const size = product.price_5ml ? 5 : 2;
        const price = product.price_5ml || product.price_2ml;

        if (!price) return;

        setBox([...box, { ...product, selectedSize: size, selectedPrice: price, uniqueId: Date.now() }]);
        
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate([30]);
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

        toast.success('המעבדה נשמרה בהצלחה!');
        setTimeout(() => router.push('/cart'), 1500);
    };

    return (
        <div className="min-h-screen bg-[#f5f5f7] font-sans text-gray-900 pb-32" dir="rtl">
            <style dangerouslySetInnerHTML={{__html: `
                header, footer, nav, 
                [id*="smart-advisor"], [class*="smart-advisor"],
                [id*="nagish"], [class*="nagish"],
                [id*="accessibility"], [class*="accessibility"],
                .intercom-lightweight-app, #intercom-container
                { display: none !important; }
            `}} />
            
            {/* Main Header / Navigation */}
            <div className="sticky top-0 z-40 bg-[#f5f5f7]/80 backdrop-blur-xl border-b border-gray-200/50 p-6 flex items-center justify-center">
                <div className="w-full max-w-6xl flex items-center justify-between">
                    <div className="flex-1">
                        <AnimatePresence mode="wait">
                            {activeBrand && (
                                <motion.button
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    onClick={() => setActiveBrand(null)}
                                    className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-black transition-colors"
                                >
                                    <ArrowRight className="w-4 h-4" />
                                    חזרה למותגים
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                    
                    <h1 className="text-xl md:text-2xl font-black tracking-tight text-center flex-1">
                        {activeBrand ? activeBrand.toUpperCase() : 'בחירת מותג'}
                    </h1>
                    
                    <div className="flex-1 text-left text-xs font-medium text-gray-400 uppercase tracking-widest hidden md:block">
                        The Fragrance Lab
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <main className="p-6 md:p-12 w-full max-w-7xl mx-auto">
                <AnimatePresence mode="wait">
                    {!activeBrand ? (
                        /* Step 1: Brands Grid */
                        <motion.div
                            key="brands"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
                        >
                            {brands.map((brand, idx) => (
                                <motion.div
                                    key={brand}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => setActiveBrand(brand)}
                                    className="group relative bg-white rounded-3xl p-8 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-200 flex flex-col items-center justify-center min-h-[160px]"
                                >
                                    <h2 className="text-xl md:text-2xl font-black tracking-widest uppercase text-center text-gray-800 group-hover:text-black transition-colors">
                                        {brand}
                                    </h2>
                                    <div className="absolute bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-xs font-semibold text-gray-400">הצג קולקציה</span>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        /* Step 2: Products Grid */
                        <motion.div
                            key="products"
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            transition={{ duration: 0.4 }}
                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                        >
                            {filteredProducts.map((p, idx) => (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col"
                                >
                                    <div className="relative aspect-[4/5] bg-white p-6 flex items-center justify-center">
                                        <div className="relative w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out">
                                            <Image 
                                                src={p.image_url || '/logo_v5.png'} 
                                                alt={p.name}
                                                fill
                                                className="object-contain"
                                                sizes="(max-width: 768px) 100vw, 33vw"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 pt-0 flex flex-col flex-1 justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{p.brand}</p>
                                            <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2 line-clamp-2">{p.name}</h3>
                                            {p.top_notes && (
                                                <p className="text-sm text-gray-500 line-clamp-2">{p.top_notes}</p>
                                            )}
                                        </div>
                                        
                                        <button 
                                            onClick={() => handleAddToBox(p)}
                                            className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-sm font-bold transition-colors border border-gray-200 hover:border-black"
                                        >
                                            <Plus className="w-4 h-4" />
                                            הוסף למעבדה
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Floating Dock */}
            <motion.div 
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl"
                initial={{ y: 150 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
            >
                <div className="bg-white/80 backdrop-blur-3xl border border-gray-200/50 rounded-full p-4 flex flex-col md:flex-row items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.1)] gap-4 md:gap-0">
                    <div className="flex items-center justify-center gap-3 md:gap-4 px-2 md:px-4 w-full md:w-auto">
                        {[...Array(BOX_SIZE)].map((_, i) => (
                            <div key={i} className="relative w-12 h-12 md:w-16 md:h-16 flex-shrink-0">
                                <div className={`absolute inset-0 rounded-full border-2 border-dashed transition-all duration-500 flex items-center justify-center ${box[i] ? 'border-transparent bg-gray-100 scale-100' : 'border-gray-300 scale-90'}`}>
                                    {!box[i] && <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
                                </div>
                                
                                <AnimatePresence>
                                    {box[i] && (
                                        <motion.div
                                            initial={{ scale: 0, y: 50 }}
                                            animate={{ scale: 1, y: 0 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                            className="absolute inset-0 rounded-full overflow-hidden shadow-md bg-white group cursor-pointer"
                                            onClick={(e) => { e.stopPropagation(); handleRemoveFromBox(i); }}
                                        >
                                            <Image src={box[i].image_url || '/logo_v5.png'} alt="item" fill className="object-cover p-1" />
                                            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <X className="w-5 h-5 text-red-500" />
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
                        className={`flex items-center justify-center gap-3 px-8 py-4 rounded-full font-bold text-sm md:text-base tracking-wide uppercase transition-all duration-500 w-full md:w-auto flex-shrink-0 ${box.length === BOX_SIZE ? 'bg-black text-white shadow-xl hover:scale-105' : box.length > 0 ? 'bg-gray-900 text-white hover:bg-black' : 'bg-transparent text-gray-400 border border-gray-200 cursor-not-allowed'}`}
                    >
                        <span>{box.length === 0 ? 'בחר בשמים' : box.length === BOX_SIZE ? 'המשך לקופה' : `הוסף עוד ${BOX_SIZE - box.length}`}</span>
                        {box.length === BOX_SIZE ? <Check className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
