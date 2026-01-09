"use client";

import { motion } from "framer-motion";
import { Sparkles, Gift, Diamond } from "lucide-react";
import Link from 'next/link';

export default function BonusesSection() {
    return (
        <section className="min-h-screen w-full relative flex flex-col justify-center items-center bg-black overflow-hidden perspective-1000 py-20">
            {/* Liquid Animated Background */}
            {/* Liquid Animated Background - Optimized */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        opacity: [0.2, 0.4, 0.2],
                        scale: [1, 1.05, 1],
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-[20%] -left-[20%] w-[120vw] h-[120vw] bg-gradient-to-br from-purple-900/20 via-blue-900/10 to-transparent rounded-full blur-3xl mix-blend-screen"
                />
                <motion.div
                    animate={{
                        opacity: [0.2, 0.4, 0.2],
                        scale: [1, 1.05, 1],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute -bottom-[20%] -right-[20%] w-[120vw] h-[120vw] bg-gradient-to-tl from-indigo-900/20 via-pink-900/10 to-transparent rounded-full blur-3xl mix-blend-screen"
                />
            </div>

            <div className="container mx-auto px-4 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="shrink-0 mb-12"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500 drop-shadow-lg tracking-[0.1em] uppercase">הבונוסים שלנו</h2>
                    <p className="text-gray-300 text-lg mb-2">ככל שסכום ההזמנה גבוה יותר, כך אנחנו מפנקים יותר</p>
                    <div className="w-24 h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto rounded-full opacity-70"></div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto perspective-1000" dir="rtl">
                    {/* Tier: 300 NIS */}
                    <motion.div
                        whileHover={{ scale: 1.05, rotateY: 5, z: 50 }}
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
                        className="group relative bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-xl shadow-2xl hover:bg-white/10 transition-all duration-500 flex flex-col items-center border-t-white/20 border-l-white/20"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="mb-4 text-white/50 group-hover:text-white transition-colors">
                            <Sparkles size={48} strokeWidth={1} />
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-white">בקנייה מעל 300 ₪</h3>
                        <p className="text-gray-300 text-lg group-hover:text-white transition-colors">2 דוגמיות מתנה</p>
                        <p className="text-white/60 text-xs mt-4 group-hover:text-white/80 transition-colors">*בגודל 2 מ"ל</p>
                    </motion.div>

                    {/* Tier: 500 NIS - Highlighted */}
                    <motion.div
                        whileHover={{ scale: 1.1, rotateY: 0, z: 80 }}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
                        className="group relative bg-gradient-to-br from-white/10 to-white/5 border border-white/30 p-10 rounded-2xl backdrop-blur-2xl shadow-[0_0_50px_rgba(255,255,255,0.1)] hover:shadow-[0_0_80px_rgba(255,255,255,0.2)] transition-all duration-500 flex flex-col items-center transform scale-105 z-10 border-t-white/40 border-l-white/40"
                    >
                        <div className="absolute -top-4 bg-gradient-to-r from-white via-gray-200 to-white text-black px-6 py-1 rounded-full text-sm font-bold tracking-widest shadow-lg uppercase">
                            מומלץ
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="mb-6 text-white/80 group-hover:text-white transition-colors group-hover:scale-110 duration-500">
                            <Gift size={64} strokeWidth={1} />
                        </div>
                        <h3 className="text-3xl font-bold mb-3 text-white">בקנייה מעל 500 ₪</h3>
                        <p className="text-gray-200 text-xl font-medium group-hover:text-white transition-colors">4 דוגמיות מתנה</p>
                        <p className="text-white/60 text-xs mt-4 group-hover:text-white/80 transition-colors">*בגודל 2 מ"ל</p>
                    </motion.div>

                    {/* Tier: 1000 NIS */}
                    <motion.div
                        whileHover={{ scale: 1.05, rotateY: -5, z: 50 }}
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 100, delay: 0.3 }}
                        className="group relative bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-xl shadow-2xl hover:bg-white/10 transition-all duration-500 flex flex-col items-center border-t-white/20 border-l-white/20"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="mb-4 text-white/50 group-hover:text-white transition-colors">
                            <Diamond size={48} strokeWidth={1} />
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-white">בקנייה מעל 1000 ₪</h3>
                        <p className="text-gray-300 text-lg group-hover:text-white transition-colors">6 דוגמיות מתנה</p>
                        <p className="text-white/60 text-xs mt-4 group-hover:text-white/80 transition-colors">*בגודל 2 מ"ל</p>
                    </motion.div>
                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="text-gray-500 text-xs mt-12 opacity-50"
                >
                    * הדוגמיות נבחרות על ידי הצוות שלנו בהתאם למלאי ולטעם שלכם במידה ולא צוין אחרת.
                </motion.p>

                <div className="text-center mt-16">
                    <Link href="/catalog" className="btn bg-white text-black hover:bg-gray-200 px-12 py-4 text-xl font-bold rounded-lg transition inline-block">
                        קניתי אותי, בוא נתחיל
                    </Link>
                </div>
            </div>
        </section>
    );
}
