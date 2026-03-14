"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

/**
 * CustomDropdown - A reusable, modern dropdown component.
 * @param {Object} props
 * @param {Array} props.options - Array of { value, label, icon, color }
 * @param {any} props.value - Selected value
 * @param {Function} props.onChange - Selection callback
 * @param {string} props.className - Custom trigger class
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.fullWidth - If true, occupies 100% width
 * @param {string} props.variant - 'status', 'standard', 'minimal'
 */
export default function CustomDropdown({ 
    options = [], 
    value, 
    onChange, 
    className = "", 
    placeholder = "בחר...",
    fullWidth = false,
    variant = "standard"
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getTriggerStyles = () => {
        if (variant === "status" && selectedOption?.color) {
            return selectedOption.color;
        }
        if (variant === "minimal") {
            return "bg-transparent border-none text-gray-700 hover:text-black";
        }
        return "bg-white border-gray-200 text-gray-800 hover:border-black";
    };

    return (
        <div 
            className={`relative inline-block text-right ${fullWidth ? 'w-full' : ''}`} 
            ref={dropdownRef}
            dir="rtl"
        >
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm border transition-all shadow-sm ${getTriggerStyles()} ${fullWidth ? 'w-full' : ''} ${className} active:scale-[0.98] outline-none`}
            >
                <div className="flex items-center gap-2 truncate">
                    {selectedOption?.icon}
                    <span className="truncate">{selectedOption?.label || placeholder}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute z-[100] mt-2 w-full min-w-[180px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                        style={{ right: 0 }}
                    >
                        <div className="py-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {options.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-colors hover:bg-gray-50 ${value === opt.value ? 'text-black bg-gray-50' : 'text-gray-500 hover:text-black'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        {opt.icon}
                                        <span>{opt.label}</span>
                                    </div>
                                    {value === opt.value && (
                                        <Check className="w-4 h-4 text-emerald-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
