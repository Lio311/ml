"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import PriceFilter from './PriceFilter';
import CustomDropdown from '../components/ui/CustomDropdown';
import { User, Users, UserRound, UserRoundSearch } from 'lucide-react';

const GENDER_OPTIONS = [
    { value: 'all', label: 'כל המגדרים', icon: <Users className="w-4 h-4" /> },
    { value: 'men', label: 'גברים', icon: <User className="w-4 h-4" /> },
    { value: 'women', label: 'נשים', icon: <User className="w-4 h-4 text-pink-500" /> },
    { value: 'unisex', label: 'יוניסקס', icon: <UserRound className="w-4 h-4 text-blue-500" /> },
];

const VIRTUAL_CATEGORIES = ['בוטיק', 'נישה'];

export default function FilterSidebar({ allBrands, allCategories, allCountries, allPerfumers, minPrice, maxPrice }) {
    // Merge virtual categories (remove duplicates just in case)
    const combinedCategories = Array.from(new Set([...VIRTUAL_CATEGORIES, ...allCategories]));
    const router = useRouter();
    const searchParams = useSearchParams();

    // Parse current filters from URL
    const getSelected = (key) => {
        const val = searchParams.getAll(key);
        // Note: in Next.js app router client 'useSearchParams', .getAll() returns array of strings
        // But we need to handle comma separated if we used that before. 
        // Let's stick to standard array params `?brand=A&brand=B`.
        return val;
    };

    const [selectedBrands, setSelectedBrands] = useState(getSelected('brand'));
    const [selectedCategories, setSelectedCategories] = useState(getSelected('category'));
    const [selectedSeasons, setSelectedSeasons] = useState(getSelected('season'));
    const [selectedCountries, setSelectedCountries] = useState(getSelected('country'));
    const [selectedPerfumers, setSelectedPerfumers] = useState(getSelected('perfumer'));
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

    useEffect(() => {
        setSelectedBrands(searchParams.getAll('brand'));
        setSelectedCategories(searchParams.getAll('category'));
        setSelectedSeasons(searchParams.getAll('season'));
        setSelectedCountries(searchParams.getAll('country'));
        setSelectedPerfumers(searchParams.getAll('perfumer'));
        setSearchTerm(searchParams.get('q') || '');
    }, [searchParams]);

    const handleSearch = (e) => {
        e.preventDefault();
        applyFilters({ q: searchTerm, resetPage: true });
    };

    const toggleBrand = (brand) => {
        const newBrands = selectedBrands.includes(brand)
            ? selectedBrands.filter(b => b !== brand)
            : [...selectedBrands, brand];
        setSelectedBrands(newBrands);
        applyFilters({ brand: newBrands, resetPage: true }); // Apply immediately
    };

    const toggleCategory = (cat) => {
        const newCats = selectedCategories.includes(cat)
            ? selectedCategories.filter(c => c !== cat)
            : [...selectedCategories, cat];
        setSelectedCategories(newCats);
        applyFilters({ category: newCats, resetPage: true });
    };

    const toggleSeason = (season) => {
        const newSeasons = selectedSeasons.includes(season)
            ? selectedSeasons.filter(s => s !== season)
            : [...selectedSeasons, season];
        setSelectedSeasons(newSeasons);
        applyFilters({ season: newSeasons, resetPage: true });
    };

    const toggleCountry = (country) => {
        const newCountries = selectedCountries.includes(country)
            ? selectedCountries.filter(c => c !== country)
            : [...selectedCountries, country];
        setSelectedCountries(newCountries);
        applyFilters({ country: newCountries, resetPage: true });
    };

    const togglePerfumer = (perfumer) => {
        const newPerfumers = selectedPerfumers.includes(perfumer)
            ? selectedPerfumers.filter(p => p !== perfumer)
            : [...selectedPerfumers, perfumer];
        setSelectedPerfumers(newPerfumers);
        applyFilters({ perfumer: newPerfumers, resetPage: true });
    };

    const applyFilters = (updates) => {
        const params = new URLSearchParams(searchParams.toString());

        // Helper to update array params
        const updateArrayParam = (key, values) => {
            params.delete(key);
            if (values && Array.isArray(values)) {
                values.forEach(v => params.append(key, v));
            } else if (values) {
                params.append(key, values);
            }
        };

        if (updates.q !== undefined) updateArrayParam('q', updates.q);
        if (updates.brand !== undefined) updateArrayParam('brand', updates.brand);
        if (updates.category !== undefined) updateArrayParam('category', updates.category);
        if (updates.season !== undefined) updateArrayParam('season', updates.season);
        if (updates.country !== undefined) updateArrayParam('country', updates.country);
        if (updates.perfumer !== undefined) updateArrayParam('perfumer', updates.perfumer);
        if (updates.gender !== undefined) {
            if (updates.gender === null) params.delete('gender');
            else params.set('gender', updates.gender);
        }
        if (updates.resetPage) params.set('page', '1');

        router.push(`/catalog?${params.toString()}`);
    };

    // ... existing logic ...

    return (
        <aside className="w-full md:w-64 space-y-6">

            {/* Gender Filter */}
            <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">מגדר</h3>
                <CustomDropdown 
                    options={GENDER_OPTIONS}
                    value={searchParams.get('gender') || 'all'}
                    onChange={(val) => applyFilters({ gender: val === 'all' ? null : val, resetPage: true })}
                    fullWidth
                    className="!bg-white !border-gray-100 !rounded-xl"
                />
            </div>

            {/* Search - Always Visible */}
            <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-bold mb-4 border-b pb-2">חיפוש</h3>
                <form onSubmit={handleSearch} className="relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="חפש בושם..."
                        className="w-full p-2 pl-10 border rounded text-sm bg-white"
                    />
                    <button
                        type="submit"
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition"
                        title="חפש"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                    </button>
                </form>
            </div>

            {/* Category Filter */}
            <CollapsibleSection title={`קטגוריות (${combinedCategories.length})`}>
                <div className="space-y-2 text-sm max-h-[200px] overflow-y-auto custom-scrollbar pl-2">
                    {combinedCategories.map(cat => (
                        <label key={cat} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                            <input
                                type="checkbox"
                                checked={selectedCategories.includes(cat)}
                                onChange={() => toggleCategory(cat)}
                                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                            />
                            <span className={selectedCategories.includes(cat) ? 'font-bold' : ''}>{cat}</span>
                        </label>
                    ))}
                </div>
            </CollapsibleSection>

            {/* Brand Filter */}
            <CollapsibleSection title={`מותגים (${allBrands.length})`}>
                <div className="space-y-2 text-sm max-h-[300px] overflow-y-auto custom-scrollbar pl-2">
                    {allBrands.map(b => (
                        <label key={b} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                            <input
                                type="checkbox"
                                checked={selectedBrands.includes(b)}
                                onChange={() => toggleBrand(b)}
                                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                            />
                            <span className={selectedBrands.includes(b) ? 'font-bold' : ''}>{b}</span>
                        </label>
                    ))}
                </div>
            </CollapsibleSection>

            {/* Price Filter Slider */}
            <PriceFilter />

            {/* Season Filter */}
            <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">עונה</h3>
                <div className="grid grid-cols-2 gap-2">
                    {['חורף', 'סתיו', 'אביב', 'קיץ'].map(s => (
                        <button
                            key={s}
                            onClick={() => toggleSeason(s)}
                            className={`px-2 py-2 rounded-lg border text-xs font-bold transition-all ${
                                selectedSeasons.includes(s) 
                                ? 'bg-black text-white border-black shadow-md' 
                                : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Country Filter */}
            {allCountries && allCountries.length > 0 && (
                <CollapsibleSection title={`מדינה (${allCountries.length})`}>
                    <div className="space-y-2 text-sm max-h-[200px] overflow-y-auto custom-scrollbar pl-2">
                        {allCountries.map(c => (
                            <label key={c} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                <input
                                    type="checkbox"
                                    checked={selectedCountries.includes(c)}
                                    onChange={() => toggleCountry(c)}
                                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                />
                                <span className={selectedCountries.includes(c) ? 'font-bold' : ''}>{c}</span>
                            </label>
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {/* Perfumer Filter */}
            {allPerfumers && allPerfumers.length > 0 && (
                <CollapsibleSection title={`פרפיומר (${allPerfumers.length})`}>
                    <div className="space-y-2 text-sm max-h-[200px] overflow-y-auto custom-scrollbar pl-2">
                        {allPerfumers.map(p => (
                            <label key={p} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                <input
                                    type="checkbox"
                                    checked={selectedPerfumers.includes(p)}
                                    onChange={() => togglePerfumer(p)}
                                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                />
                                <span className={selectedPerfumers.includes(p) ? 'font-bold' : ''}>{p}</span>
                            </label>
                        ))}
                    </div>
                </CollapsibleSection>
            )}

        </aside>
    );
}

function CollapsibleSection({ title, children }) {
    // Default open on desktop (hidden logic handled via CSS or just default closed on mobile?)
    // User explicitly wants "Folded on mobile".
    // We can use a simple state that initializes based on window width? No, hydration error.
    // We can use <details> and <summary> which is native and works without JS well, but styling is tricky.
    // Let's use simple state, default OPEN. But on mobile, we want it CLOSED.
    // Best way: Use CSS 'peer' or 'group' or just a media query based initial check in useEffect.

    // Let's try a CSS-first approach for defaults?
    // "md:block hidden" logic? No, it's a toggle.

    // Robust solution: Render open, but check width on mount to close if mobile.
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        if (window.innerWidth < 768) {
            setIsOpen(false);
        }
    }, []);

    return (
        <div className="bg-gray-50 rounded-lg border overflow-hidden">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 font-bold bg-gray-50 hover:bg-gray-100 transition text-right"
            >
                <span>{title}</span>
                <span className={`transform transition ${isOpen ? 'rotate-180' : ''}`}>
                    ▼
                </span>
            </button>

            {isOpen && (
                <div className="p-4 pt-0 border-t border-gray-100 animate-in slide-in-from-top-2 fade-in duration-200">
                    {children}
                </div>
            )}
        </div>
    );
}
