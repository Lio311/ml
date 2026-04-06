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
        <div className="w-full py-2 px-1 md:px-10 mb-0 overflow-x-hidden">
            <div className="relative">
                {/* Line Container (Centered on circles) */}
                <div className="absolute top-5 md:top-6 right-[12.5%] left-[12.5%] -translate-y-1/2 h-1">
                    {/* Background Line */}
                    <div className="w-full h-full bg-gray-100 dark:bg-zinc-800" />
                    
                    {/* Progress Line */}
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn(
                            "absolute top-0 h-full bg-black dark:bg-white shadow-[0_0_10px_rgba(0,0,0,0.1)]",
                            locale === 'he' ? 'right-0' : 'left-0'
                        )}
                    />
                </div>

                {/* Steps */}
                <div className="relative flex justify-between items-start w-full">
                    {statusSteps.map((step, index) => {
                        const isCompleted = index < activeIndex;
                        const isActive = index === activeIndex;
                        const isPending = index > activeIndex;
                        const Icon = step.icon;

                        return (
                            <div key={step.id} className="flex flex-col items-center relative z-10 group flex-1 w-0">
                                <motion.div
                                    initial={false}
                                    animate={{ 
                                        scale: isActive ? 1.15 : 1,
                                        backgroundColor: isCompleted || isActive ? (isActive ? '#000' : '#111') : '#fff',
                                        color: isCompleted || isActive ? '#fff' : '#999',
                                        borderColor: isCompleted || isActive ? '#000' : '#e5e7eb'
                                    }}
                                    className={cn(
                                        "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border hover:border-2 transition-all duration-300 shadow-sm",
                                        isActive && "ring-4 ring-black/5 dark:ring-white/10 shadow-lg border-2",
                                        isCompleted && "bg-black dark:bg-white border-black dark:border-white",
                                        isPending && "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800"
                                    )}
                                >
                                    <Icon className={cn("w-5 h-5 md:w-6 md:h-6", isActive && "animate-pulse")} />
                                </motion.div>
                                
                                <div className="mt-2 flex flex-col items-center text-center min-h-[48px]">
                                    <span className={cn(
                                        "text-[11px] md:text-sm font-bold transition-colors duration-300 leading-tight",
                                        isActive ? "text-black dark:text-white" : "text-gray-400 dark:text-zinc-500"
                                    )}>
                                        {step.label}
                                    </span>
                                    {isActive && (
                                        <motion.span 
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-[9px] md:text-[10px] text-gray-500 dark:text-zinc-400 mt-1 max-w-[90px] md:max-w-[120px] leading-tight whitespace-normal text-center"
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
