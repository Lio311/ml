import React, { useState, useEffect, useRef } from 'react';
import { Check, Loader2 } from 'lucide-react';

export default function AutocompleteInput({ 
    value, 
    onChange, 
    placeholder, 
    fetchSuggestions, 
    disabled,
    hasError,
    type = "text"
}) {
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = async (e) => {
        let val = e.target.value;
        // Allow Hebrew letters, numbers, spaces, quotes, and hyphens
        val = val.replace(/[^א-ת0-9\s'"\-]/g, '');
        onChange(val);
        if (val.length >= 1) {
            setLoading(true);
            const results = await fetchSuggestions(val);
            setSuggestions(results);
            setIsOpen(true);
            setLoading(false);
        } else {
            setSuggestions([]);
            setIsOpen(false);
        }
    };

    const handleSelect = (suggestion) => {
        onChange(suggestion);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <input
                type={type}
                disabled={disabled}
                className={`w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-gray-900 outline-none bg-white transition-all disabled:bg-gray-50 disabled:text-gray-500 pl-10 ${hasError ? 'border-red-500' : ''}`}
                placeholder={placeholder}
                value={value || ''}
                onChange={handleInputChange}
                onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
            />
            {loading ? (
                <Loader2 className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 animate-spin" />
            ) : value ? (
                <Check className="w-5 h-5 text-green-500 absolute left-3 top-1/2 -translate-y-1/2" />
            ) : null}
            
            {isOpen && suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg text-right">
                    {suggestions.map((suggestion, index) => (
                        <li 
                            key={index}
                            className="p-3 hover:bg-gray-100 cursor-pointer text-sm border-b last:border-0"
                            onClick={() => handleSelect(suggestion)}
                        >
                            {suggestion}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
