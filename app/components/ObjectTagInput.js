"use client";

import { useState, useRef, useEffect } from 'react';

// options: Array<{ id: string|number, label: string, subLabel?: string }>
// value: Array<string|number> (IDs)
// onChange: (ids: Array<string|number>) => void
export default function ObjectTagInput({ value = [], onChange, options = [], placeholder = "הוסף..." }) {
    const [input, setInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    // Filter available options (exclude already selected)
    const availableOptions = options.filter(opt => !value.includes(opt.id));

    // Filter suggestions based on input
    const filteredSuggestions = availableOptions.filter(opt =>
        opt.label.toLowerCase().includes(input.toLowerCase()) ||
        opt.subLabel?.toLowerCase().includes(input.toLowerCase())
    );

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const addTag = (opt) => {
        onChange([...value, opt.id]);
        setInput('');
        setShowSuggestions(false);
    };

    const removeTag = (idToRemove) => {
        onChange(value.filter(id => id !== idToRemove));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // If explicit match or only one suggestion?
            if (filteredSuggestions.length === 1) {
                addTag(filteredSuggestions[0]);
            }
        } else if (e.key === 'Backspace' && !input && value.length > 0) {
            removeTag(value[value.length - 1]);
        }
    };

    // Helper to get label for selected ID
    const getLabel = (id) => {
        const opt = options.find(o => o.id === id);
        return opt ? opt.label : id;
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="flex flex-wrap gap-2 border p-2 rounded bg-white focus-within:ring-2 focus-within:ring-black focus-within:border-transparent min-h-[42px]">
                {value.map(id => (
                    <span key={id} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm flex items-center gap-1 border">
                        {getLabel(id)}
                        <button
                            type="button"
                            onClick={() => removeTag(id)}
                            className="text-gray-400 hover:text-red-500 font-bold ml-1 focus:outline-none"
                        >
                            &times;
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={input}
                    onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder={value.length === 0 ? placeholder : ''}
                    className="flex-1 outline-none min-w-[80px] text-sm bg-transparent"
                />
            </div>
            {showSuggestions && input && filteredSuggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border mt-1 rounded shadow-lg max-h-60 overflow-y-auto">
                    {filteredSuggestions.map(opt => (
                        <li
                            key={opt.id}
                            onClick={() => addTag(opt)}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b last:border-0"
                        >
                            <div className="font-medium">{opt.label}</div>
                            {opt.subLabel && <div className="text-xs text-gray-500">{opt.subLabel}</div>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
