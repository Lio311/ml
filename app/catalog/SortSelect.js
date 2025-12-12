"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function SortSelect() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSort = searchParams.get("sort") || "random";

    const handleSortChange = (e) => {
        const newSort = e.target.value;
        const params = new URLSearchParams(searchParams);
        params.set("sort", newSort);
        params.delete("page"); // Reset to page 1 on sort change
        router.push(`/catalog?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-bold hidden md:inline">מיון לפי:</span>
            <select
                value={currentSort}
                onChange={handleSortChange}
                className="border p-2 rounded text-sm bg-white focus:outline-none focus:border-black"
            >
                <option value="random">מומלץ</option>
                <option value="newest">חדש ביותר</option>
                <option value="oldest">ישן ביותר</option>
                <option value="price_asc">מחיר: מהנמוך לגבוה</option>
                <option value="price_desc">מחיר: מהגבוה לנמוך</option>
            </select>
        </div>
    );
}
