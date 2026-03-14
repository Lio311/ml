import CustomDropdown from "../components/ui/CustomDropdown";
import { ArrowUpDown, Clock, TrendingDown, TrendingUp } from "lucide-react";

const SORT_OPTIONS = [
    { value: "newest", label: "חדש ביותר", icon: <Clock className="w-4 h-4" /> },
    { value: "oldest", label: "ישן ביותר", icon: <Clock className="w-4 h-4 opacity-50" /> },
    { value: "price_asc", label: "מחיר: מהנמוך לגבוה", icon: <TrendingUp className="w-4 h-4" /> },
    { value: "price_desc", label: "מחיר: מהגבוה לנמוך", icon: <TrendingDown className="w-4 h-4" /> },
];

export default function SortSelect() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSort = searchParams.get("sort") || "newest";

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
