"use client";

import { useState, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import TagInput from '../components/TagInput';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';


export default function SmartMatchingClient({ initialNotes }) {
    const { addMultipleToCart } = useCart();
    const { t, dir, localize } = useLanguage();
    const [step, setStep] = useState(1);
    const [preferences, setPreferences] = useState({
        quantity: 5,
        size: '5', // 2, 5, 10
        budget: 200,
        notes: []
    });
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [noteInput, setNoteInput] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isAddedToCart, setIsAddedToCart] = useState(false);
    const [flyingItems, setFlyingItems] = useState([]);
    const [animatingProductIds, setAnimatingProductIds] = useState(new Set());
    const productRefs = useRef({});


    const handleNoteInputChange = (e) => {
        const val = e.target.value;
        setNoteInput(val);
        if (val.trim().length > 0) {
            const filtered = initialNotes.filter(n =>
                n.toLowerCase().includes(val.toLowerCase()) &&
                !preferences.notes.includes(n)
            );
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
    };

    const addNote = (note) => {
        if (!preferences.notes.includes(note)) {
            setPreferences({ ...preferences, notes: [...preferences.notes, note] });
        }
        setNoteInput('');
        setSuggestions([]);
    };

    const removeNote = (note) => {
        setPreferences({ ...preferences, notes: preferences.notes.filter(n => n !== note) });
    };

    const getBudgetRange = () => {
        const basePrice = preferences.size === '2' ? 30 : preferences.size === '5' ? 60 : 100;
        const min = basePrice * preferences.quantity * 0.8;
        const max = basePrice * preferences.quantity * 1.5;
        return { min: Math.floor(min), max: Math.ceil(max) };
    };

    const handleMatch = async () => {
        setLoading(true);
        setStep(2);

        try {
            const res = await fetch('/api/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(preferences)
            });
            const data = await res.json();

            setTimeout(() => {
                setResults(data);
                setStep(3);
                setLoading(false);
            }, 2000);

        } catch (e) {
            console.error(e);
            setLoading(false);
            setStep(1);
            toast.error(t('matching.error_toast'));
        }
    };

    const addToCartAll = async () => {
        if (!results) return;

        const newAnimatingIds = new Set(animatingProductIds);
        const newFlyingItems = [];
        const cartIcon = document.getElementById('cart-icon-main');
        const isRtl = dir === 'rtl';
        const cartRect = cartIcon?.getBoundingClientRect() || { 
            left: isRtl ? 40 : window.innerWidth - 100, 
            top: 40 
        };

        results.products.forEach((p, index) => {
            const el = productRefs.current[p.id];
            if (!el) return;

            const rect = el.getBoundingClientRect();
            newAnimatingIds.add(p.id);

            newFlyingItems.push({
                id: `${p.id}-${Date.now()}`,
                productId: p.id,
                name: localize(p, 'name'),
                brand: p.brand,
                image: p.image_url,
                start: { x: rect.left, y: rect.top },
                end: { x: cartRect.left, y: cartRect.top },
                dimensions: { width: rect.width, height: rect.height },
                delay: index * 0.15, // Staggered entry
                rotation: dir === 'rtl' ? -15 : 15 // Slight rotation for physics feel
            });
        });

        setAnimatingProductIds(newAnimatingIds);
        setFlyingItems(newFlyingItems);

        // Actual API call logic
        try {
            const itemsToBatch = results.products.map(p => ({
                product: p,
                size: p.volume || '10ml',
                price: p.price,
                quantity: 1
            }));
            
            await addMultipleToCart(itemsToBatch, { successKey: 'matching.all_added_toast' });
            setIsAddedToCart(true);
        } catch (error) {
            console.error("Failed to add all items to cart:", error);
        }

        // 3. Clear flying items after animation
        setTimeout(() => {
            setFlyingItems([]);
        }, 2000 + (newFlyingItems.length * 100));
    };

    const resetWizard = () => {
        setResults(null);
        setIsAddedToCart(false);
        setStep(1);
        setAnimatingProductIds(new Set());
    };

    return (
        <div className="min-h-screen bg-[#fafafa] text-zinc-900 relative flex flex-col items-center justify-start pt-4 md:pt-6 pb-12 px-4 overflow-hidden" dir={dir}>
            {/* Ambient Background Gradient (Subtle for Light Theme) */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.03)_0%,_transparent_70%)] pointer-events-none" />
            
            {/* Secondary Decorator */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-200/50 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-200/50 rounded-full blur-[120px] pointer-events-none" />

            <div className="container max-w-sm mx-auto relative z-10 px-4">
                <div className="mb-6 text-center overflow-visible">
                    <h1 className="text-4xl md:text-5xl font-bold mb-3 text-zinc-900 tracking-tight animate-fadeIn">
                        {t('matching.title') || 'התאמה אישית'}
                    </h1>
                    <div className="flex flex-col items-center gap-1 overflow-visible">
                        <p className="text-zinc-500 text-[10px] md:text-xs animate-fadeIn delay-100 italic tracking-wide whitespace-normal opacity-70 px-2 leading-relaxed">
                            {t('matching.description')}
                        </p>
                        {/* Algorithm Info Block */}
                        <div className="mt-1 p-4 md:p-5 bg-white/70 backdrop-blur-xl rounded-2xl border border-zinc-200 animate-fadeIn delay-200 shadow-sm w-full">
                            <p className="text-[9px] md:text-[10px] text-zinc-500 leading-relaxed text-center italic opacity-90">
                                {t('matching.how_it_works')}
                            </p>
                        </div>
                    </div>
                </div>
                {/* Progress Tracking */}
                <div className="mb-8 overflow-hidden">
                    <div className="flex justify-between items-end mb-2 px-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                            {step === 1 ? t('matching.preferences_title') : step === 2 ? t('matching.analyzing') : t('matching.results_title')}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
                            {t('matching.step_info', { step })}
                        </span>
                    </div>
                    <div className="w-full bg-zinc-200 h-1 rounded-full overflow-hidden">
                        <div
                            className="bg-zinc-900 h-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                            style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
                        ></div>
                    </div>
                </div>

                <div className="bg-white/70 backdrop-blur-3xl p-6 md:p-12 rounded-[2.5rem] border border-zinc-200 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.12),0_30px_60px_-15px_rgba(0,0,0,0.08)] relative overflow-hidden group min-h-[500px] flex flex-col">
                    {/* Subtle Internal Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-50/50 rounded-full -translate-y-32 translate-x-32 blur-[100px] pointer-events-none" />

                    {/* STEP 1: PREFERENCES */}
                    {step === 1 && (
                        <div className="space-y-10 animate-fadeIn flex-1">
                            {/* 1. Bundle Size & Sample Size */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <div className="space-y-4">
                                    <label className="block text-lg font-serif font-black tracking-tight text-zinc-900">{t('matching.quantity_label')}</label>
                                    <div className="flex items-center gap-6 bg-zinc-50/50 p-6 rounded-2xl border border-zinc-100 shadow-inner">
                                        <input
                                            type="range"
                                            min="3"
                                            max="12"
                                            value={preferences.quantity}
                                            onChange={(e) => setPreferences({ ...preferences, quantity: parseInt(e.target.value) })}
                                            className="w-full accent-zinc-900 h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span className="text-3xl font-black w-12 text-center text-zinc-900">{preferences.quantity}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-lg font-serif font-black tracking-tight text-zinc-900">{t('matching.size_label')}</label>
                                    <div className="flex gap-3">
                                        {[2, 5, 10].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setPreferences({ ...preferences, size: s.toString() })}
                                                className={`flex-1 py-4 rounded-2xl border-2 font-black text-sm tracking-widest transition-all ${preferences.size === s.toString()
                                                    ? 'border-zinc-900 bg-zinc-900 text-white shadow-lg scale-[1.02]'
                                                    : 'border-zinc-200 bg-white/50 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                                                    }`}
                                            >
                                                {s} {t('common.ml_unit')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 2. Budget */}
                            <div className="space-y-4">
                                <label className="block text-lg font-serif font-black tracking-tight flex justify-between text-zinc-900">
                                    <span>{t('matching.budget_label')}</span>
                                    <span className="text-zinc-900 font-black">{preferences.budget} ₪</span>
                                </label>
                                <div className="bg-zinc-50/50 p-6 rounded-2xl border border-zinc-100 shadow-inner">
                                    <input
                                        type="range"
                                        min={getBudgetRange().min / 2}
                                        max={getBudgetRange().max * 1.5}
                                        value={preferences.budget}
                                        onChange={(e) => setPreferences({ ...preferences, budget: parseInt(e.target.value) })}
                                        className="w-full accent-zinc-900 h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400 mt-4 px-1">
                                        <span>{t('matching.economy')}</span>
                                        <span>{t('matching.premium')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Notes (Autocomplete) */}
                            <div className="space-y-4">
                                <label className="block text-lg font-serif font-black tracking-tight text-zinc-900">{t('matching.favorite_notes')}</label>
                                
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={noteInput}
                                        onChange={handleNoteInputChange}
                                        placeholder={t('matching.search_placeholder')}
                                        className="w-full bg-white/50 border border-zinc-200 rounded-2xl px-6 py-5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900/30 transition-all placeholder:text-zinc-400 shadow-sm"
                                    />
                                    {suggestions.length > 0 && (
                                        <div className="absolute z-20 w-full bg-white/95 backdrop-blur-xl border border-zinc-200 rounded-2xl mt-3 shadow-2xl max-h-60 overflow-y-auto divide-y divide-zinc-100">
                                            {suggestions.map((note) => (
                                                <button
                                                    key={note}
                                                    onClick={() => addNote(note)}
                                                    className={`w-full px-6 py-4 hover:bg-zinc-50 transition flex justify-between items-center group ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
                                                >
                                                    <span className="font-bold text-zinc-700 group-hover:text-zinc-900">{note}</span>
                                                    <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 group-hover:text-zinc-600">{t('matching.add_note')}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2 min-h-[60px] p-5 bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-200 shadow-inner">
                                    {preferences.notes.length === 0 && (
                                        <span className="text-zinc-400 text-xs font-medium italic p-2">{t('matching.no_notes_selected')}</span>
                                    )}
                                    {preferences.notes.map(note => (
                                        <div
                                            key={note}
                                            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-900 rounded-full text-xs font-black tracking-wide flex items-center gap-3 transition-colors animate-fadeIn"
                                        >
                                            {note}
                                            <button
                                                onClick={() => removeNote(note)}
                                                className="w-4 h-4 bg-zinc-200/50 rounded-full flex items-center justify-center hover:bg-red-500/50 hover:text-white transition-colors"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action */}
                            <div className="pt-6">
                                <button
                                    onClick={handleMatch}
                                    className="w-full py-5 bg-zinc-900 text-white font-black rounded-full hover:bg-black hover:scale-[1.01] transition-all active:scale-[0.98] text-xs uppercase tracking-[0.4em] shadow-xl"
                                >
                                    {t('matching.submit_btn')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: LOADING */}
                    {step === 2 && (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-fadeIn text-center">
                            <div className="relative">
                                <div className="w-24 h-24 border-2 border-zinc-100 rounded-full"></div>
                                <div className="absolute inset-0 w-24 h-24 border-t-2 border-zinc-900 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl animate-pulse">✨</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-3xl font-serif font-black mb-3 tracking-tight text-zinc-900">{t('matching.loading_title')}</h3>
                                <p className="text-zinc-500 text-sm max-w-xs mx-auto italic leading-relaxed opacity-80">
                                    {t('matching.loading_desc')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: RESULTS */}
                    {step === 3 && results && (
                        <div className="animate-fadeIn space-y-10 flex-1 flex flex-col">
                            <div className="text-center">
                                <h2 className="text-3xl md:text-4xl font-serif font-black mb-2 tracking-tight text-zinc-900">{t('matching.ready_title')}</h2>
                                <p className="text-zinc-500 text-sm italic opacity-90">{t('matching.ready_desc').replace('{count}', results.products.length)}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {results.products.map((p, idx) => (
                                    <div 
                                        key={p.id} 
                                        ref={el => productRefs.current[p.id] = el}
                                        className={`flex gap-5 p-5 bg-white/50 border border-zinc-100 rounded-[1.5rem] items-center hover:bg-white hover:border-zinc-200 hover:shadow-md transition-all duration-300 group`}
                                        style={{ 
                                            animationDelay: `${idx * 100}ms`
                                        }}
                                    >
                                        <div className="w-20 h-20 bg-zinc-50 rounded-2xl flex-shrink-0 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform">
                                            {p.image_url ? (
                                                <Image src={p.image_url} alt={localize(p, 'name') || "Product"} fill sizes="80px" className="object-contain p-2" />
                                            ) : (
                                                <span className="text-2xl">🧴</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-serif font-black text-zinc-900 text-sm line-clamp-1 mb-0.5">{localize(p, 'name')}</div>
                                            <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-2 opacity-70">{p.brand}</div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-lg font-black text-zinc-900">{p.price} ₪</div>
                                                {isAddedToCart && (
                                                    <span className="text-xs font-bold text-emerald-500 animate-fadeIn flex items-center gap-1">
                                                        <span className="text-sm">✓</span>
                                                        {t('common.added_to_cart_btn')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Summary & Actions */}
                            <div className="mt-auto bg-zinc-50/80 backdrop-blur-xl border border-zinc-200 p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-8 animate-fadeUp shadow-sm">
                                <div className={`${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-1">{t('matching.final_price')}</div>
                                    <div className="text-4xl font-black text-zinc-900 drop-shadow-sm">{results.totalPrice} ₪</div>
                                    <div className="text-xs font-bold text-zinc-500 mt-2 italic">{results.message}</div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                    <button
                                        onClick={resetWizard}
                                        className="px-8 py-4 rounded-full border border-zinc-200 text-xs font-black uppercase tracking-widest hover:bg-white transition-all text-zinc-500 hover:text-zinc-900"
                                    >
                                        {t('matching.rematch')}
                                    </button>
                                    {isAddedToCart ? (
                                        <Link
                                            href="/cart"
                                            className="px-10 py-4 rounded-full bg-emerald-500 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl active:scale-95 flex items-center gap-2 animate-bounceSuccess whitespace-nowrap"
                                        >
                                            <span className="text-sm">✓</span>
                                            {t('matching.view_cart')}
                                        </Link>
                                    ) : (
                                        <button
                                            onClick={addToCartAll}
                                            className="px-10 py-4 rounded-full bg-zinc-900 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl active:scale-95"
                                        >
                                            {t('matching.add_all')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.03);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 0, 0, 0.2);
                }
                @keyframes bounceSuccess {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                .animate-bounceSuccess {
                    animation: bounceSuccess 0.5s ease-out;
                }
            `}</style>

            {/* Fly-to-cart Animation Overlay */}
            <div className="fixed inset-0 pointer-events-none z-[9999]" dir="ltr">
                <AnimatePresence>
                    {flyingItems.map(item => (
                        <motion.div
                            key={item.id}
                            initial={{ 
                                x: item.start.x, 
                                y: item.start.y, 
                                width: item.dimensions.width,
                                height: item.dimensions.height,
                                scale: 1, 
                                opacity: 1,
                                rotate: 0 
                            }}
                            animate={{ 
                                x: item.end.x,
                                // Smooth hover arc
                                y: [item.start.y, item.start.y - 150, item.end.y],
                                scale: [1, 0.8, 0.05], 
                                opacity: [1, 1, 0],
                                rotate: item.rotation
                            }}
                            transition={{ 
                                duration: 1.1, 
                                delay: item.delay,
                                ease: "easeInOut",
                                onComplete: () => {
                                    const cartIcon = document.getElementById('cart-icon-main');
                                    if (cartIcon) {
                                        cartIcon.classList.remove('animate-cart-pop');
                                        void cartIcon.offsetWidth; 
                                        cartIcon.classList.add('animate-cart-pop');
                                    }
                                }
                            }}
                            className="absolute bg-white/90 backdrop-blur-md rounded-[1.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.2)] p-5 border border-zinc-200/50 flex items-center gap-5 overflow-hidden origin-top-left"
                            style={{ zIndex: 10000, left: 0, top: 0 }}
                        >
                            <div className="w-16 h-16 bg-zinc-50 rounded-xl flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                                {item.image ? (
                                    <img src={item.image} alt="" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <span className="text-2xl">🧴</span>
                                )}
                            </div>
                            <div className="flex-1 opacity-80">
                                <div className="font-serif font-black text-zinc-900 text-xs line-clamp-1">{item.name}</div>
                                <div className="text-zinc-500 text-[8px] uppercase font-bold tracking-widest">{item.brand}</div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
