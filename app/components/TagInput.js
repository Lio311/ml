"use client";

import { useState, useRef, useEffect } from 'react';

export default function TagInput({ tags, onChange, suggestions = [], placeholder = "הוסף תגית..." }) {
    const [input, setInput] = useState('');
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const updateSuggestions = (val) => {
        const filtered = suggestions.filter(
            s => s.toLowerCase().includes(val.toLowerCase()) && !tags.includes(s)
        );
        setFilteredSuggestions(filtered);
        setShowSuggestions(true);
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInput(val);
        updateSuggestions(val);
    };

    const addTag = (tag) => {
        const trimmed = tag.trim();
        if (trimmed && !tags.includes(trimmed)) {
            onChange([...tags, trimmed]);
        }
        setInput('');
        // Keep suggestions open or close? Usually close and clear filter
        setFilteredSuggestions(suggestions.filter(s => !tags.includes(s) && s !== trimmed));
        setShowSuggestions(false);
    };

    const removeTag = (tagToRemove) => {
        onChange(tags.filter(tag => tag !== tagToRemove));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (input.trim()) {
                addTag(input);
            }
        } else if (e.key === 'Backspace' && !input && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
        }
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="flex flex-wrap gap-2 border p-2 rounded bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                {tags.map(tag => (
                    <span key={tag} className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-sm flex items-center gap-1">
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="text-gray-500 hover:text-red-500 font-bold focus:outline-none"
                        >
                            &times;
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => updateSuggestions(input)}
                    placeholder={tags.length === 0 ? placeholder : ''}
                    className="flex-1 outline-none min-w-[100px] text-sm bg-transparent"
                />
            </div>
            {showSuggestions && filteredSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border mt-1 rounded shadow-lg max-h-40 overflow-y-auto">
                    {filteredSuggestions.map(suggestion => (
                        <li
                            key={suggestion}
                            onClick={() => addTag(suggestion)}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        >
                            {suggestion}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
