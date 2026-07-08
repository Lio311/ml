"use client";

import { useState, useRef, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { ShoppingCart, Loader2, SendHorizontal, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { marked } from 'marked';

export default function SmartMatchingClient({ initialNotes = [], isEmbedded = false, onClose }) {
    const { addMultipleToCart } = useCart();
    const { t, dir, localize } = useLanguage();
    const isHebrew = dir === 'rtl';

    // Chat state
    const [messages, setMessages] = useState([]);
    const [chatStep, setChatStep] = useState('quantity'); // quantity -> size -> budget -> budget_custom -> notes -> loading -> results
    const [preferences, setPreferences] = useState({
        quantity: null,
        size: null,
        budget: null,
        notes: []
    });
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState(null);
    const messagesEndRef = useRef(null);

    // Notes lookup
    const [notesList, setNotesList] = useState(initialNotes);
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        if (notesList.length === 0) {
            fetch('/api/fragrance-notes')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setNotesList(data);
                })
                .catch(console.error);
        }
    }, [notesList]);

    // Initial greeting
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                role: 'assistant',
                content: isHebrew ? 'שלום! אשמח להרכיב עבורך מארז התאמה אישית.\n\n**כמה בשמים תרצה במארז?**' : 'Hello! I would love to build a custom set for you.\n\n**How many perfumes would you like in the set?**',
                type: 'quantity_options'
            }]);
        }
    }, [messages, isHebrew]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, suggestions, chatStep]);

    const handleQuickReply = (type, value, displayLabel) => {
        // Add user message
        const userMsg = { role: 'user', content: displayLabel };
        setMessages(prev => [...prev, userMsg]);

        // Update preferences
        const newPrefs = { ...preferences, [type]: value };
        setPreferences(newPrefs);

        // Determine next bot question
        setTimeout(() => advanceFlow(type, newPrefs), 500);
    };

    const handleOtherBudget = () => {
        setChatStep('budget_custom');
    };

    const advanceFlow = async (completedStep, currentPrefs) => {
        let nextMsg = null;
        if (completedStep === 'quantity') {
            setChatStep('size');
            nextMsg = {
                role: 'assistant',
                content: isHebrew ? 'מעולה! **באיזה גודל תרצה את הבשמים?**' : 'Great! **What size would you like the perfumes to be?**',
                type: 'size_options'
            };
        } else if (completedStep === 'size') {
            setChatStep('budget');
            const basePrice = currentPrefs.size === '2' ? 30 : currentPrefs.size === '5' ? 60 : 100;
            const minBudget = Math.floor(basePrice * currentPrefs.quantity * 0.8);
            nextMsg = {
                role: 'assistant',
                content: isHebrew ? `הבנתי. **מה התקציב שלך למארז?** (₪)\n\n*(הערכה מומלצת בהתבסס על הגודל והכמות: כ-${minBudget}₪ ומעלה)*` : `Got it. **What is your budget for the set?** (₪)\n\n*(Recommended based on size and quantity: roughly ${minBudget}₪ and up)*`,
                type: 'budget_options',
                minBudget: minBudget
            };
        } else if (completedStep === 'budget' || completedStep === 'budget_custom') {
            setChatStep('notes');
            nextMsg = {
                role: 'assistant',
                content: isHebrew ? 'מצוין. אחרון חביב - **האם יש תווים או ניחוחות שאתה אוהב במיוחד?** (למשל: וניל, עץ, הדרים).\n\nאפשר גם ללחוץ על דלג.' : 'Excellent. Last but not least - **do you have any specific notes or scents you love?** (e.g. vanilla, woody, citrus).\n\nOr just click skip.',
                type: 'notes_input'
            };
        } else if (completedStep === 'notes') {
            setChatStep('loading');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: isHebrew ? 'מחפש את ההתאמות המושלמות עבורך...' : 'Finding the perfect matches for you...',
                type: 'text'
            }]);
            setIsLoading(true);
            await fetchResults(currentPrefs);
            return;
        }

        if (nextMsg) {
            setMessages(prev => [...prev, nextMsg]);
        }
    };

    const fetchResults = async (prefs) => {
        try {
            const res = await fetch('/api/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prefs)
            });
            const data = await res.json();
            
            setTimeout(() => {
                setIsLoading(false);
                setResults(data);
                setChatStep('results');
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: isHebrew ? 'מצאתי! הנה ההתאמה המושלמת לפי ההעדפות שלך:' : 'Found them! Here is the perfect match based on your preferences:',
                    type: 'results_display'
                }]);
            }, 1500);

        } catch (e) {
            console.error(e);
            setIsLoading(false);
            toast.error(t('matching.error_toast'));
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: isHebrew ? 'אופס, משהו השתבש. אנא נסה שוב.' : 'Oops, something went wrong. Please try again.',
                type: 'text'
            }]);
            setChatStep('notes'); // fallback to last step
        }
    };

    const handleInputSubmit = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        if (chatStep === 'budget_custom') {
            const val = parseInt(inputText.replace(/\D/g, ''));
            const basePrice = preferences.size === '2' ? 30 : preferences.size === '5' ? 60 : 100;
            const absoluteMin = Math.floor(basePrice * preferences.quantity * 0.7); // Let's allow slightly less than the 0.8 recommended, but not zero.

            if (!val || val < absoluteMin) {
                setMessages(prev => [...prev, { role: 'user', content: `₪${val || 0}` }, {
                    role: 'assistant',
                    content: isHebrew ? `מצטער, אבל התקציב נמוך מדי עבור מארז של ${preferences.quantity} בשמים בגודל ${preferences.size}ml. התקציב המינימלי הוא כ-₪${absoluteMin}. אנא הזן סכום גבוה יותר.` : `Sorry, but the budget is too low for a set of ${preferences.quantity} perfumes in ${preferences.size}ml. The minimum budget is around ₪${absoluteMin}. Please enter a higher amount.`,
                    type: 'text'
                }]);
                setInputText('');
                return;
            }
            handleQuickReply('budget', val, `₪${val}`);
            setInputText('');
        } else if (chatStep === 'notes') {
            // Check if user is typing a note or just searching
            // For simplicity, we just add the exact text as a note if they submit
            const newNotes = [...preferences.notes, inputText.trim()];
            const newPrefs = { ...preferences, notes: newNotes };
            setPreferences(newPrefs);
            
            setMessages(prev => [...prev, { role: 'user', content: inputText.trim() }]);
            setInputText('');
            setSuggestions([]);
            
            // Auto advance after 1 second if they just submit text
            setTimeout(() => advanceFlow('notes', newPrefs), 1000);
        }
    };

    const handleNoteInputChange = (e) => {
        const val = e.target.value;
        setInputText(val);
        if (chatStep === 'notes' && val.trim().length > 0) {
            const filtered = notesList.filter(n =>
                n.toLowerCase().includes(val.toLowerCase()) &&
                !preferences.notes.includes(n)
            );
            setSuggestions(filtered.slice(0, 5));
        } else {
            setSuggestions([]);
        }
    };

    const addNote = (note) => {
        if (!preferences.notes.includes(note)) {
            setPreferences({ ...preferences, notes: [...preferences.notes, note] });
        }
        setInputText('');
        setSuggestions([]);
    };

    const addToCartAll = async () => {
        if (!results) return;
        setIsLoading(true);
        try {
            const itemsToBatch = results.products.map(p => ({
                product: p,
                size: p.volume || '10ml',
                price: p.price,
                quantity: 1
            }));
            
            await addMultipleToCart(itemsToBatch, { successKey: 'matching.all_added_toast' });
            toast.success(isHebrew ? 'המארז נוסף לעגלה בהצלחה!' : 'Set added to cart successfully!');
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: isHebrew ? 'נוסף לעגלה! 🛒 מעולה.' : 'Added to cart! 🛒 Awesome.',
                type: 'text'
            }]);
            
            // Close the advisor if the cart opened, so the user can see it
            if (onClose) {
                setTimeout(() => {
                    onClose();
                }, 1000);
            }
        } catch (error) {
            console.error("Failed to add all items to cart:", error);
            toast.error(isHebrew ? 'שגיאה בהוספה לעגלה' : 'Error adding to cart');
        } finally {
            setIsLoading(false);
        }
    };

    const resetFlow = () => {
        setMessages([]);
        setChatStep('quantity');
        setPreferences({ quantity: null, size: null, budget: null, notes: [] });
        setResults(null);
        setInputText('');
    };

    return (
        <div className="flex flex-col h-full bg-[#111] text-gray-100 relative" dir={dir}>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[90%] md:max-w-[85%] rounded-2xl p-4 shadow-sm ${
                            msg.role === 'user' 
                                ? `bg-blue-600 text-white ${isHebrew ? 'rounded-br-sm' : 'rounded-bl-sm'}` 
                                : `bg-gray-800 text-gray-100 border border-gray-700 ${isHebrew ? 'rounded-bl-sm' : 'rounded-br-sm'}`
                        }`}>
                            <div 
                                className="text-sm leading-relaxed chat-markdown"
                                dangerouslySetInnerHTML={{ __html: marked.parse(msg.content || '') }}
                            />
                            
                            {/* Interactive Options inside Bot Message */}
                            {msg.type === 'quantity_options' && chatStep === 'quantity' && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {[2, 3, 5, 10].map(num => (
                                        <button 
                                            key={num}
                                            onClick={() => handleQuickReply('quantity', num, `${num} ${isHebrew ? 'בשמים' : 'perfumes'}`)}
                                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 font-bold rounded-xl transition-colors border border-transparent hover:border-gray-500"
                                        >
                                            {num} {isHebrew ? 'בשמים' : 'perfumes'}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {msg.type === 'size_options' && chatStep === 'size' && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {['2', '5', '10'].map(s => (
                                        <button 
                                            key={s}
                                            onClick={() => handleQuickReply('size', s, `${s}ml`)}
                                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 font-bold rounded-xl transition-colors border border-transparent hover:border-gray-500"
                                        >
                                            {s}ml
                                        </button>
                                    ))}
                                </div>
                            )}

                            {msg.type === 'budget_options' && chatStep === 'budget' && msg.minBudget && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {[
                                        msg.minBudget,
                                        Math.floor(msg.minBudget * 1.5),
                                        msg.minBudget * 2
                                    ].map(b => (
                                        <button 
                                            key={b}
                                            onClick={() => handleQuickReply('budget', b, `₪${b}`)}
                                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 font-bold rounded-xl transition-colors border border-transparent hover:border-gray-500"
                                        >
                                            ₪{b}
                                        </button>
                                    ))}
                                    <button 
                                        onClick={handleOtherBudget}
                                        className="px-4 py-2 bg-transparent border border-gray-600 hover:bg-gray-700 text-gray-300 font-bold rounded-xl transition-colors"
                                    >
                                        {isHebrew ? 'סכום אחר' : 'Other amount'}
                                    </button>
                                </div>
                            )}

                            {msg.type === 'notes_input' && chatStep === 'notes' && (
                                <div className="mt-4 space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        {preferences.notes.map(note => (
                                            <span key={note} className="px-3 py-1 bg-gray-700 text-blue-300 rounded-full text-xs font-bold flex items-center gap-1 border border-gray-600">
                                                {note}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button 
                                            onClick={() => advanceFlow('notes', preferences)}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-sm w-full md:w-auto"
                                        >
                                            {preferences.notes.length > 0 
                                                ? (isHebrew ? 'התאם לי עכשיו' : 'Match Me Now') 
                                                : (isHebrew ? 'דלג והתאם לי' : 'Skip & Match')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {msg.type === 'results_display' && results && (
                                <div className="mt-4 border-t border-gray-700 pt-4">
                                    <div className="flex flex-col gap-3 mb-4">
                                        {results.products.map(p => (
                                            <div key={p.id} className="flex items-center gap-3 bg-gray-900/50 p-2 rounded-xl border border-gray-700">
                                                <div className="w-12 h-12 relative bg-white rounded-lg flex-shrink-0">
                                                    <Image src={p.image_url} alt={p.name} fill className="object-contain p-1 mix-blend-multiply" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold truncate text-white">{localize(p, 'name')}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider truncate">{p.brand}</p>
                                                </div>
                                                <div className="text-sm font-black text-white shrink-0">₪{p.price}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={addToCartAll}
                                        disabled={isLoading}
                                        className="w-full py-3 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors shadow-lg shadow-white/10"
                                    >
                                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />}
                                        {isHebrew ? `הוסף הכל לעגלה (₪${results.totalPrice})` : `Add all to cart (₪${results.totalPrice})`}
                                    </button>
                                    
                                    <button 
                                        onClick={resetFlow}
                                        className="w-full mt-2 py-2 text-xs text-gray-400 font-bold hover:text-white transition-colors flex items-center justify-center gap-1"
                                    >
                                        <RefreshCcw size={12} />
                                        {isHebrew ? 'התחל מחדש' : 'Start Over'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                
                {isLoading && chatStep === 'loading' && (
                    <div className="flex justify-end">
                        <div className={`bg-gray-800 text-gray-100 rounded-2xl p-4 border border-gray-700 flex items-center gap-2 shadow-sm ${isHebrew ? 'rounded-bl-sm' : 'rounded-br-sm'}`}>
                            <Loader2 size={16} className="animate-spin text-blue-500" />
                            <span className="text-xs font-medium text-gray-400">{isHebrew ? 'מרכיב את המארז...' : 'Building the set...'}</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area (Only active for Budget and Notes) */}
            {(chatStep === 'budget_custom' || chatStep === 'notes') && (
                <div className="p-4 bg-gray-900 border-t border-gray-800 relative">
                    {/* Auto-suggest dropdown for Notes */}
                    {chatStep === 'notes' && suggestions.length > 0 && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 mx-4 bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden z-10 flex flex-wrap gap-2 p-3">
                            {suggestions.map(s => (
                                <button
                                    key={s}
                                    onClick={() => addNote(s)}
                                    className="px-3 py-1.5 text-xs font-bold bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors border border-transparent"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                    
                    <form onSubmit={handleInputSubmit} className="relative flex items-center gap-2 max-w-full">
                        <input
                            type={chatStep === 'budget_custom' ? "text" : "text"}
                            inputMode={chatStep === 'budget_custom' ? "numeric" : "text"}
                            pattern={chatStep === 'budget_custom' ? "[0-9]*" : undefined}
                            value={inputText}
                            onChange={(e) => {
                                if (chatStep === 'budget_custom') {
                                    // only allow numbers
                                    const val = e.target.value.replace(/\D/g, '');
                                    setInputText(val);
                                } else {
                                    handleNoteInputChange(e);
                                }
                            }}
                            placeholder={chatStep === 'budget_custom' 
                                ? (isHebrew ? "הקלד סכום ב-₪" : "Enter amount in ₪") 
                                : (isHebrew ? "הקלד תווים לחיפוש..." : "Type notes to search...")}
                            className={`flex-1 bg-gray-800 border border-gray-700 rounded-full py-3 px-5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all`}
                            disabled={isLoading}
                            dir={isHebrew ? "rtl" : "ltr"}
                        />
                        <button 
                            type="submit" 
                            disabled={!inputText.trim() || isLoading}
                            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-sm shrink-0"
                        >
                            <SendHorizontal size={18} className={isHebrew ? 'rotate-180' : ''} />
                        </button>
                    </form>
                </div>
            )}
            
            {/* If waiting for button selection, disable input visually or hide it */}
            {(chatStep === 'quantity' || chatStep === 'size' || chatStep === 'loading' || chatStep === 'results' || chatStep === 'budget') && (
                <div className="p-4 bg-gray-900 border-t border-gray-800 flex items-center justify-center opacity-50 select-none">
                    <p className="text-[10px] text-gray-500 font-medium">
                        {chatStep === 'results' 
                            ? (isHebrew ? 'ההתאמה הסתיימה' : 'Matching complete') 
                            : (isHebrew ? 'אנא בחר מהאפשרויות למעלה' : 'Please select from options above')}
                    </p>
                </div>
            )}
        </div>
    );
}
