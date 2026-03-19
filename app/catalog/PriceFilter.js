"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function PriceFilter({ price, setPrice, onApply, ABSOLUTE_MIN, ABSOLUTE_MAX }) {
    // Update local state is now handled by parent's setPrice
    const handleChange = (e) => {
        setPrice(Number(e.target.value));
    };

    return (
        <div className="space-y-4">
            <input
                type="range"
                min={ABSOLUTE_MIN}
                max={ABSOLUTE_MAX}
                step={10}
                value={price}
                onChange={handleChange}
                onMouseUp={onApply}
                onTouchEnd={onApply}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
            />
            <div className="flex justify-between text-xs text-gray-500">
                <span>{ABSOLUTE_MIN} ₪</span>
                <span>{ABSOLUTE_MAX} ₪</span>
            </div>
        </div>
    );
}
