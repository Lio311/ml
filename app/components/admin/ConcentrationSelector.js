"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Droplet } from "lucide-react";

export default function ConcentrationSelector({ value, onChange, options = [] }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter options based on current value
    const filteredOptions = options.filter(opt => 
        opt.toLowerCase().includes((value || '').toLowerCase())
    );

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <div className="relative">
                <input
                    value={value || ''}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    className="border-2 border-gray-100 rounded-xl p-2 w-full bg-white focus:border-black outline-none transition-colors text-sm font-bold"
                    placeholder="למשל: Eau de Parfum..."
                    autoComplete="off"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-gray-400" />
                </div>
            </div>

            {isOpen && filteredOptions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {filteredOptions.map((opt, i) => (
                        <div 
                            key={i} 
                            onClick={() => handleSelect(opt)}
                            className="p-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 border-b last:border-b-0 transition-colors"
                        >
                            <Droplet className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-sm font-medium">{opt}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
