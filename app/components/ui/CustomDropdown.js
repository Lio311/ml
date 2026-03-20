"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

/**
 * CustomDropdown with React Portal to avoid clipping in overflow containers.
 */
export default function CustomDropdown({
    options = [],
    value,
    onChange,
    className = "",
    placeholder = "Select...",
    fullWidth = false,
    variant = "standard"
}) {
    const { dir } = useLanguage();
    const isRTL = dir === 'rtl';
    const [isOpen, setIsOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState({});
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const selectedOption = options.find(opt => opt.value === value);

    const updateMenuPosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const menuHeight = menuRef.current?.offsetHeight || 250;
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUpwards = spaceBelow < menuHeight + 20 && rect.top > menuHeight;

        const style = {
            position: "fixed",
            top: openUpwards ? rect.top - menuHeight - 6 : rect.bottom + 6,
            minWidth: Math.max(rect.width, 180),
            zIndex: 9999,
        };

        if (isRTL) {
            style.right = window.innerWidth - rect.right;
        } else {
            style.left = rect.left;
        }

        setMenuStyle(style);
    }, [isRTL]);

    const handleOpen = () => {
        updateMenuPosition();
        setIsOpen(v => !v);
    };

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target) &&
                menuRef.current && !menuRef.current.contains(e.target)
            ) {
                setIsOpen(false);
            }
        };
        const handleScroll = () => {
            updateMenuPosition();
        };
        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("resize", updateMenuPosition);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, true);
            window.removeEventListener("resize", updateMenuPosition);
        };
    }, [isOpen, updateMenuPosition]);

    const getTriggerStyles = () => {
        if (variant === "status" && selectedOption?.color) return selectedOption.color;
        if (variant === "minimal") return "bg-transparent border-none text-gray-700 hover:text-black";
        return "bg-white border-gray-200 text-gray-800 hover:border-gray-400";
    };

    const menu = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    style={menuStyle}
                    className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                    dir={dir}
                >
                    <div className="py-2 max-h-[300px] overflow-y-auto">
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
                                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div
            ref={triggerRef}
            className={`relative inline-block ${isRTL ? 'text-right' : 'text-left'} ${fullWidth ? 'w-full' : ''}`}
            dir={dir}
        >
            <button
                type="button"
                onClick={handleOpen}
                className={`flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm border transition-all shadow-sm ${getTriggerStyles()} ${fullWidth ? 'w-full' : ''} ${className} active:scale-[0.98] outline-none`}
            >
                {isRTL ? (
                    <>
                        <div className="flex items-center gap-2 truncate">
                            {selectedOption?.icon}
                            <span className="truncate">{selectedOption?.label || placeholder}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-2 truncate">
                            {selectedOption?.icon}
                            <span className="truncate">{selectedOption?.label || placeholder}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                    </>
                )}
            </button>

            {typeof document !== "undefined" && createPortal(menu, document.body)}
        </div>
    );
}
