'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SendHorizontal, X, ShoppingCart, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { usePathname, useRouter } from 'next/navigation';
import { marked } from 'marked';
import SmartMatchingClient from '../matching/SmartMatchingClient';

export default function SmartAdvisorTab() {
    const pathname = usePathname();
    const { locale } = useLanguage();
    const isHebrew = locale === 'he';
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('matching');
    const [messages, setMessages] = useState([
        { role: 'assistant', content: isHebrew ? 
            'שלום! אני היועץ החכם של ml-tlv.\n\nאשמח לעזור לך למצוא את הבושם המושלם עבורך. אפשר לבקש ממני בשמים לפי שם, עונה, אירוע או תווים ספציפיים (כמו וניל, עץ, הדרים).\n\n**איך אוכל לעזור לך היום?**' :
            'Hello! I am the Smart Advisor of ml-tlv.\n\nI would love to help you find your perfect perfume. You can ask me for perfumes by name, season, occasion, or specific notes (like vanilla, woody, citrus).\n\n**How can I help you today?**' 
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const { addToCart } = useCart();
    const router = useRouter();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Hide accessibility widget when chat is open
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('smart-advisor-open');
        } else {
            document.body.classList.remove('smart-advisor-open');
        }
        return () => document.body.classList.remove('smart-advisor-open');
    }, [isOpen]);

    if (pathname?.startsWith('/admin')) {
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const historyToSent = newMessages.slice(-10);
            
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: historyToSent })
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error("API Error Response:", errText);
                throw new Error('API Error: ' + errText);
            }

            const data = await response.json();
            
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.content,
                tool_calls: data.tool_calls
            }]);

            if (data.tool_calls && data.tool_calls.length > 0) {
                for (const tc of data.tool_calls) {
                    if (tc.name === 'add_to_cart') {
                        const { product, size, price, quantity } = tc.args;
                        if (product && price !== undefined) {
                            for (let i = 0; i < (quantity || 1); i++) {
                                addToCart(product, size, price);
                            }
                            setTimeout(() => {
                                setMessages(prev => [...prev, {
                                    role: 'assistant',
                                    content: isHebrew ? `נוסף לסל` : `Added to cart`
                                }]);
                            }, 500);
                        }
                    } else if (tc.name === 'go_to_checkout') {
                        setTimeout(() => {
                            setMessages(prev => [...prev, {
                                role: 'assistant',
                                content: isHebrew ? `מעביר אותך לעמוד התשלום...` : `Redirecting to checkout...`
                            }]);
                            router.push('/checkout');
                            setIsOpen(false);
                        }, 1000);
                    }
                }
            }

        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: isHebrew ? 'היועץ שלנו מטפל כרגע בפניות קודמות, נשמח לעזור בעוד מספר דקות.' : 'Our advisor is currently assisting other customers, please try again in a few minutes.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className={`fixed top-1/2 ${isHebrew ? 'left-0' : 'right-0'} -translate-y-1/2 z-50 block`}>
                <button 
                    onClick={() => setIsOpen(true)} 
                    className={`bg-black/90 backdrop-blur-md text-white px-1 py-3 md:px-2 md:py-4 shadow-[5px_0_15px_rgba(0,0,0,0.3)] border border-white/10 flex flex-col items-center gap-2 md:gap-3 hover:bg-gray-900 transition-all group overflow-hidden relative ${isHebrew ? 'rounded-r-xl border-l-0' : 'rounded-l-xl border-r-0'}`}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span 
                        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: isHebrew ? 'rotate(180deg)' : 'none' }} 
                        className="font-bold tracking-widest text-[10px] md:text-sm relative z-10"
                    >
                        {isHebrew ? 'היועץ החכם' : 'Smart Advisor'}
                    </span>
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ x: isHebrew ? '-100%' : '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: isHebrew ? '-100%' : '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className={`fixed top-0 ${isHebrew ? 'left-0 md:border-r' : 'right-0 md:border-l'} h-[100dvh] w-full md:w-[400px] bg-gradient-to-b from-gray-900 to-black text-white z-[60] shadow-2xl flex flex-col border-white/10`}
                        dir={isHebrew ? "rtl" : "ltr"}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/50">
                            <div className="flex items-center gap-3">
                                <div>
                                    <h3 className="font-bold text-lg tracking-wide">
                                        {isHebrew ? 'היועץ החכם' : 'Smart Advisor'}
                                    </h3>
                                    <p className="text-xs text-gray-400">{isHebrew ? 'מומחה נישה AI של ml-tlv' : 'ml-tlv AI Niche Expert'}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`max-w-[85%] rounded-2xl p-3 ${
                                        msg.role === 'user' 
                                            ? `bg-blue-600 text-white ${isHebrew ? 'rounded-br-sm' : 'rounded-bl-sm'}` 
                                            : `bg-white/10 text-gray-100 border border-white/5 ${isHebrew ? 'rounded-bl-sm' : 'rounded-br-sm'}`
                                    }`}>
                                        <div 
                                            className="text-sm leading-relaxed chat-markdown"
                                            dangerouslySetInnerHTML={{ __html: marked.parse(msg.content || '') }}
                                        />
                                        
                                        {msg.tool_calls && msg.tool_calls.map((tc, tIdx) => (
                                            <div key={tIdx} className="mt-2 text-xs bg-black/30 p-2 rounded border border-white/5 flex items-center gap-2">
                                                {tc.name === 'add_to_cart' ? (
                                                    <><ShoppingCart size={14} className="text-green-400"/> {isHebrew ? 'מפעיל פעולה: הוספה לעגלה' : 'Action: Adding to cart'}</>
                                                ) : tc.name === 'go_to_checkout' ? (
                                                    <><ShoppingCart size={14} className="text-blue-400"/> {isHebrew ? 'מעביר לקופה' : 'Going to checkout'}</>
                                                ) : (
                                                    <><Loader2 size={14} className="text-gray-400 animate-spin"/> {isHebrew ? 'מבצע פעולה ברקע...' : 'Executing action...'}</>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-end">
                                    <div className={`bg-white/10 text-gray-100 rounded-2xl p-3 border border-white/5 flex items-center gap-2 ${isHebrew ? 'rounded-bl-sm' : 'rounded-br-sm'}`}>
                                        <Loader2 size={16} className="animate-spin text-blue-400" />
                                        <span className="text-xs text-gray-400">{isHebrew ? 'היועץ מקליד...' : 'Advisor is typing...'}</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-white/10 bg-black/50">
                            <form onSubmit={handleSubmit} className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={isHebrew ? "בקש המלצה, תווים, או עונה..." : "Ask for recommendations, notes..."}
                                    className={`w-full bg-white/5 border border-white/10 rounded-full py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all ${isHebrew ? 'pl-12 pr-5' : 'pr-12 pl-5'}`}
                                    disabled={isLoading}
                                    dir={isHebrew ? "rtl" : "ltr"}
                                />
                                <button 
                                    type="submit" 
                                    disabled={!input.trim() || isLoading}
                                    className={`absolute top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors ${isHebrew ? 'left-2' : 'right-2'}`}
                                >
                                    <SendHorizontal size={16} className={isHebrew ? 'rotate-180' : ''} />
                                </button>
                            </form>
                            <p className="text-center text-[10px] text-gray-500 mt-3">
                                {isHebrew ? 'היועץ מופעל ע"י בינה מלאכותית ויכול לטעות.' : 'Advisor is powered by AI and can make mistakes.'}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{__html: `
                body.smart-advisor-open .acc-widget-root {
                    display: none !important;
                }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                
                /* Markdown styles */
                .chat-markdown p {
                    margin-bottom: 0.5em;
                }
                .chat-markdown p:last-child {
                    margin-bottom: 0;
                }
                .chat-markdown strong {
                    color: #93c5fd;
                    font-weight: 700;
                }
                .chat-markdown ul {
                    list-style-type: disc;
                    padding-inline-start: 1.5em;
                    margin-bottom: 0.5em;
                }
                .chat-markdown li {
                    margin-bottom: 0.25em;
                }
            `}} />
        </>
    );
}
