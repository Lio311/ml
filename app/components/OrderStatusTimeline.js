"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Package, Phone, Truck, CheckCircle, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const statusSteps = [
    { id: 'pending', label: 'הוזמן', icon: Package, description: 'הזמנתך התקבלה במערכת' },
    { id: 'processing', label: 'בטיפול', icon: Phone, description: 'יצירת קשר ותיאום' },
    { id: 'shipped', label: 'נשלח', icon: Truck, description: 'המשלוח בדרך אליך' },
    { id: 'completed', label: 'הושלם', icon: CheckCircle, description: 'ההזמנה נמסרה' },
];

export default function OrderStatusTimeline({ status }) {
    if (status === 'cancelled') {
        return (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3 text-red-700 mb-6">
                <XCircle className="w-6 h-6" />
                <span className="font-bold">ההזמנה בוטלה</span>
            </div>
        );
    }

    const activeIndex = statusSteps.findIndex(step => step.id === status);
    const progressPercentage = activeIndex === -1 ? 0 : (activeIndex / (statusSteps.length - 1)) * 100;

    return (
        <div className="w-full py-8 px-2 mb-8">
            <div className="relative">
                {/* Line Container (Centered on circles) */}
                <div className="absolute top-6 right-6 left-6 -translate-y-1/2 h-1">
                    {/* Background Line */}
                    <div className="w-full h-full bg-gray-100 dark:bg-zinc-800 rounded-full" />
                    
                    {/* Progress Line */}
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="absolute top-0 right-0 h-full bg-black dark:bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                    />
                </div>

                {/* Steps */}
                <div className="relative flex justify-between items-center w-full">
                    {statusSteps.map((step, index) => {
                        const isCompleted = index < activeIndex;
                        const isActive = index === activeIndex;
                        const isPending = index > activeIndex;
                        const Icon = step.icon;

                        return (
                            <div key={step.id} className="flex flex-col items-center relative z-10 group">
                                <motion.div
                                    initial={false}
                                    animate={{ 
                                        scale: isActive ? 1.2 : 1,
                                        backgroundColor: isCompleted || isActive ? (isActive ? '#000' : '#111') : '#fff',
                                        color: isCompleted || isActive ? '#fff' : '#999',
                                        borderColor: isCompleted || isActive ? '#000' : '#e5e7eb'
                                    }}
                                    className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm",
                                        isActive && "ring-4 ring-black/5 dark:ring-white/10 shadow-lg",
                                        isCompleted && "bg-black dark:bg-white border-black dark:border-white",
                                        isPending && "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800"
                                    )}
                                >
                                    <Icon className={cn("w-6 h-6", isActive && "animate-pulse")} />
                                </motion.div>
                                
                                <div className="mt-4 flex flex-col items-center text-center">
                                    <span className={cn(
                                        "text-sm font-bold transition-colors duration-300",
                                        isActive ? "text-black dark:text-white" : "text-gray-400 dark:text-zinc-500"
                                    )}>
                                        {step.label}
                                    </span>
                                    {isActive && (
                                        <motion.span 
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-[10px] text-gray-500 dark:text-zinc-400 mt-1 absolute -bottom-6 w-max"
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
        </div>
    );
}
