"use client";
import { useRouter, useSearchParams } from "next/navigation";
import CustomDropdown from "../components/ui/CustomDropdown";

export default function SortSelect() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSort = searchParams.get("sort") || "newest";

    const SORT_OPTIONS = [
        { value: "newest", label: "חדש ביותר" },
        { value: "oldest", label: "ישן ביותר" },
        { value: "price_asc", label: "מחיר: מהנמוך לגבוה" },
        { value: "price_desc", label: "מחיר: מהגבוה לנמוך" },
    ];

    const handleSortChange = (newSort) => {
        const params = new URLSearchParams(searchParams);
        params.set("sort", newSort);
        params.delete("page");
        router.push(`/catalog?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-black uppercase tracking-widest hidden md:inline">מיון לפי</span>
            <CustomDropdown 
                options={SORT_OPTIONS}
                value={currentSort}
                onChange={handleSortChange}
                className="!bg-gray-50 !border-transparent !rounded-xl"
            />
        </div>
    );
}
