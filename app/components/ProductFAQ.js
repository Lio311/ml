"use client";

import { useState } from "react";

export default function ProductFAQ({ items, dir }) {
    const [openIndex, setOpenIndex] = useState(null);

    const toggle = (i) => {
        setOpenIndex(openIndex === i ? null : i);
    };

    return (
        <div className="space-y-2 w-full">
            {items.map((item, i) => (
                <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                    <button
                        onClick={() => toggle(i)}
                        className={`w-full px-5 py-4 font-medium cursor-pointer bg-white hover:bg-gray-50 transition-colors flex items-center justify-between ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
                    >
                        <span>{item.q}</span>
                        <span className={`text-gray-400 ms-3 shrink-0 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}>▾</span>
                    </button>
                    <div
                        className={`grid transition-all duration-200 ease-in-out ${openIndex === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                    >
                        <div className="overflow-hidden">
                            <p className={`px-5 py-4 text-sm text-gray-600 bg-gray-50 leading-relaxed ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                {item.a}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
