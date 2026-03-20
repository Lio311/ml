"use client";
import { useRouter, useSearchParams } from "next/navigation";
import CustomDropdown from "../components/ui/CustomDropdown";
import { useLanguage } from "../context/LanguageContext";

export default function SortSelect() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useLanguage();
    const currentSort = searchParams.get("sort") || "newest";

    const SORT_OPTIONS = [
        { value: "newest", label: t('common.sort_newest') },
        { value: "oldest", label: t('common.sort_oldest') },
        { value: "price_asc", label: t('common.sort_price_asc') },
        { value: "price_desc", label: t('common.sort_price_desc') },
    ];

    const handleSortChange = (newSort) => {
        const params = new URLSearchParams(searchParams);
        params.set("sort", newSort);
        params.delete("page");
        router.push(`/catalog?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-black uppercase tracking-widest hidden md:inline">{t('common.sort_by')}</span>
            <CustomDropdown 
                options={SORT_OPTIONS}
                value={currentSort}
                onChange={handleSortChange}
                className="!bg-gray-50 !border-transparent !rounded-xl"
            />
        </div>
    );
}
