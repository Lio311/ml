"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { 
    format, 
    addMonths, 
    subMonths, 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    isSameMonth, 
    isSameDay, 
    eachDayOfInterval,
    setHours,
    setMinutes,
    isToday,
    parseISO,
    isValid
} from "date-fns";
import { he, enUS } from "date-fns/locale";

/**
 * ModernDateTimePicker - A premium, animated Date and Time picker.
 * Supports Hebrew/English and Glassmorphism.
 */
export default function ModernDateTimePicker({
    value,
    onChange,
    placeholder = "Select date & time...",
    locale = "he",
    className = ""
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const [mode, setMode] = useState("date"); // "date" or "time"
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const [menuStyle, setMenuStyle] = useState({});

    const isRTL = locale === "he";
    const dateLocale = locale === "he" ? he : enUS;

    // Parse value safely
    const selectedDate = useMemo(() => {
        if (!value) return null;
        const d = typeof value === 'string' ? parseISO(value) : new Date(value);
        return isValid(d) ? d : null;
    }, [value]);

    const handleToggle = () => {
        if (!isOpen) {
            if (selectedDate) setViewDate(selectedDate);
            setMode("date");
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (triggerRef.current && !triggerRef.current.contains(e.target) &&
                menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        window.addEventListener("mousedown", handleClickOutside);
        return () => {
            window.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Calendar Generation Logic
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = locale === "he" 
        ? ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"] 
        : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const handlePrevMonth = (e) => {
        e.stopPropagation();
        setViewDate(subMonths(viewDate, 1));
    };
    const handleNextMonth = (e) => {
        e.stopPropagation();
        setViewDate(addMonths(viewDate, 1));
    };

    const handleDateSelect = (date) => {
        let newDate = date;
        if (selectedDate) {
            newDate = setHours(newDate, selectedDate.getHours());
            newDate = setMinutes(newDate, selectedDate.getMinutes());
        }
        onChange(newDate.toISOString());
        setMode("time");
    };

    const handleTimeChange = (type, val) => {
        const baseDate = selectedDate || new Date();
        let newDate;
        if (type === 'hour') newDate = setHours(baseDate, val);
        else newDate = setMinutes(baseDate, val);
        onChange(newDate.toISOString());
    };

    const menu = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className={`absolute z-[9999] top-[calc(100%+8px)] w-[320px] bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 overflow-hidden flex flex-col p-4 ${isRTL ? 'right-0' : 'left-0'}`}
                    dir={isRTL ? "rtl" : "ltr"}
                >
                    {/* Header Controls */}
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-1">
                            <button 
                                type="button"
                                onClick={() => setMode("date")}
                                className={`p-2 rounded-xl transition-all ${mode === 'date' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'text-gray-400 hover:bg-gray-100'}`}
                            >
                                <CalendarIcon size={16} />
                            </button>
                            <button 
                                type="button"
                                onClick={() => setMode("time")}
                                className={`p-2 rounded-xl transition-all ${mode === 'time' ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'text-gray-400 hover:bg-gray-100'}`}
                            >
                                <Clock size={16} />
                            </button>
                        </div>
                        <button 
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {mode === 'date' ? (
                        <div className="flex flex-col">
                            {/* Month Navigation */}
                            <div className="flex items-center justify-between mb-4 bg-gray-50/50 p-2 rounded-2xl">
                                <button type="button" onClick={handlePrevMonth} className="p-1.5 hover:bg-white rounded-lg shadow-sm transition-all"><ChevronLeft size={14} className={isRTL ? "rotate-180" : ""} /></button>
                                <span className="font-black text-xs uppercase tracking-widest text-gray-800">
                                    {format(viewDate, "MMMM yyyy", { locale: dateLocale })}
                                </span>
                                <button type="button" onClick={handleNextMonth} className="p-1.5 hover:bg-white rounded-lg shadow-sm transition-all"><ChevronRight size={14} className={isRTL ? "rotate-180" : ""} /></button>
                            </div>

                            {/* Calendar Days */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {weekDays.map(day => (
                                    <div key={day} className="text-[9px] font-black text-gray-400 text-center uppercase py-1">{day}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {calendarDays.map((day, i) => {
                                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                                    const isCurrentMonth = isSameMonth(day, monthStart);
                                    const isTodayDay = isToday(day);

                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => handleDateSelect(day)}
                                            className={`
                                                aspect-square flex items-center justify-center text-[11px] font-bold rounded-xl transition-all
                                                ${isSelected ? 'bg-green-600 text-white shadow-lg shadow-green-200 scale-110' : 
                                                  isCurrentMonth ? 'text-gray-700 hover:bg-green-50 hover:text-green-600' : 'text-gray-300'}
                                                ${isTodayDay && !isSelected ? 'ring-1 ring-green-200 ring-offset-1' : ''}
                                            `}
                                        >
                                            {format(day, "d")}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Today Helper */}
                            <button 
                                type="button"
                                onClick={() => { setViewDate(new Date()); handleDateSelect(new Date()); }}
                                className="mt-4 text-[10px] font-black uppercase text-green-600 bg-green-50/50 py-2 rounded-xl hover:bg-green-50 transition-colors"
                            >
                                {isRTL ? "חזור להיום" : "Back to Today"}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col h-[280px]">
                            <div className="flex-1 flex gap-4 p-2">
                                {/* Hours */}
                                <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar scroll-smooth">
                                    <div className="text-[9px] font-black text-gray-400 mb-2 sticky top-0 bg-white/50 backdrop-blur-sm z-10 py-1">{isRTL ? "שעות" : "Hours"}</div>
                                    {Array.from({ length: 24 }).map((_, h) => {
                                        const isActive = selectedDate?.getHours() === h;
                                        return (
                                            <button 
                                                key={h}
                                                type="button"
                                                onClick={() => handleTimeChange('hour', h)}
                                                className={`py-2 text-xs font-bold rounded-lg mb-1 transition-all ${isActive ? 'bg-green-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
                                            >
                                                {h.toString().padStart(2, '0')}
                                            </button>
                                        );
                                    })}
                                </div>
                                {/* Minutes */}
                                <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar scroll-smooth">
                                    <div className="text-[9px] font-black text-gray-400 mb-2 sticky top-0 bg-white/50 backdrop-blur-sm z-10 py-1">{isRTL ? "דקות" : "Minutes"}</div>
                                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => {
                                        const isActive = selectedDate?.getMinutes() === m;
                                        return (
                                            <button 
                                                key={m}
                                                type="button"
                                                onClick={() => handleTimeChange('min', m)}
                                                className={`py-2 text-xs font-bold rounded-lg mb-1 transition-all ${isActive ? 'bg-green-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
                                            >
                                                {m.toString().padStart(2, '0')}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="mt-4 bg-black text-white text-[10px] font-black uppercase py-3 rounded-2xl hover:bg-gray-800 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Check size={14} /> {isRTL ? "אישור" : "Confirm"}
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className={`relative ${className} w-full`} dir={isRTL ? "rtl" : "ltr"}>
            <button
                type="button"
                ref={triggerRef}
                onClick={handleToggle}
                className={`
                    w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border-2 transition-all group
                    ${isOpen ? 'border-green-600 bg-white shadow-lg' : 'border-gray-100 bg-white hover:border-gray-200'}
                    ${className.includes('h-') ? className : ''}
                `}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-xl transition-all shrink-0 ${selectedDate ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                        {mode === 'time' && isOpen ? <Clock size={16} /> : <CalendarIcon size={16} />}
                    </div>
                    <div className="flex flex-col items-start leading-tight min-w-0 overflow-hidden">
                        <span className={`text-[11px] font-bold transition-all truncate max-w-full text-right ${selectedDate ? 'text-green-700' : 'text-gray-400'}`}>
                            {selectedDate ? format(selectedDate, "dd/MM/yyyy") : placeholder}
                        </span>
                        {selectedDate && (
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-0.5 truncate max-w-full">
                                {format(selectedDate, "HH:mm")}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pl-1">
                    <ChevronDownIcon size={14} className={`text-gray-300 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {menu}

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}

function ChevronDownIcon({ size, className }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
}
