"use client";

import { useState } from 'react';
import { useCart } from '../context/CartContext';
import TagInput from '../components/TagInput'; // We might need to adjust TagInput to be a selector, or use a custom one. 
// Actually TagInput is designed for creating new tags. For selection from list, we might want a slightly different UI 
// but TagInput with suggestions works too. Let's build a simple multi-select for now or reuse TagInput if it supports "suggestions only".
// For now, I'll build a custom simple selector for notes.

export default function SmartMatchingClient({ initialNotes }) {
    const { addMultipleToCart } = useCart();
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

    // Initial Budget Ranges per size (defaults, will be dynamic logic later?)
    // Actually user asked for a slider.
    // We should give reasonable bounds based on size * quantity.
    // e.g. 5 perfumes of 10ml (~100 nis each) = 500.
    // 5 perfumes of 2ml (~20 nis each) = 100.

    const getBudgetRange = () => {
        const basePrice = preferences.size === '2' ? 30 : preferences.size === '5' ? 60 : 100; // Approx prices
        const min = basePrice * preferences.quantity * 0.8;
        const max = basePrice * preferences.quantity * 1.5;
        return { min: Math.floor(min), max: Math.ceil(max) };
    };

    const handleMatch = async () => {
        setLoading(true);
        setStep(2); // Loading view

        try {
            const res = await fetch('/api/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(preferences)
            });
            const data = await res.json();

            // Artificial delay for "Thinking" effect
            setTimeout(() => {
                setResults(data);
                setStep(3);
                setLoading(false);
            }, 2000);

        } catch (e) {
            console.error(e);
            setLoading(false);
            setStep(1); // Go back on error
            alert("שגיאה בחישוב המארז. אנא נסה שוב.");
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

        alert(`נוספו ${itemsToAdd.length} מוצרים לסל בהצלחה!`);
    };

    const resetWizard = () => {
        setResults(null);
        setStep(1);
    };

    return (
        <div className="min-h-[600px] flex flex-col">

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 h-2 rtl">
                <div
                    className="bg-black h-2 transition-all duration-500"
                    style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
                ></div>
            </div>

            <div className="p-8 md:p-12 flex-1 flex flex-col justify-center">

                {/* STEP 1: PREFERENCES */}
                {step === 1 && (
                    <div className="space-y-12 animate-fadeIn">

                        {/* 1. Bundle Size & Sample Size */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-4">
                                <label className="block text-xl font-bold">כמה בשמים במארז?</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="3"
                                        max="12"
                                        value={preferences.quantity}
                                        onChange={(e) => setPreferences({ ...preferences, quantity: parseInt(e.target.value) })}
                                        className="w-fullaccent-black h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <span className="text-2xl font-bold w-12 text-center">{preferences.quantity}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-xl font-bold">גודל בקבוק (מ"ל)</label>
                                <div className="flex gap-4">
                                    {[2, 5, 10].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setPreferences({ ...preferences, size: s.toString() })}
                                            className={`flex-1 py-4 rounded-xl border-2 font-bold text-lg transition-all ${preferences.size === s.toString()
                                                ? 'border-black bg-black text-white'
                                                : 'border-gray-200 text-gray-400 hover:border-gray-300'
                                                }`}
                                        >
                                            {s} מ"ל
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 2. Budget */}
                        <div className="space-y-4">
                            <label className="block text-xl font-bold flex justify-between">
                                <span>תקציב משוער</span>
                                <span className="text-primary-600 font-mono">{preferences.budget} ₪</span>
                            </label>
                            <input
                                type="range"
                                min={getBudgetRange().min / 2} // Allow lower
                                max={getBudgetRange().max * 1.5} // Allow higher
                                value={preferences.budget}
                                onChange={(e) => setPreferences({ ...preferences, budget: parseInt(e.target.value) })}
                                className="w-full accent-black h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>חסכוני</span>
                                <span>פרימיום</span>
                            </div>
                        </div>

                        {/* 3. Notes (Autocomplete) */}
                        <div className="space-y-4">
                            <label className="block text-xl font-bold">תווים אהובים</label>
                            <p className="text-sm text-gray-500">הקלד את שם התו ובחר מהרשימה (לדוגמה: "ורד", "אוד", "יסמין")</p>
                            
                            <div className="relative">
                                <input
                                    type="text"
                                    value={noteInput}
                                    onChange={handleNoteInputChange}
                                    placeholder="הקלד תו לחיפוש..."
                                    className="w-full p-4 border rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent transition text-lg"
                                />
                                {/* Suggestions Dropdown */}
                                {suggestions.length > 0 && (
                                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl mt-2 shadow-xl max-h-60 overflow-y-auto divide-y">
                                        {suggestions.map((note) => (
                                            <button
                                                key={note}
                                                onClick={() => addNote(note)}
                                                className="w-full text-right px-6 py-3 hover:bg-gray-50 transition flex justify-between items-center group"
                                            >
                                                <span className="font-bold text-gray-800">{note}</span>
                                                <span className="text-gray-400 group-hover:text-black text-sm">הוסף +</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Selected Notes Chips */}
                            <div className="flex flex-wrap gap-2 min-h-[50px] p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                {preferences.notes.length === 0 && (
                                    <span className="text-gray-400 text-sm">עדיין לא נבחרו תווים...</span>
                                )}
                                {preferences.notes.map(note => (
                                    <div
                                        key={note}
                                        className="px-4 py-2 bg-black text-white rounded-full text-sm font-bold flex items-center gap-2 animate-fadeIn"
                                    >
                                        {note}
                                        <button
                                            onClick={() => removeNote(note)}
                                            className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action */}
                        <div className="pt-8 text-center">
                            <button
                                onClick={handleMatch}
                                className="bg-black text-white text-lg md:text-xl py-4 px-8 md:px-12 rounded-full font-bold hover:scale-105 transition-transform shadow-xl whitespace-nowrap"
                            >
                                בצע התאמת מארז חכמה ✨
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: LOADING */}
                {step === 2 && (
                    <div className="flex flex-col items-center justify-center space-y-8 animate-fadeIn text-center">
                        <div className="w-20 h-20 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
                        <div>
                            <h3 className="text-2xl font-bold mb-2">מרכיב את המארז המושלם...</h3>
                            <p className="text-gray-500">בודק זמינות מלאי, מחשב מחירים, ומתאים תווים.</p>
                        </div>
                    </div>
                )}

                {/* STEP 3: RESULTS */}
                {step === 3 && results && (
                    <div className="animate-fadeIn space-y-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold mb-2">המארז שלך מוכן!</h2>
                            <p className="text-gray-600">סה"כ {results.products.length} בשמים בפרופיל הריח שלך</p>
                        </div>

                        {/* Results Grid - Needs to be scrollable if many */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[500px] overflow-y-auto pr-2">
                            {results.products.map((p, idx) => (
                                <div key={p.id} className="flex gap-4 p-4 border rounded-xl bg-white items-center">
                                    <div className="w-16 h-16 bg-white rounded-lg flex-shrink-0 flex items-center justify-center">
                                        {p.image_url ? <img src={p.image_url} className="w-full h-full object-contain" /> : '🧴'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-sm line-clamp-1">{p.name}</div>
                                        <div className="text-gray-500 text-xs">{p.brand}</div>
                                        <div className="font-bold mt-1">{p.price} ₪</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary & Actions */}
                        <div className="bg-gray-900 text-white p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="text-center md:text-right">
                                <div className="text-sm opacity-70">מחיר סופי למארז</div>
                                <div className="text-3xl font-bold text-green-400">{results.totalPrice} ₪</div>
                                <div className="text-xs text-red-300 mt-1">{results.message}</div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={resetWizard}
                                    className="px-6 py-3 rounded-full border border-white/20 hover:bg-white/10 transition"
                                >
                                    התאמה מחדש
                                </button>
                                <button
                                    onClick={addToCartAll}
                                    className="px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-gray-100 transition shadow-lg"
                                >
                                    הוסף הכל לסל
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
