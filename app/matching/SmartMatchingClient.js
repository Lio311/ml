"use client";

import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import TagInput from '../components/TagInput';
import toast from 'react-hot-toast';
import Image from 'next/image';

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

    const addToCartAll = () => {
        if (!results || !results.products) return;

        const itemsToAdd = results.products.map(p => ({
            product: p,
            size: parseInt(preferences.size),
            price: p.price
        }));

        addMultipleToCart(itemsToAdd);
        toast.success(t('matching.success_toast').replace('{count}', itemsToAdd.length));
    };

    const resetWizard = () => {
        setResults(null);
        setStep(1);
    };

    return (
        <div className="min-h-screen bg-black text-white relative flex flex-col items-center justify-start pt-4 md:pt-6 pb-12 px-4 overflow-hidden" dir={dir}>
            {/* Ambient Background Gradient */}
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.1)_0%,_transparent_70%)] pointer-events-none" />
            
            {/* Secondary Decorator */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-800/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-800/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="container max-w-4xl mx-auto relative z-10 px-4">
                <div className="mb-10 text-center overflow-visible">
                    <h1 className="text-4xl md:text-5xl font-serif font-black mb-3 text-white tracking-tighter animate-fadeIn">
                        {t('matching.title') || 'התאמה אישית'}
                    </h1>
                    <div className="flex flex-col items-center gap-4 overflow-visible">
                        <p className="text-zinc-500 text-xs md:text-sm animate-fadeIn delay-100 italic tracking-wide whitespace-normal opacity-60 border-x border-white/5 px-6 leading-relaxed max-w-2xl">
                            {t('matching.description')}
                        </p>
                        <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/20 animate-fadeIn delay-200">
                            {t('matching.how_it_works')}
                        </p>
                    </div>
                </div>
                {/* Progress Tracking */}
                <div className="mb-8 overflow-hidden">
                    <div className="flex justify-between items-end mb-2 px-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                            Step {step} of 3
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                            {step === 1 ? t('matching.preferences_title') || 'Personalize' : step === 2 ? t('matching.analyzing') || 'Analyzing' : t('matching.results_title') || 'Results'}
                        </span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                        <div
                            className="bg-white h-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                            style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
                        ></div>
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-3xl p-6 md:p-12 rounded-[2.5rem] border border-white/20 shadow-[0_40px_100px_rgba(0,0,0,0.5)] relative overflow-hidden group min-h-[500px] flex flex-col">
                    {/* Subtle Internal Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32 blur-[100px] pointer-events-none" />

                    {/* STEP 1: PREFERENCES */}
                    {step === 1 && (
                        <div className="space-y-10 animate-fadeIn flex-1">
                            {/* 1. Bundle Size & Sample Size */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <div className="space-y-4">
                                    <label className="block text-lg font-serif font-black tracking-tight">{t('matching.quantity_label')}</label>
                                    <div className="flex items-center gap-6 bg-black/40 p-6 rounded-2xl border border-white/5">
                                        <input
                                            type="range"
                                            min="3"
                                            max="12"
                                            value={preferences.quantity}
                                            onChange={(e) => setPreferences({ ...preferences, quantity: parseInt(e.target.value) })}
                                            className="w-full accent-white h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <span className="text-3xl font-black w-12 text-center text-white">{preferences.quantity}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-lg font-serif font-black tracking-tight">{t('matching.size_label')}</label>
                                    <div className="flex gap-3">
                                        {[2, 5, 10].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setPreferences({ ...preferences, size: s.toString() })}
                                                className={`flex-1 py-4 rounded-2xl border-2 font-black text-sm tracking-widest transition-all ${preferences.size === s.toString()
                                                    ? 'border-white bg-white text-black shadow-lg scale-[1.02]'
                                                    : 'border-white/10 bg-black/40 text-zinc-500 hover:border-white/30 hover:text-white'
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
                                <label className="block text-lg font-serif font-black tracking-tight flex justify-between">
                                    <span>{t('matching.budget_label')}</span>
                                    <span className="text-white font-black">{preferences.budget} ₪</span>
                                </label>
                                <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
                                    <input
                                        type="range"
                                        min={getBudgetRange().min / 2}
                                        max={getBudgetRange().max * 1.5}
                                        value={preferences.budget}
                                        onChange={(e) => setPreferences({ ...preferences, budget: parseInt(e.target.value) })}
                                        className="w-full accent-white h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 mt-4 px-1">
                                        <span>{t('matching.economy')}</span>
                                        <span>{t('matching.premium')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Notes (Autocomplete) */}
                            <div className="space-y-4">
                                <label className="block text-lg font-serif font-black tracking-tight">{t('matching.favorite_notes')}</label>
                                
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={noteInput}
                                        onChange={handleNoteInputChange}
                                        placeholder={t('matching.search_placeholder')}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-sm focus:outline-none focus:ring-1 focus:ring-white/30 transition-all placeholder:text-gray-700 shadow-inner"
                                    />
                                    {suggestions.length > 0 && (
                                        <div className="absolute z-20 w-full bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl mt-3 shadow-2xl max-h-60 overflow-y-auto divide-y divide-white/5">
                                            {suggestions.map((note) => (
                                                <button
                                                    key={note}
                                                    onClick={() => addNote(note)}
                                                    className={`w-full px-6 py-4 hover:bg-white/10 transition flex justify-between items-center group ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
                                                >
                                                    <span className="font-bold text-zinc-200 group-hover:text-white">{note}</span>
                                                    <span className="text-[10px] uppercase font-black tracking-widest text-zinc-600 group-hover:text-white/60">{t('matching.add_note')}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2 min-h-[60px] p-5 bg-black/20 rounded-2xl border border-dashed border-white/10">
                                    {preferences.notes.length === 0 && (
                                        <span className="text-zinc-600 text-xs font-medium italic p-2">{t('matching.no_notes_selected')}</span>
                                    )}
                                    {preferences.notes.map(note => (
                                        <div
                                            key={note}
                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-full text-xs font-black tracking-wide flex items-center gap-3 transition-colors animate-fadeIn"
                                        >
                                            {note}
                                            <button
                                                onClick={() => removeNote(note)}
                                                className="w-4 h-4 bg-white/10 rounded-full flex items-center justify-center hover:bg-red-500/50 transition-colors"
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
                                    className="w-full py-5 bg-white text-black font-black rounded-full hover:bg-gray-200 hover:scale-[1.01] transition-all active:scale-[0.98] text-xs uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
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
                                <div className="w-24 h-24 border-2 border-white/5 rounded-full"></div>
                                <div className="absolute inset-0 w-24 h-24 border-t-2 border-white rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl animate-pulse">✨</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-3xl font-serif font-black mb-3 tracking-tight">{t('matching.loading_title')}</h3>
                                <p className="text-zinc-500 text-sm max-w-xs mx-auto italic leading-relaxed opacity-70">
                                    {t('matching.loading_desc')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: RESULTS */}
                    {step === 3 && results && (
                        <div className="animate-fadeIn space-y-10 flex-1 flex flex-col">
                            <div className="text-center">
                                <h2 className="text-3xl md:text-4xl font-serif font-black mb-2 tracking-tight">{t('matching.ready_title')}</h2>
                                <p className="text-zinc-500 text-sm italic opacity-80 decoration-white/10">{t('matching.ready_desc').replace('{count}', results.products.length)}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {results.products.map((p, idx) => (
                                    <div 
                                        key={p.id} 
                                        className="flex gap-5 p-5 bg-white/5 border border-white/10 rounded-[1.5rem] items-center hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
                                        style={{ animationDelay: `${idx * 100}ms` }}
                                    >
                                        <div className="w-20 h-20 bg-white/5 rounded-2xl flex-shrink-0 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform">
                                            {p.image_url ? (
                                                <Image src={p.image_url} alt={localize(p, 'name') || "Product"} fill sizes="80px" className="object-contain p-2" />
                                            ) : (
                                                <span className="text-2xl">🧴</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-serif font-black text-white text-sm line-clamp-1 mb-0.5">{localize(p, 'name')}</div>
                                            <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-2 opacity-60">{p.brand}</div>
                                            <div className="text-lg font-black text-white">{p.price} ₪</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Summary & Actions */}
                            <div className="mt-auto bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-8 animate-fadeUp">
                                <div className={`${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-1">{t('matching.final_price')}</div>
                                    <div className="text-4xl font-black text-white drop-shadow-sm">{results.totalPrice} ₪</div>
                                    <div className="text-xs font-bold text-zinc-500 mt-2 italic">{results.message}</div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                    <button
                                        onClick={resetWizard}
                                        className="px-8 py-4 rounded-full border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all text-zinc-400 hover:text-white"
                                    >
                                        {t('matching.rematch')}
                                    </button>
                                    <button
                                        onClick={addToCartAll}
                                        className="px-10 py-4 rounded-full bg-white text-black font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-200 transition-all shadow-[0_15px_40px_rgba(255,255,255,0.1)] active:scale-95"
                                    >
                                        {t('matching.add_all')}
                                    </button>
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
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
