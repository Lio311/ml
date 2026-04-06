"use client";

import React from 'react';
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
        <div className="w-full py-2 mb-0 px-4 md:px-6 relative overflow-visible">
            {/* The Unified Grid (Handles centering and spacing in 1 go) */}
            <div className="grid grid-cols-[auto,1fr,auto,1fr,auto,1fr,auto] w-full items-center h-8 md:h-12 relative z-10">
                {statusSteps.map((step, index) => {
                    const isCompleted = index < activeIndex;
                    const isActive = index === activeIndex;
                    const isPending = index > activeIndex;
                    const Icon = step.icon;
                    const isLast = index === statusSteps.length - 1;

                    return (
                        <React.Fragment key={step.id}>
                            {/* Circle Column */}
                            <div className="flex flex-col items-center relative z-20">
                                <motion.div
                                    initial={false}
                                    animate={{ 
                                        scale: isActive ? 1.15 : 1,
                                        backgroundColor: isCompleted || isActive ? (isActive ? '#000' : '#111') : '#fff',
                                        color: isCompleted || isActive ? '#fff' : '#999',
                                        borderColor: isCompleted || isActive ? '#000' : '#e5e7eb'
                                    }}
                                    className={cn(
                                        "w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center border hover:border-2 transition-all duration-300 shadow-sm z-20 shrink-0",
                                        isActive && "ring-4 ring-black/5 dark:ring-white/10 shadow-lg border-2",
                                        isCompleted && "bg-black dark:bg-white border-black dark:border-white",
                                        isPending && "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800"
                                    )}
                                >
                                    <Icon className={cn("w-4 h-4 md:w-6 md:h-6", isActive && "animate-pulse")} />
                                </motion.div>
                            </div>

                            {/* Line Column (Between circles) */}
                            {!isLast && (
                                <div className="h-0.5 md:h-1 bg-gray-100 dark:bg-zinc-800 relative z-0 min-w-[12px] -mx-4 md:-mx-6 overflow-hidden">
                                    <motion.div 
                                        initial={false}
                                        animate={{ 
                                            width: activeIndex > index ? '100%' : '0%',
                                            opacity: activeIndex > index ? 1 : 0
                                        }}
                                        transition={{ duration: 0.8, ease: "easeInOut" }}
                                        className={cn(
                                            "absolute top-0 h-full bg-black dark:bg-white rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]",
                                            locale === 'he' ? "right-0" : "left-0",
                                            activeIndex > index ? "visible" : "invisible"
                                        )}
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Labels Grid (Matches circle positioning) */}
            <div className="grid grid-cols-[auto,1fr,auto,1fr,auto,1fr,auto] w-full mt-3 relative z-10">
                {statusSteps.map((step, index) => {
                    const isActive = index === activeIndex;
                    const isLast = index === statusSteps.length - 1;

                    return (
                        <React.Fragment key={`label-${step.id}`}>
                            {/* Circle Label Column */}
                            <div className="flex flex-col items-center w-8 md:w-12 overflow-visible">
                                <div className="min-h-[44px] flex flex-col items-center w-24 md:w-32 -mx-8 md:-mx-10 text-center overflow-visible">
                                    <span className={cn(
                                        "text-[10px] md:text-sm font-bold transition-colors duration-300 leading-tight",
                                        isActive ? "text-black dark:text-white" : "text-gray-400 dark:text-zinc-500"
                                    )}>
                                        {step.label}
                                    </span>
                                    {isActive && (
                                        <motion.span 
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-[8px] md:text-[11px] text-gray-500 font-medium dark:text-zinc-400 mt-1.5 leading-tight block w-full px-1"
                                        >
                                            {step.description}
                                        </motion.span>
                                    )}
                                </div>
                            </div>
                            {/* Empty spacer for line column */}
                            {!isLast && <div />}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}
