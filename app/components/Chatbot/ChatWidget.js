"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "היי! 👋 אני הבוט של ml_tlv. איך אני יכול לעזור לך היום?", sender: 'bot', type: 'text' }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);
    const router = useRouter();

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), text: input, sender: 'user', type: 'text' };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        // Simulate thinking delay
        setTimeout(async () => {
            const botResponse = await getBotResponse(userMsg.text);
            setIsTyping(false);
            setMessages(prev => [...prev, botResponse]);
        }, 1000);
    };

    const getBotResponse = async (text) => {
        const lowerText = text.toLowerCase();

        // 1. FAQs
        if (lowerText.includes('משלוח') || lowerText.includes('זמן') || lowerText.includes('מגיע') || lowerText.includes('shipping')) {
            return {
                id: Date.now(),
                text: "אנחנו שולחים לכל הארץ! 🚚\nמשלוח ללוקר מגיע תוך 3-5 ימי עסקים.\nמשלוח עד הבית תוך 2-4 ימי עסקים.",
                sender: 'bot',
                type: 'text'
            };
        }

        if (lowerText.includes('מקורי') || lowerText.includes('אמיתי') || lowerText.includes('זיוף') || lowerText.includes('authentic')) {
            return {
                id: Date.now(),
                text: "כל הבשמים שלנו מקוריים ב-100% באחריות! ✨\nאנחנו עובדים רק עם ספקים רשמיים ומוכרים דוגמיות שנשאבות ישירות מהבקבוק המקורי.",
                sender: 'bot',
                type: 'text'
            };
        }

        if (lowerText.includes('החזר') || lowerText.includes('ביטול') || lowerText.includes('return')) {
            return {
                id: Date.now(),
                text: "ניתן להחזיר מוצרים סגורים באריזתם המקורית תוך 14 יום. לא ניתן להחזיר דוגמיות שנפתחו מטעמי היגיינה.",
                sender: 'bot',
                type: 'text'
            };
        }

        if (lowerText.includes('מיקום') || lowerText.includes('איפה') || lowerText.includes('חנות')) {
            return {
                id: Date.now(),
                text: "אנחנו חנות אינטרנטית ומבצעים משלוחים לכל הארץ. המחסנים שלנו נמצאים בתל אביב📍",
                sender: 'bot',
                type: 'text'
            };
        }

        // 2. Product Search Intent
        const isSearch = lowerText.startsWith('יש לכם') || lowerText.startsWith('מחפש') || lowerText.includes('בושם') || lowerText.length > 2; // Broad catch

        if (isSearch) {
            try {
                // Extract search term - naive logic: take the whole phrase or try to clean it
                // Better: just search the whole phrase as 'q'
                const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(text)}`);
                const data = await res.json();

                if (data.results && data.results.length > 0) {
                    return {
                        id: Date.now(),
                        text: `מצאתי ${data.results.length} תוצאות עבורך:`,
                        sender: 'bot',
                        type: 'products',
                        data: data.results
                    };
                }
            } catch (e) {
                console.error("Bot search failed", e);
            }
        }

        // 3. Fallback -> Instagram Handoff
        return {
            id: Date.now(),
            text: "הממ... אני לא בטוח לגבי זה. 🤔\nאני אשמח לקשר אותך לנציג אנושי באינסטגרם שיוכל לעזור מיד!",
            sender: 'bot',
            type: 'fallback_instagram'
        };
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end" style={{ direction: 'rtl' }}>
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[500px] transition-all duration-300 transform origin-bottom-right">
                    {/* Header */}
                    <div className="bg-black text-white p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <div className="w-2 h-2 bg-green-500 rounded-full absolute bottom-0 right-0 border border-black"></div>
                                <span className="text-2xl">🤖</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">ml_tlv Support</h3>
                                <div className="text-[10px] opacity-75">Online Now</div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 bg-gray-50 p-4 overflow-y-auto min-h-[300px]" ref={scrollRef}>
                        {messages.map((msg) => (
                            <div key={msg.id} className={`mb-4 flex ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${msg.sender === 'bot'
                                        ? 'bg-white text-gray-800 rounded-tr-none border border-gray-100'
                                        : 'bg-black text-white rounded-tl-none'
                                    }`}>
                                    {msg.text && <div className="whitespace-pre-line">{msg.text}</div>}

                                    {/* Products Carousel */}
                                    {msg.type === 'products' && (
                                        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
                                            {msg.data.map(p => (
                                                <Link key={p.id} href={`/product/${p.id}`} className="min-w-[120px] bg-white border rounded-lg p-2 flex flex-col items-center hover:shadow-md transition">
                                                    <div className="w-20 h-20 relative mb-2">
                                                        <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                                                    </div>
                                                    <div className="text-xs font-bold text-center line-clamp-2 h-8">{p.name}</div>
                                                    <div className="text-xs text-gray-500">{p.brand}</div>
                                                    <div className="text-sm font-bold mt-1">₪{p.price}</div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}

                                    {/* Instagram CTA */}
                                    {msg.type === 'fallback_instagram' && (
                                        <a
                                            href="https://ig.me/m/ml_tlv"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-3 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-full text-xs font-bold hover:opacity-90 transition transform hover:scale-105"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.486-.276a2.478 2.478 0 0 1-.919-.598 2.48 2.48 0 0 1-.599-.919c-.11-.281-.24-.705-.275-1.485-.038-.843-.047-1.096-.047-3.232 0-2.136.009-2.388.047-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z" />
                                            </svg>
                                            שלח הודעה באינסטגרם
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start mb-4">
                                <div className="bg-white border border-gray-100 rounded-2xl rounded-tr-none p-3 shadow-sm flex gap-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="bg-white p-3 border-t flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="הקלד הודעה..."
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-black transition"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className="bg-black text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 hover:scale-105 transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-black text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all duration-300 relative group"
            >
                {/* Notification Badge */}
                {!isOpen && (
                    <span className="absolute -top-1 -left-1 bg-red-500 w-4 h-4 rounded-full border-2 border-white"></span>
                )}

                {/* Icon Switch */}
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                )}

                {/* Tooltip */}
                {!isOpen && (
                    <div className="absolute right-full mr-3 bg-white text-black text-xs font-bold py-2 px-3 rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        צריך עזרה?
                    </div>
                )}
            </button>
        </div>
    );
}
