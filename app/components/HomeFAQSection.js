"use client";

import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { faq_he, faq_en } from '../data/faq_data';
import ContactModal from './ContactModal';

export default function HomeFAQSection() {
    const { t, locale, dir } = useLanguage();
    const [openIndex, setOpenIndex] = useState(0);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);

    // Pick a subset of important questions from the FAQ data
    const faqs = locale === 'en' ? faq_en : faq_he;
    
    // We manually pick some highly asked questions across categories
    const topQuestions = [
        faqs[0].items[0], // Originality
        faqs[0].items[1], // Decanting process
        faqs[3].items[0], // Shipping cost
        faqs[0].items[2], // Identical scent
        faqs[0].items[3], // Original bottle
    ].filter(Boolean);

    return (
        <section className="py-16 md:py-24 bg-white" dir={dir}>
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                        {t('common.faq') || "שאלות ותשובות"}
                    </h2>
                    <div className="w-24 h-1 bg-black mx-auto mt-6"></div>
                </div>

                <div className="bg-[#f8fbfa] rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-10 md:gap-16">
                    
                    {/* Left: Video & Contact Box */}
                    <div className="w-full lg:w-1/2 relative rounded-[1.5rem] md:rounded-[2rem] overflow-hidden flex flex-col justify-center min-h-[400px] shadow-lg group">
                        <video 
                            src="/perfume3.mp4" 
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            autoPlay 
                            loop 
                            muted 
                            playsInline
                        />
                        {/* Dark Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                        
                        <div className="relative z-10 text-center text-white px-6 py-10 mt-auto">
                            <h3 className="text-3xl md:text-4xl font-bold mb-4 drop-shadow-lg leading-tight">
                                {locale === 'en' ? "Have more questions?" : "יש לכם שאלות נוספות?"}
                            </h3>
                            <p className="text-sm md:text-base opacity-90 mb-8 max-w-sm mx-auto drop-shadow-md">
                                {locale === 'en' 
                                    ? "Send us a message and our team will be happy to assist you."
                                    : "שלחו לנו הודעה ונשמח לעמוד לשירותכם"}
                            </p>
                            <button
                                onClick={() => setIsContactModalOpen(true)}
                                className="bg-[#3a3532] hover:bg-[#262321] text-white px-8 py-4 rounded-full font-bold text-sm md:text-base tracking-wide transition-all shadow-xl hover:scale-105 active:scale-95 border border-white/20 backdrop-blur-sm inline-flex items-center gap-3"
                            >
                                <span>
                                    {locale === 'en' ? "Send a Message" : "לשליחת הודעה"}
                                </span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Right: Accordion */}
                    <div className="w-full lg:w-1/2 flex flex-col justify-center space-y-4">
                        {topQuestions.map((item, idx) => {
                            const isOpen = openIndex === idx;
                            return (
                                <div 
                                    key={idx} 
                                    className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                                        isOpen ? 'border-gray-300 shadow-md' : 'border-gray-100 hover:border-gray-200'
                                    }`}
                                >
                                    <button 
                                        onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                                        className="w-full flex items-center justify-between p-6 md:p-8 text-left focus:outline-none"
                                        dir={dir}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                                            {isOpen ? (
                                                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                                </svg>
                                            )}
                                        </div>
                                        <h4 className={`text-lg md:text-xl font-bold text-black flex-grow px-4 leading-tight ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                            {item.q}
                                        </h4>
                                    </button>
                                    
                                    <div 
                                        className={`transition-all duration-500 ease-in-out px-6 md:px-8 pb-6 md:pb-8 text-gray-600 leading-relaxed ${
                                            isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 pb-0 overflow-hidden'
                                        }`}
                                    >
                                        <div className={`pr-14 ${dir === 'rtl' ? 'pr-14' : 'pl-14'}`}>
                                            {item.a}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <ContactModal 
                isOpen={isContactModalOpen} 
                onClose={() => setIsContactModalOpen(false)} 
            />
        </section>
    );
}
