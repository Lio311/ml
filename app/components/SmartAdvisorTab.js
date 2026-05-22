'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, Send, X, ShoppingCart, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';
import { marked } from 'marked';

export default function SmartAdvisorTab() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'שלום! אני היועץ החכם של ml-tlv. 🤖\n\nאשמח לעזור לך למצוא את הבושם המושלם עבורך. אפשר לבקש ממני בשמים לפי שם, עונה, אירוע או תווים ספציפיים (כמו וניל, עץ, הדרים). \n\n**איך אוכל לעזור לך היום?**' }
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            // Send only the last 10 messages to save tokens
            const historyToSent = newMessages.slice(-10);
            
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: historyToSent })
            });

            if (!res.ok) throw new Error('Failed to fetch from chat API');

            const data = await res.json();
            
            // Add assistant response to state
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.content,
                tool_calls: data.tool_calls
            }]);

            // Execute client-side tool calls if any
            if (data.tool_calls && data.tool_calls.length > 0) {
                for (const tc of data.tool_calls) {
                    if (tc.name === 'add_to_cart') {
                        const { product, size, price, quantity } = tc.args;
                        if (product && price !== undefined) {
                            // Execute the cart action
                            for (let i = 0; i < (quantity || 1); i++) {
                                addToCart(product, size, price);
                            }
                            
                            // Let the model know it succeeded by adding a system/tool message silently
                            // Actually, just for visual feedback, we append a fake assistant message
                            setTimeout(() => {
                                setMessages(prev => [...prev, {
                                    role: 'assistant',
                                    content: `הוספתי ${quantity || 1} יחידות של ${size} מהבושם **${product.brand} ${product.model}** לעגלה שלך! 🛒`
                                }]);
                            }, 500);
                        }
                    } else if (tc.name === 'go_to_checkout') {
                        setTimeout(() => {
                            setMessages(prev => [...prev, {
                                role: 'assistant',
                                content: `מעביר אותך לעמוד התשלום... 💳`
                            }]);
                            router.push('/checkout');
                            setIsOpen(false);
                        }, 1000);
                    }
                }
            }

        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'אופס, משהו השתבש בחיבור לשרת. נסה שוב מאוחר יותר.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* The Tab on the left - Hidden on mobile */}
            <div className="fixed top-1/2 left-0 -translate-y-1/2 z-50 hidden md:block">
                <button 
                    onClick={() => setIsOpen(true)} 
                    className="bg-black/90 backdrop-blur-md text-white px-2 py-4 rounded-r-xl shadow-[5px_0_15px_rgba(0,0,0,0.3)] border border-l-0 border-white/10 flex flex-col items-center gap-3 hover:bg-gray-900 transition-all group overflow-hidden relative"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Bot size={22} className="text-blue-400 group-hover:scale-110 group-hover:text-blue-300 transition-transform relative z-10" />
                    <span 
                        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }} 
                        className="font-bold tracking-widest text-sm relative z-10"
                    >
                        היועץ החכם
                    </span>
                    <Sparkles size={14} className="text-yellow-400 animate-pulse relative z-10" />
                </button>
            </div>

            {/* The Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ x: '-100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '-100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 h-[100dvh] w-[400px] bg-gradient-to-b from-gray-900 to-black text-white z-[60] shadow-2xl flex flex-col border-r border-white/10 hidden md:flex"
                        dir="rtl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/50">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-500/20 p-2 rounded-full border border-blue-500/30">
                                    <Bot size={24} className="text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg tracking-wide flex items-center gap-2">
                                        היועץ החכם <Sparkles size={16} className="text-blue-400" />
                                    </h3>
                                    <p className="text-xs text-gray-400">מומחה נישה AI של ml-tlv</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`max-w-[85%] rounded-2xl p-3 ${
                                        msg.role === 'user' 
                                            ? 'bg-blue-600 text-white rounded-br-sm' 
                                            : 'bg-white/10 text-gray-100 rounded-bl-sm border border-white/5'
                                    }`}>
                                        <div 
                                            className="text-sm leading-relaxed chat-markdown"
                                            dangerouslySetInnerHTML={{ __html: marked.parse(msg.content || '') }}
                                        />
                                        
                                        {/* Display tool calls if they exist */}
                                        {msg.tool_calls && msg.tool_calls.map((tc, tIdx) => (
                                            <div key={tIdx} className="mt-2 text-xs bg-black/30 p-2 rounded border border-white/5 flex items-center gap-2">
                                                {tc.name === 'add_to_cart' ? (
                                                    <><ShoppingCart size={14} className="text-green-400"/> מפעיל פעולה: הוספה לעגלה</>
                                                ) : tc.name === 'go_to_checkout' ? (
                                                    <><ShoppingCart size={14} className="text-blue-400"/> מעביר לקופה</>
                                                ) : (
                                                    <><Bot size={14} className="text-gray-400"/> מבצע פעולה ברקע...</>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-end">
                                    <div className="bg-white/10 text-gray-100 rounded-2xl rounded-bl-sm p-3 border border-white/5 flex items-center gap-2">
                                        <Loader2 size={16} className="animate-spin text-blue-400" />
                                        <span className="text-xs text-gray-400">היועץ מקליד...</span>
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
                                    placeholder="בקש המלצה, תווים, או עונה..."
                                    className="w-full bg-white/5 border border-white/10 rounded-full py-3 px-5 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                    disabled={isLoading}
                                />
                                <button 
                                    type="submit" 
                                    disabled={!input.trim() || isLoading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                                >
                                    <Send size={16} className="rotate-180" /> {/* Rotate for RTL */}
                                </button>
                            </form>
                            <p className="text-center text-[10px] text-gray-500 mt-3">
                                היועץ מופעל ע"י בינה מלאכותית ויכול לטעות.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{__html: `
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
                    color: #93c5fd; /* blue-300 */
                    font-weight: 700;
                }
                .chat-markdown ul {
                    list-style-type: disc;
                    padding-right: 1.5em;
                    margin-bottom: 0.5em;
                }
                .chat-markdown li {
                    margin-bottom: 0.25em;
                }
            `}} />
        </>
    );
}
