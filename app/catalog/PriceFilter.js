"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function PriceFilter({ minProductPrice, maxProductPrice }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Default max to 2000 if not provided or crazy
    const ABSOLUTE_MAX = 2000;
    const ABSOLUTE_MIN = 0;

    const currentMax = Number(searchParams.get("max")) || ABSOLUTE_MAX;
    const [price, setPrice] = useState(currentMax);

    // Update URL when slider stops moving
    const handleChange = (e) => {
        setPrice(Number(e.target.value));
    };

    const handleMouseUp = () => {
        const params = new URLSearchParams(searchParams);
        if (price === ABSOLUTE_MAX) {
            params.delete("max");
        } else {
            params.set("max", price);
        }
        router.push(`/catalog?${params.toString()}`);
    };

    return (
        <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-bold mb-4 border-b pb-2">מחיר (עד {price} ₪)</h3>
            <div className="space-y-4">
                <input
                    type="range"
                    min={ABSOLUTE_MIN}
                    max={ABSOLUTE_MAX}
                    step={10}
                    value={price}
                    onChange={handleChange}
                    onMouseUp={handleMouseUp}
                    onTouchEnd={handleMouseUp}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                />
                <div className="flex justify-between text-xs text-gray-500">
                    <span>{ABSOLUTE_MIN} ₪</span>
                    <span>{ABSOLUTE_MAX} ₪</span>
                </div>
            </div>
        </div>
    );
}
