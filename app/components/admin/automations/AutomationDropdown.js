"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function AutomationDropdown({ value, onChange, options, placeholder = "בחר אפשרות..." }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full text-right" dir="rtl" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-1 py-1 text-sm font-bold text-gray-900 bg-transparent rounded-lg hover:bg-gray-50/50 transition-all outline-none"
            >
                <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 left-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[100] overflow-hidden min-w-[180px] animate-in fade-in zoom-in duration-150">
                    <div className="p-1.5 space-y-1">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`flex items-center justify-between w-full px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                                    value === option.value 
                                    ? 'bg-gray-900 text-white shadow-lg' 
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <span>{option.label}</span>
                                {value === option.value && <Check size={14} className="text-white" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
