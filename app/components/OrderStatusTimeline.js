"use client";

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { motion } from "framer-motion";
import { Package, Phone, Truck, MapPin, CheckCircle, XCircle } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function OrderStatusTimeline({ status, deliveryMethod }) {
    const { t, locale } = useLanguage();

    const statusSteps = [
        { id: 'pending', label: t('orders.status.pending'), icon: Package, description: t('orders.status.pending_desc') },
        { id: 'processing', label: t('orders.status.processing'), icon: Phone, description: t('orders.status.processing_desc') },
        { 
            ids: ['shipped', 'ready_for_pickup'], 
            label: (status === 'ready_for_pickup' || (deliveryMethod === 'self_pickup' && status !== 'shipped')) 
                    ? t('orders.status.ready_for_pickup') 
                    : t('orders.status.shipped'),
            icon: (status === 'ready_for_pickup' || (deliveryMethod === 'self_pickup' && status !== 'shipped')) 
                    ? MapPin 
                    : Truck,
            description: (status === 'ready_for_pickup' || (deliveryMethod === 'self_pickup' && status !== 'shipped'))
                    ? t('orders.status.ready_for_pickup_desc')
                    : t('orders.status.shipped_desc')
        },
        { id: 'completed', label: t('orders.status.completed'), icon: CheckCircle, description: t('orders.status.completed_desc') },
    ];

    if (status === 'cancelled' || status === 'בוטל') {
        return (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3 text-red-700 mb-6">
                <XCircle className="w-6 h-6" />
                <span className="font-bold">{t('orders.status.cancelled')}</span>
            </div>
        );
    }

    // Robust search for activeIndex
    const activeIndex = statusSteps.findIndex(step => {
        // Match by ID
        if (step.id === status) return true;
        // Match by IDs array (the flexible slot)
        if (step.ids && step.ids.includes(status)) return true;
        // Fallback: match by translated label (in case status in DB is Hebrew)
        if (step.label === status) return true;
        
        // Final fallback for common manual entry issues
        if (status === 'ready_for_pickup' && step.ids?.includes('ready_for_pickup')) return true;
        if ((status === 'completed' || status === 'הושלם') && step.id === 'completed') return true;
        if ((status === 'shipped' || status === 'נשלח') && step.ids?.includes('shipped')) return true;
        if ((status === 'processing' || status === 'בטיפול') && step.id === 'processing') return true;
        if ((status === 'pending' || status === 'ממתין') && step.id === 'pending') return true;

        return false;
    });

    // Grid columns: number of steps + (number of steps - 1) spacers
    const gridCols = `grid-cols-[auto,1fr,auto,1fr,auto,1fr,auto]`;

    return (
        <div className="w-full py-2 mb-0 px-4 md:px-6 relative overflow-visible">
            {/* The Unified Grid (Handles centering and spacing in 1 go) */}
            <div className={cn("grid w-full items-center h-8 md:h-12 relative z-10", gridCols)}>
                {statusSteps.map((step, index) => {
                    const isCompleted = index < activeIndex;
                    const isActive = index === activeIndex;
                    const isPending = index > activeIndex;
                    const Icon = step.icon;
                    const isLast = index === statusSteps.length - 1;

                    return (
                        <React.Fragment key={step.id}>
                            {/* Circle Column */}
                            <div className="flex flex-col items-center">
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
                                <div className="h-0.5 md:h-1 bg-gray-100 dark:bg-zinc-800 relative z-0 min-w-[12px] -mx-4 md:-mx-6">
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
            <div className={cn("grid w-full mt-3 relative z-10", gridCols)}>
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
                                        isActive ? "text-black" : "text-gray-400 dark:text-zinc-500"
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
