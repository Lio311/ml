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
        <div className="w-full py-2 mb-0 px-2 md:px-4 relative overflow-visible">
            {/* The 4-Column Responsive Grid */}
            <div className="grid grid-cols-4 w-full relative z-10">
                {statusSteps.map((step, index) => {
                    const isCompleted = index < activeIndex;
                    const isActive = index === activeIndex;
                    const isPending = index > activeIndex;
                    const isFirst = index === 0;
                    const isLast = index === statusSteps.length - 1;
                    const Icon = step.icon;

                    return (
                        <div key={step.id} className="relative flex flex-col items-center">
                            {/* 1. Circle & Line Segment Row */}
                            <div className="h-8 md:h-12 w-full flex items-center justify-center relative">
                                
                                {/* Right Segment (Incoming from prev in RTL/Hebrew) */}
                                {!isFirst && (
                                    <div className="absolute right-0 w-1/2 h-0.5 md:h-1 bg-gray-100 dark:bg-zinc-800 z-0">
                                        <motion.div 
                                            initial={false}
                                            animate={{ 
                                                width: activeIndex >= index ? '100%' : '0%',
                                                opacity: activeIndex >= index ? 1 : 0
                                            }}
                                            className={cn(
                                                "absolute top-0 right-0 h-full bg-black dark:bg-white overflow-hidden",
                                                activeIndex >= index ? "visible" : "invisible"
                                            )}
                                        />
                                    </div>
                                )}

                                {/* Left Segment (Outgoing to next in RTL/Hebrew) */}
                                {!isLast && (
                                    <div className="absolute left-0 w-1/2 h-0.5 md:h-1 bg-gray-100 dark:bg-zinc-800 z-0">
                                        <motion.div 
                                            initial={false}
                                            animate={{ 
                                                width: activeIndex > index ? '100%' : '0%',
                                                opacity: activeIndex > index ? 1 : 0
                                            }}
                                            className={cn(
                                                "absolute top-0 right-0 h-full bg-black dark:bg-white overflow-hidden",
                                                activeIndex > index ? "visible" : "invisible"
                                            )}
                                        />
                                    </div>
                                )}

                                {/* The Circle */}
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

                            {/* 2. Labels Area */}
                            <div className="mt-3 text-center min-w-0 w-full px-1">
                                <div className="min-h-[44px] flex flex-col items-center w-24 md:w-32 -mx-8 md:-mx-10 overflow-visible">
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
                                            className="text-[8px] md:text-[11px] text-gray-500 font-medium dark:text-zinc-400 mt-1.5 leading-tight block w-full"
                                        >
                                            {step.description}
                                        </motion.span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
