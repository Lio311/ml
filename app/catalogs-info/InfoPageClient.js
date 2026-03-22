"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShoppingBag, Globe, Zap, ShieldCheck, Mail, Phone, ExternalLink } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function InfoPageClient({ userId }) {
    const { t, dir } = useLanguage();
    const isRTL = dir === 'rtl';
    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const floatingImage = {
        animate: {
            y: [0, -10, 0],
            transition: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] text-black font-sans selection:bg-yellow-200 overflow-x-hidden">
            {/* Header / Hero Section */}
            <section className="relative pt-12 pb-8 px-4 overflow-hidden bg-white">
                {/* Premium Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
                
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,234,0,0.15)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(0,0,0,0.05)_0%,transparent_50%)]" />
                
                <div className="container max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-10">
                        <motion.div 
                            className="flex-1 text-center flex flex-col items-center"
                            initial="hidden"
                            animate="visible"
                            variants={staggerContainer}
                        >
                            <motion.span 
                                variants={fadeIn}
                                className="inline-block px-4 py-1.5 bg-black text-white text-[10px] font-black tracking-[0.2em] rounded-full mb-6 order-1"
                            >
                                {t('catalogs_info.hero_badge')}
                            </motion.span>
                            <motion.h1 
                                variants={fadeIn}
                                className="text-5xl md:text-7xl font-black mb-2 md:mb-6 leading-[1.1] tracking-tighter order-2"
                            >
                                {t('catalogs_info.hero_title_part1')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-400">{t('catalogs_info.hero_title_accent')}</span> <br /> {t('catalogs_info.hero_title_part2')}
                            </motion.h1>
                            <motion.p 
                                variants={fadeIn}
                                className="text-lg md:text-xl text-gray-500 mb-2 md:mb-4 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium order-3"
                            >
                                {t('catalogs_info.hero_subtitle')}
                            </motion.p>

                            {/* Mobile Visuals: Positioned between text and buttons on mobile only */}
                            <motion.div 
                                className="lg:hidden relative w-full h-[240px] flex items-center justify-center mb-10 order-4"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            >
                                <div className="relative w-full max-w-[280px]">
                                    <motion.div 
                                        className="relative w-full mx-auto rounded-[1.5rem] shadow-xl overflow-hidden border border-white bg-white z-10"
                                        style={{ rotateX: 12, rotateY: -15, transformPerspective: 1200 }}
                                    >
                                        <img src="/info-page/media__1773582608518.png" className="w-full h-auto block" alt="Catalog Preview" />
                                    </motion.div>
                                    <motion.div 
                                        className="absolute -bottom-8 -left-8 w-44 shadow-xl rounded-xl border border-white/80 overflow-hidden bg-white/90 backdrop-blur-sm p-2 z-30"
                                        style={{ rotateX: 10, rotateY: 15, transformPerspective: 1200 }}
                                    >
                                        <img src="/info-page/media__1773582785226.png" alt="Cart Preview" className="w-full h-auto block rounded-lg" />
                                    </motion.div>
                                </div>
                            </motion.div>
                            
                            <motion.div 
                                variants={fadeIn}
                                className="flex flex-col sm:flex-row items-center justify-center gap-4 order-5 w-full"
                            >
                                {userId ? (
                                    <Link href="/my-catalogs" className="w-full sm:w-auto px-10 py-4 bg-yellow-400 text-black rounded-full font-black text-lg hover:scale-105 transition-transform shadow-[0_20px_40px_-10px_rgba(253,224,71,0.3)]">
                                        {t('catalogs_info.manage_my_catalogs')}
                                    </Link>
                                ) : (
                                    <Link href="/sign-up" className="w-full sm:w-auto px-10 py-4 bg-yellow-400 text-black rounded-full font-black text-lg hover:scale-105 transition-transform shadow-[0_20px_40px_-10px_rgba(253,224,71,0.3)]">
                                        {t('catalogs_info.create_free_account')}
                                    </Link>
                                )}
                                <a href="#preview" className="w-full sm:w-auto px-10 py-4 bg-white text-black border border-gray-100 rounded-full font-bold text-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                    {t('catalogs_info.how_it_looks')} <ArrowRight size={20} className={isRTL ? "rotate-180" : ""} />
                                </a>
                            </motion.div>
                        </motion.div>

                        <motion.div 
                            className={`hidden lg:flex flex-1 relative w-full h-[450px] items-center justify-center lg:justify-end -mt-12 md:-mt-20 ${!isRTL ? 'lg:translate-x-20' : ''}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        >
                            {/* 3D Cohesive Visuals - Fixed Aspect Ratios */}
                            <div className="relative w-full max-w-xl flex justify-end">
                                {/* Main Image - Preserving Ratio, Slightly Larger & Shifted Right */}
                                <motion.div 
                                    className="relative w-[440px] mr-0 ml-auto rounded-[2.5rem] shadow-[0_60px_120px_-20px_rgba(0,0,0,0.2)] overflow-hidden border border-white bg-white z-10"
                                    style={{ rotateX: 12, rotateY: -15, transformPerspective: 1200 }}
                                    whileHover={{ rotateY: -8, scale: 1.05 }}
                                    transition={{ duration: 0.8 }}
                                >
                                    <img 
                                        src="/info-page/media__1773582608518.png" 
                                        className="w-full h-auto block" 
                                        alt="Catalog Preview" 
                                    />
                                </motion.div>



                                {/* Floating Bottom Left Card - 10% Overlap & Shifted Left */}
                                <motion.div 
                                    className="absolute -bottom-12 -left-[120px] w-80 shadow-2xl rounded-2xl border border-white/80 overflow-hidden bg-white/90 backdrop-blur-sm p-3 z-30"
                                    initial={{ y: 20 }}
                                    animate={{ y: 0 }}
                                    transition={{ duration: 2, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                                    style={{ rotateX: 10, rotateY: 15, transformPerspective: 1200 }}
                                >
                                    <img src="/info-page/media__1773582785226.png" alt="Cart Preview" className="w-full h-auto block rounded-xl" />
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Trusted Features Grid */}
            <section className="py-8 bg-gray-50">
                <div className="container max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                        <div className="space-y-4 flex flex-col items-center">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center mb-6 mx-auto">
                                <Globe className="text-blue-500" />
                            </div>
                            <h3 className="text-xl font-black">{t('catalogs_info.feature_globe_title')}</h3>
                            <p className="text-gray-500 leading-relaxed max-w-sm mx-auto">
                                {t('catalogs_info.feature_globe_desc')}
                            </p>
                        </div>
                        <div className="space-y-4 flex flex-col items-center border-x border-gray-100 px-8">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center mb-6 mx-auto">
                                <Zap className="text-yellow-500" />
                            </div>
                            <h3 className="text-xl font-black">{t('catalogs_info.feature_zap_title')}</h3>
                            <p className="text-gray-500 leading-relaxed max-w-sm mx-auto">
                                {t('catalogs_info.feature_zap_desc')}
                            </p>
                        </div>
                        <div className="space-y-4 flex flex-col items-center">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center mb-6 mx-auto">
                                <ShieldCheck className="text-green-500" />
                            </div>
                            <h3 className="text-xl font-black">{t('catalogs_info.feature_shield_title')}</h3>
                            <p className="text-gray-500 leading-relaxed max-w-sm mx-auto">
                                {t('catalogs_info.feature_shield_desc')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Showcase Section: Admin Dashboard */}
            <section id="preview" className="py-10 px-4 bg-white overflow-hidden">
                <div className="container max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
                        <div className="flex-1 text-right flex flex-col">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="flex flex-col"
                            >
                                <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight order-1">{t('catalogs_info.admin_title')}</h2>
                                
                                {/* Mobile Image: Visible only on small screens */}
                                <motion.div 
                                    className="lg:hidden w-full shadow-xl rounded-2xl overflow-hidden border border-gray-100 mb-8 order-2"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                >
                                    <img src="/info-page/media__1773582785213.png" alt="Admin UI Mobile" className="w-full" />
                                </motion.div>

                                <p className="text-gray-500 text-lg mb-6 leading-relaxed order-3">
                                    {t('catalogs_info.admin_desc')}
                                </p>
                                <ul className="space-y-6 order-4">
                                    {[
                                        t('catalogs_info.admin_feature_1'),
                                        t('catalogs_info.admin_feature_2'),
                                        t('catalogs_info.admin_feature_3'),
                                        t('catalogs_info.admin_feature_4')
                                    ].map((item, i) => (
                                        <li key={i} className={`flex items-center ${isRTL ? "justify-start" : "justify-end"} gap-4 ${isRTL ? "text-right" : "text-left"}`}>
                                            <CheckCircle2 className="text-yellow-500 w-6 h-6 flex-shrink-0" />
                                            <span className="text-gray-900 font-bold text-lg">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        </div>
                        {/* Desktop Image: Hidden on mobile */}
                        <div className="hidden lg:block flex-1 relative">
                            <motion.div 
                                className="shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] rounded-2xl overflow-hidden border border-gray-100 z-10 relative"
                                initial={{ x: 50, opacity: 0 }}
                                whileInView={{ x: 0, opacity: 1 }}
                                viewport={{ once: true }}
                            >
                                <img src="/info-page/media__1773582785213.png" alt="Admin UI" className="w-full" />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Showcase Section: Shopping Experience */}
            <section className="py-10 px-4 bg-black text-white relative">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_80%_20%,rgba(255,234,0,0.1)_0%,transparent_50%)] pointer-events-none" />
                <div className="container max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row-reverse items-center gap-16 lg:items-center">
                        {/* Desktop Image: Should be on the LEFT of the screen */}
                        <div className="hidden lg:block flex-1 relative">
                            <motion.div 
                                className="rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] border border-white/10"
                                initial={{ x: -40, opacity: 0 }}
                                whileInView={{ x: 0, opacity: 1 }}
                                viewport={{ once: true }}
                            >
                                <img 
                                    src="/info-page/media__1773586658987.png" 
                                    alt="Catalog Preview Desktop" 
                                    className="w-full h-auto block" 
                                />
                            </motion.div>
                        </div>

                        {/* Text Content: Should be on the RIGHT of the screen */}
                        <div className="flex-1 text-right flex flex-col">
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="flex flex-col text-right w-full h-full justify-center"
                            >
                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 leading-tight order-1 text-white">{t('catalogs_info.shopping_title')}</h2>
                                <p className="text-gray-400 text-base md:text-lg mb-6 leading-relaxed font-medium order-2">
                                    {t('catalogs_info.shopping_desc')}
                                </p>

                                {/* Mobile Image: Visible only on small screens, positioned between text and cards */}
                                <motion.div 
                                    className="lg:hidden w-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 mb-8 order-3"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                >
                                    <img src="/info-page/media__1773586658987.png" alt="Catalog Preview Mobile" className="w-full" />
                                </motion.div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 order-4 w-full">
                                    <div className="p-8 bg-[#0a0a0a] rounded-3xl border border-white/5 hover:border-yellow-400/20 transition-all duration-500 flex flex-col items-end group shadow-2xl">
                                        <div className="w-12 h-12 bg-yellow-400/5 rounded-2xl flex items-center justify-center mb-6 self-start group-hover:bg-yellow-400 transition-all duration-500">
                                            <ShoppingBag className="text-yellow-400 w-6 h-6 group-hover:text-black transition-colors" />
                                        </div>
                                        <h4 className={`text-xl font-black text-white mb-2 w-full ${isRTL ? "text-right" : "text-left"}`}>{t('catalogs_info.shopping_cart_title')}</h4>
                                        <p className={`text-xs text-gray-500 leading-relaxed w-full ${isRTL ? "text-right" : "text-left"}`}>{t('catalogs_info.shopping_cart_desc')}</p>
                                    </div>
                                    <div className="p-8 bg-[#0a0a0a] rounded-3xl border border-white/5 hover:border-yellow-400/20 transition-all duration-500 flex flex-col items-end group shadow-2xl">
                                        <div className="w-12 h-12 bg-yellow-400/5 rounded-2xl flex items-center justify-center mb-6 self-start group-hover:bg-yellow-400 transition-all duration-500">
                                            <ExternalLink className="text-yellow-400 w-6 h-6 group-hover:text-black transition-colors" />
                                        </div>
                                        <h4 className={`text-xl font-black text-white mb-2 w-full ${isRTL ? "text-right" : "text-left"}`}>{t('catalogs_info.shopping_share_title')}</h4>
                                        <p className={`text-xs text-gray-500 leading-relaxed w-full ${isRTL ? "text-right" : "text-left"}`}>{t('catalogs_info.shopping_share_desc')}</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

             {/* Growth Section: Shipping, Samples & Sharing */}
             <section className="py-10 bg-white px-4">
                <div className="container max-w-7xl mx-auto">
                    <div className="text-center mb-8">
                        <h2 className="text-5xl font-black mb-4">{t('catalogs_info.growth_title')}</h2>
                        <p className="text-gray-500 text-lg max-w-2xl mx-auto font-medium">{t('catalogs_info.growth_subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Shipping */}
                        <motion.div 
                            className="bg-[#fffcf8] p-10 rounded-[3.5rem] border border-orange-50 relative overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-500"
                            initial={{ y: 30, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                        >
                            <div className="mb-8 relative z-10">
                                <h3 className="text-2xl font-black mb-4">{t('catalogs_info.growth_shipping_title')}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{t('catalogs_info.growth_shipping_desc')}</p>
                            </div>
                            <div className="rounded-2xl overflow-hidden shadow-2xl border border-white group-hover:scale-[1.03] transition-transform duration-700">
                                <img src="/info-page/media__1773582608466.png" alt="Shipping" className="w-full" />
                            </div>
                        </motion.div>

                        {/* Samples */}
                        <motion.div 
                            className="bg-[#fffcf8] p-10 rounded-[3.5rem] border border-orange-50 relative overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-500"
                            initial={{ y: 30, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="mb-8 relative z-10">
                                <h3 className="text-2xl font-black mb-4">{t('catalogs_info.growth_samples_title')}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{t('catalogs_info.growth_samples_desc')}</p>
                            </div>
                            <div className="rounded-2xl overflow-hidden shadow-2xl border border-white group-hover:scale-[1.03] transition-transform duration-700">
                                <img src="/info-page/media__1773586516781.png" alt="Samples" className="w-full" />
                            </div>
                        </motion.div>


                    </div>
                </div>
            </section>

            {/* Showcase Section: Orders Table */}
            <section className="py-8 bg-gray-50 border-y border-gray-100 px-4">
                <div className="container max-w-7xl mx-auto">
                    <div className="bg-yellow-400 rounded-[3rem] p-10 md:p-12 shadow-2xl border border-yellow-500/20 flex flex-col lg:flex-row items-center gap-10">
                        <div className={`flex-1 ${isRTL ? "text-right" : "text-left"} flex flex-col`}>
                            <h2 className="text-4xl font-black mb-8 leading-tight text-black order-1">{t('catalogs_info.orders_title')}</h2>
                            
                            {/* Mobile Image: Only visible on small screens, positioned below title */}
                            <motion.div 
                                className="lg:hidden w-full shadow-xl rounded-2xl overflow-hidden border border-gray-200 mb-8 order-2"
                                whileHover={{ scale: 1.01 }}
                                transition={{ duration: 0.4 }}
                            >
                                <img src="/info-page/media__1773582785243.png" alt="Orders Mobile" className="w-full" />
                            </motion.div>

                            <p className="text-black/70 text-lg mb-10 leading-relaxed font-medium order-3">
                                {t('catalogs_info.orders_desc')}
                            </p>
                            <div className="flex items-center gap-4 justify-center flex-wrap w-full order-4">
                                <span className="px-4 py-2 bg-blue-500/10 text-blue-700 rounded-full text-xs font-bold">{t('catalogs_info.orders_tag_shipping')}</span>
                                <span className="px-4 py-2 bg-green-500/10 text-green-700 rounded-full text-xs font-bold">{t('catalogs_info.orders_tag_status')}</span>
                                <span className="px-4 py-2 bg-orange-500/10 text-orange-700 rounded-full text-xs font-bold">{t('catalogs_info.orders_tag_email')}</span>
                            </div>
                        </div>
                        {/* Desktop Image: Hidden on mobile, original position */}
                        <motion.div 
                            className="hidden lg:block flex-[1.5] w-full shadow-2xl rounded-3xl overflow-hidden border border-gray-200"
                            whileHover={{ scale: 1.01 }}
                            transition={{ duration: 0.4 }}
                        >
                            <img src="/info-page/media__1773582785243.png" alt="Orders Admin" className="w-full" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* How It Works - Elegant Centered Layout */}
            <section className="py-10 bg-gray-50 px-4">
                <div className="container max-w-4xl mx-auto">
                    <div className="text-center mb-6">
                        <span className="text-yellow-500 font-bold uppercase tracking-widest text-xs">{t('catalogs_info.how_works_badge')}</span>
                        <h2 className="text-5xl font-black mt-4">{t('catalogs_info.how_works_title')}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                            { num: "01", title: t('catalogs_info.how_works_step1_title'), desc: t('catalogs_info.how_works_step1_desc') },
                            { num: "02", title: t('catalogs_info.how_works_step2_title'), desc: t('catalogs_info.how_works_step2_desc') },
                            { num: "03", title: t('catalogs_info.how_works_step3_title'), desc: t('catalogs_info.how_works_step3_desc') },
                            { num: "04", title: t('catalogs_info.how_works_step4_title'), desc: t('catalogs_info.how_works_step4_desc') }
                            ].map((step, idx) => (
                            <motion.div 
                                key={idx}
                                className="p-6 md:p-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group text-center flex flex-col items-center gap-4"
                                initial={{ y: 30, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <span className="text-6xl font-black text-gray-100 group-hover:text-yellow-400/20 transition-colors leading-none">{step.num}</span>
                                <div className="flex-1">
                                    <h4 className="text-2xl font-black mb-3">{step.title}</h4>
                                    <p className="text-gray-500 text-lg leading-relaxed">{step.desc}</p>
                                </div>
                            </motion.div>
                            ))}
                    </div>
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="py-8 px-4 bg-white">
                <div className="container max-w-4xl mx-auto rounded-[2.5rem] bg-black text-white p-12 md:p-16 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/20 blur-[100px] rounded-full" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full" />
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative z-10"
                    >
                        <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight">{t('catalogs_info.cta_title')}</h2>
                        <p className="text-gray-400 mb-6 text-lg font-medium">{t('catalogs_info.cta_subtitle')}</p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            {userId ? (
                                <Link href="/my-catalogs" className="w-full sm:w-auto px-12 py-5 bg-yellow-400 text-black rounded-full font-black text-xl hover:scale-105 transition-transform shadow-[0_25px_50px_-12px_rgba(253,224,71,0.25)]">
                                    {t('catalogs_info.cta_button')}
                                </Link>
                            ) : (
                                <Link href="/sign-up" className="w-full sm:w-auto px-12 py-5 bg-yellow-400 text-black rounded-full font-black text-xl hover:scale-105 transition-transform shadow-[0_25px_50px_-12px_rgba(253,224,71,0.25)]">
                                    {t('catalogs_info.cta_button')}
                                </Link>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
