"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import PriceFilter from './PriceFilter'; // Re-use existing price filter or integrate here

export default function FilterSidebar({ allBrands, allCategories, minPrice, maxPrice }) {
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
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

    useEffect(() => {
        setSelectedBrands(searchParams.getAll('brand'));
        setSelectedCategories(searchParams.getAll('category'));
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
        if (updates.resetPage) params.set('page', '1');

        router.push(`/catalog?${params.toString()}`);
    };

    // ... existing logic ...

    return (
        <aside className="w-full md:w-64 space-y-6">

            {/* Search - Always Visible */}
            <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-bold mb-4 border-b pb-2">חיפוש</h3>
                <form onSubmit={handleSearch}>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="חפש בושם..."
                        className="w-full p-2 border rounded text-sm bg-white"
                    />
                </form>
            </div>

            {/* Category Filter */}
            <CollapsibleSection title={`קטגוריות (${allCategories.length})`}>
                <div className="space-y-2 text-sm max-h-[200px] overflow-y-auto custom-scrollbar pl-2">
                    {allCategories.map(cat => (
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
