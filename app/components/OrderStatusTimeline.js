"use client";

import { useLanguage } from '../context/LanguageContext';
import { motion } from "framer-motion";
import { Package, Phone, Truck, CheckCircle, XCircle } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function OrderStatusTimeline({ status }) {
    const { t, locale } = useLanguage();

    const statusSteps = [
        { id: 'pending', label: t('orders.status.pending'), icon: Package, description: t('orders.status.pending_desc') },
        { id: 'processing', label: t('orders.status.processing'), icon: Phone, description: t('orders.status.processing_desc') },
        { id: 'shipped', label: t('orders.status.shipped'), icon: Truck, description: t('orders.status.shipped_desc') },
        { id: 'completed', label: t('orders.status.completed'), icon: CheckCircle, description: t('orders.status.completed_desc') },
    ];
    if (status === 'cancelled') {
        return (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3 text-red-700 mb-6">
                <XCircle className="w-6 h-6" />
                <span className="font-bold">{t('orders.status.cancelled')}</span>
            </div>
        );
    }

    const activeIndex = statusSteps.findIndex(step => step.id === status);
    const progressPercentage = activeIndex === -1 ? 0 : (activeIndex / (statusSteps.length - 1)) * 100;

    return (
        <div className="w-full py-2 mb-0 overflow-x-hidden relative px-5">
            {/* The Row Container (Holds both line and circles) */}
            <div className="relative h-8 md:h-12 w-full flex items-center">
                {/* 1. The Line Layer (Background and Progress) */}
                <div className="absolute inset-0 flex items-center z-0 px-[16px] md:px-[24px]">
                    <div className="relative w-full h-0.5 md:h-1">
                        {/* Gray Background */}
                        <div className="w-full h-full bg-gray-100 dark:bg-zinc-800 rounded-full" />
                        
                        {/* Active Progress */}
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercentage}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={cn(
                                "absolute top-0 h-full bg-black dark:bg-white rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)]",
                                locale === 'he' ? "right-0" : "left-0"
                            )}
                        />
                    </div>
                </div>

                {/* 2. The Circles Layer (Flex for perfect spacing) */}
                <div className="absolute inset-0 flex justify-between items-center z-10 w-full">
                    {statusSteps.map((step, index) => {
                        const isCompleted = index < activeIndex;
                        const isActive = index === activeIndex;
                        const isPending = index > activeIndex;
                        const Icon = step.icon;

                        return (
                            <div key={step.id} className="relative flex flex-col items-center">
                                <motion.div
                                    initial={false}
                                    animate={{ 
                                        scale: isActive ? 1.15 : 1,
                                        backgroundColor: isCompleted || isActive ? (isActive ? '#000' : '#111') : '#fff',
                                        color: isCompleted || isActive ? '#fff' : '#999',
                                        borderColor: isCompleted || isActive ? '#000' : '#e5e7eb'
                                    }}
                                    className={cn(
                                        "w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center border hover:border-2 transition-all duration-300 shadow-sm",
                                        isActive && "ring-4 ring-black/5 dark:ring-white/10 shadow-lg border-2",
                                        isCompleted && "bg-black dark:bg-white border-black dark:border-white",
                                        isPending && "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800"
                                    )}
                                >
                                    <Icon className={cn("w-4 h-4 md:w-6 md:h-6", isActive && "animate-pulse")} />
                                </motion.div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 3. The Labels Layer (Below the Row) */}
            <div className="flex justify-between w-full mt-2 relative z-10">
                {statusSteps.map((step, index) => {
                    const isActive = index === activeIndex;
                    return (
                        <div key={step.id} className="flex flex-col items-center text-center w-8 md:w-12 overflow-visible">
                            <div className="min-h-[40px] md:min-h-[48px] flex flex-col items-center w-20 md:w-32 -mx-6 md:-mx-10 overflow-visible">
                                <span className={cn(
                                    "text-[9px] md:text-sm font-bold transition-colors duration-300 leading-tight block",
                                    isActive ? "text-black dark:text-white" : "text-gray-400 dark:text-zinc-500"
                                )}>
                                    {step.label}
                                </span>
                                {isActive && (
                                    <motion.span 
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-[8px] md:text-[10px] text-gray-500 dark:text-zinc-400 mt-1 leading-tight max-w-full block"
                                    >
                                        {step.description}
                                    </motion.span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
