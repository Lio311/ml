"use client";

import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import Image from "@/app/components/CImage";
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Check, ShoppingCart, Info } from 'lucide-react';

const BUNDLE_TYPES = [
    { id: 'summer', bgImage: '/images/vibe/summer.png' },
    { id: 'winter', bgImage: '/images/vibe/winter.png' },
    { id: 'dates', bgImage: '/images/vibe/dates.png' },
    { id: 'collectors', bgImage: '/images/vibe/collectors.png' },
    { id: 'clean', bgImage: '/images/vibe/clean.jpg', isThemed: true },
    { id: 'tropical', bgImage: '/images/vibe/tropical.jpg', isThemed: true },
    { id: 'vanilla', bgImage: '/images/vibe/vanilla.jpg', isThemed: true },
    { id: 'gourmand', bgImage: '/images/vibe/gourmand.jpg', isThemed: true },
    { id: 'citrus', bgImage: '/images/vibe/citrus.jpg', isThemed: true }
];

const SIZES = [
    { id: '2', count: 10 },
    { id: '5', count: 7 },
    { id: '10', count: 5 }
];

export default function BundlesClient() {
    const { addBundleToCart } = useCart(); // I'll implement this next
    const { t, dir, localize } = useLanguage();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState(null);
    const [selectedSize, setSelectedSize] = useState('2');
    const [products, setProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const currentSizeData = SIZES.find(s => s.id === selectedSize);
    const requiredCount = currentSizeData?.count || 10;

    const currentBundle = BUNDLE_TYPES.find(b => b.id === selectedType);
    const isThemed2ml = currentBundle?.isThemed && selectedSize === '2';

    useEffect(() => {
        if (selectedType) {
            fetchProducts();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedType]);

    useEffect(() => {
        setSelectedProducts([]);
    }, [selectedSize]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/bundles/products?type=${selectedType}`);
            const data = await res.json();
            setProducts(data.products || []);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('שגיאה בטעינת הבשמים');
        } finally {
            setLoading(false);
        }
    };

    const toggleProduct = (product) => {
        const isSelected = selectedProducts.find(p => p.id === product.id);
        if (isSelected) {
            setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
        } else {
            if (selectedProducts.length >= requiredCount) {
                toast.error(t('bundles.must_select_exact', { count: requiredCount }));
                return;
            }
            setSelectedProducts([...selectedProducts, product]);
        }
    };

    const handleAddToCart = () => {
        if (selectedProducts.length !== requiredCount) {
            toast.error(t('bundles.must_select_exact', { count: requiredCount }));
            return;
        }

        const bundle = {
            id: `bundle-${selectedType}-${Date.now()}`,
            type: 'bundle',
            bundleType: selectedType,
            size: selectedSize,
            items: selectedProducts,
            name: t(`bundles.${selectedType}_bundle`),
            quantity: 1
        };

        if (addBundleToCart) {
            addBundleToCart(bundle);
            toast.success(t('bundles.bundle_added_toast'));
            router.push('/cart');
        } else {
            // Fallback if context not updated yet
            toast.error('סל הקניות עדיין לא מעודכן לתמיכה בחבילות');
        }
    };

    const handleThemed2mlAdd = () => {
        if (loading) return;
        if (products.length === 0) {
            toast.error('הבשמים נטענים, אנא המתן...');
            return;
        }
        
        // Ensure all 10 products are available in 2ml size
        const availableProducts = products.filter(p => {
            const stockVal = Number(p.stock) || 0;
            const sizePriceKey = `price_2ml`;
            const hasSize = p[sizePriceKey] !== null && Number(p[sizePriceKey]) > 0;
            return stockVal >= 2 && hasSize;
        });

        if (availableProducts.length < 10) {
            toast.error('אזל המלאי באופן זמני ויתחדש בקרוב');
            return;
        }

        const bundle = {
            id: `bundle-${selectedType}-${Date.now()}`,
            type: 'bundle',
            bundleType: selectedType,
            size: '2',
            items: availableProducts.slice(0, 10),
            name: t(`bundles.${selectedType}_bundle`),
            quantity: 1
        };

        if (addBundleToCart) {
            addBundleToCart(bundle);
            toast.success(t('bundles.bundle_added_toast'));
            router.push('/cart');
        } else {
            toast.error('סל הקניות עדיין לא מעודכן לתמיכה בחבילות');
        }
    };

    const filteredProducts = products.filter(p => {
        const name = `${p.brand} ${p.model} ${p.brand_he} ${p.model_he}`.toLowerCase();
        if (!name.includes(searchQuery.toLowerCase())) return false;
        
        const requiredStock = Number(selectedSize) || 2;
        const stockVal = Number(p.stock) || 0;
        
        // Ensure the product is sold in the requested size (has a price for it)
        const sizePriceKey = `price_${selectedSize}ml`;
        const hasSize = p[sizePriceKey] !== null && Number(p[sizePriceKey]) > 0;

        return stockVal >= requiredStock && hasSize;
    });

    return (
        <div className="min-h-screen bg-[#fafafa] pt-24 pb-20 px-4 md:px-8" dir={dir}>
            <div className="max-w-6xl mx-auto">
                
                {/* Header */}
                <div className="text-center mb-12">
                    <motion.h1 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-black text-zinc-900 mb-4 tracking-tight"
                    >
                        {t('bundles.title')}
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-zinc-500 text-sm md:text-base max-w-xl mx-auto italic"
                    >
                        {t('bundles.subtitle')}
                    </motion.p>
                </div>

                {/* Steps indicator */}
                <div className="flex justify-center mb-12">
                    <div className="flex items-center gap-4">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${
                                    step === s ? 'bg-zinc-900 text-white scale-110 shadow-lg' : 
                                    step > s ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-400'
                                }`}>
                                    {step > s ? <Check size={18} /> : s}
                                </div>
                                {s < 3 && <div className={`w-8 md:w-16 h-1 mx-2 rounded-full ${step > s ? 'bg-emerald-500' : 'bg-zinc-200'}`} />}
                            </div>
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {/* Step 1: Type Selection */}
                    {step === 1 && (
                        <motion.div 
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-6"
                        >
                            {BUNDLE_TYPES.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => {
                                        setSelectedType(type.id);
                                        setStep(2);
                                    }}
                                    className={`group relative p-10 md:p-14 rounded-[3rem] border-2 bg-white transition-all hover:shadow-2xl hover:-translate-y-2 overflow-hidden flex flex-col items-center text-center ${
                                        selectedType === type.id ? 'border-zinc-900 shadow-xl' : 'border-zinc-100'
                                    }`}
                                >
                                    {/* Background Image */}
                                    <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity">
                                        <Image 
                                            src={type.bgImage} 
                                            alt="" 
                                            fill 
                                            className="object-cover scale-110 group-hover:scale-100 transition-transform duration-1000"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-white/80" />
                                    </div>

                                    <div className="relative z-10 w-full flex flex-col items-center">
                                        <h3 className="text-3xl font-black text-zinc-900 mb-4 tracking-tight">{t(`bundles.${type.id}_bundle`)}</h3>
                                        <p className="text-zinc-600 text-sm md:text-base leading-relaxed mb-8 italic font-medium max-w-[240px]">
                                            {t(`bundles.${type.id}_desc`)}
                                        </p>
                                        <div className="flex items-center gap-2 text-zinc-900 font-black text-xs uppercase tracking-[0.2em] group-hover:gap-4 transition-all bg-white/60 backdrop-blur-sm px-6 py-3 rounded-full border border-black/5">
                                            {t('common.next')} <ChevronLeft size={16} />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </motion.div>
                    )}

                    {/* Step 2: Size Selection */}
                    {step === 2 && (
                        <motion.div 
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-3xl mx-auto"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                                {SIZES.map((size) => (
                                    <button
                                        key={size.id}
                                        onClick={() => setSelectedSize(size.id)}
                                        className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center ${
                                            selectedSize === size.id ? 'border-zinc-900 bg-white shadow-xl' : 'border-zinc-100 bg-zinc-50/50 hover:bg-white'
                                        }`}
                                    >
                                        <div className="text-4xl font-black text-zinc-900 mb-2">{size.id} {t('common.ml_unit')}</div>
                                        <div className="text-zinc-500 font-bold uppercase tracking-wider text-xs mb-4">{t('common.select_size')}</div>
                                        <div className="w-full h-px bg-zinc-200 mb-4" />
                                        <p className="text-zinc-900 font-bold text-center">
                                            {t(`bundles.ml_${size.id}_desc`)}
                                        </p>
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0 bg-zinc-900 text-white p-6 md:p-8 rounded-[2rem] shadow-xl mt-8">
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                                        <Info size={20} className="text-white/60" />
                                    </div>
                                    <div className="text-start">
                                        <div className="font-bold text-white/50 text-[10px] uppercase tracking-widest mb-0.5">{t('bundles.step_2_size')}</div>
                                        <div className="text-base md:text-lg font-black">{t(`bundles.${selectedType}_bundle`)} - {selectedSize} {t('common.ml_unit')}</div>
                                    </div>
                                </div>
                                <div className="flex gap-4 w-full md:w-auto">
                                    <button onClick={() => setStep(1)} className="flex-1 md:flex-none px-6 py-3 rounded-full border border-white/20 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all text-center">
                                        {t('common.previous')}
                                    </button>
                                    {isThemed2ml ? (
                                        <button onClick={handleThemed2mlAdd} disabled={loading} className="flex-1 md:flex-none px-10 py-3 rounded-full bg-emerald-500 text-white text-xs font-black uppercase tracking-widest hover:scale-105 transition-all text-center flex items-center justify-center gap-2">
                                            {loading ? 'טוען...' : 'הוסף לעגלה'} <ShoppingCart size={16} />
                                        </button>
                                    ) : (
                                        <button onClick={() => setStep(3)} className="flex-1 md:flex-none px-10 py-3 rounded-full bg-white text-zinc-900 text-xs font-black uppercase tracking-widest hover:scale-105 transition-all text-center">
                                            {t('common.next')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Picker */}
                    {step === 3 && (
                        <motion.div 
                            key="step3"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-8"
                        >
                            {/* Toolbar */}
                            <div className="sticky top-24 z-20 flex flex-col md:flex-row gap-6 bg-white/80 backdrop-blur-xl p-5 md:p-6 rounded-[2rem] border border-zinc-200 shadow-xl items-center justify-between">
                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="px-5 py-3 bg-zinc-900 text-white rounded-2xl flex flex-col items-center min-w-[90px] md:min-w-[100px]">
                                        <span className="text-[10px] uppercase font-black tracking-widest opacity-50">{t('common.quantity')}</span>
                                        <span className="text-lg md:text-xl font-black" dir="ltr">{selectedProducts.length} / {requiredCount}</span>
                                    </div>
                                    <div className="text-start">
                                        <h3 className="font-black text-zinc-900 text-sm md:text-base">{t(`bundles.${selectedType}_bundle`)}</h3>
                                        <p className="text-[10px] md:text-xs text-zinc-500 italic">{selectedSize} {t('common.ml_unit')} • {t('bundles.discount_label')}</p>
                                    </div>
                                </div>
                                <div className="flex-1 w-full md:max-w-md relative">
                                    <input 
                                        type="text" 
                                        placeholder={t('common.search_perfume_placeholder')}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900/30 transition-all"
                                    />
                                </div>
                                <div className="flex gap-3 w-full md:w-auto">
                                    <button onClick={() => setStep(2)} className="flex-1 md:flex-none px-5 py-4 rounded-2xl border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-all flex justify-center items-center">
                                        <ChevronRight size={20} />
                                    </button>
                                    <button 
                                        onClick={handleAddToCart}
                                        disabled={selectedProducts.length !== requiredCount}
                                        className={`flex-[3] md:flex-none px-8 py-4 rounded-2xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest transition-all ${
                                            selectedProducts.length === requiredCount 
                                            ? 'bg-zinc-900 text-white shadow-lg hover:scale-105 active:scale-95' 
                                            : 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
                                        }`}
                                    >
                                        <span className="whitespace-nowrap">{t('bundles.complete_bundle')}</span>
                                        <ShoppingCart size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Products Grid */}
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 grayscale">
                                    <div className="w-12 h-12 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mb-4" />
                                    <p className="text-zinc-400 font-bold italic tracking-widest">{t('common.loading_orders')}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {filteredProducts.map((p) => {
                                        const isSelected = selectedProducts.find(sp => sp.id === p.id);
                                        return (
                                            <button
                                                key={p.id}
                                                onClick={() => toggleProduct(p)}
                                                className={`relative group bg-white rounded-3xl border-2 transition-all p-4 text-center ${
                                                    isSelected ? 'border-zinc-900 shadow-xl -translate-y-1' : 'border-zinc-100 hover:border-zinc-200'
                                                }`}
                                            >
                                                <div className="aspect-square relative flex items-center justify-center p-2 mb-4">
                                                    {p.image_url ? (
                                                        <Image src={p.image_url} alt={p.name} fill size="200px" className="object-contain" />
                                                    ) : (
                                                        <span className="text-4xl grayscale opacity-30">🧴</span>
                                                    )}
                                                    {isSelected && (
                                                        <div className="absolute top-0 right-0 w-8 h-8 bg-zinc-900 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                                            <Check size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-500 transition-colors">{p.brand}</div>
                                                    <div className="text-xs font-bold text-zinc-900 line-clamp-1">{p.model}</div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {filteredProducts.length === 0 && !loading && (
                                <div className="text-center py-20 border-2 border-dashed border-zinc-100 rounded-[3rem]">
                                    <div className="text-4xl mb-4 grayscale opacity-30">🕵️</div>
                                    <h3 className="text-xl font-black text-zinc-900 mb-2">{t('common.no_products_found')}</h3>
                                    <p className="text-zinc-400 text-sm italic">{t('common.not_found_desc')}</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style jsx global>{`
                ::selection {
                    background: #18181b;
                    color: white;
                }
            `}</style>
        </div>
    );
}
