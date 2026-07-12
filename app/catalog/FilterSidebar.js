"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import PriceFilter from './PriceFilter';
import CustomDropdown from '../components/ui/CustomDropdown';
import { User, Users, UserRound, UserRoundSearch } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const VIRTUAL_CATEGORIES = ['בוטיק', 'נישה'];

export default function FilterSidebar({ allBrands = [], allCategories = [], allCountries = [], allPerfumers = [], allNotes = [], allConcentrations = [], minPrice, maxPrice, basePath = '/catalog' }) {
    const { t, dir, locale } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Translate category names from Hebrew DB values to the current locale
    const translateCategory = (hebrewCat) => {
        if (locale === 'he') return hebrewCat;
        const mapped = t(`common.category_map.${hebrewCat}`);
        return mapped.startsWith('common.category_map.') ? hebrewCat : mapped;
    };

    const translateNote = (note) => {
        const mapped = t(`common.notes_map.${note}`);
        return mapped.startsWith('common.notes_map.') ? note : mapped;
    };
    
    const GENDER_OPTIONS = [
        { value: 'all', label: t('common.all_genders'), icon: <Users className="w-4 h-4" /> },
        { value: 'men', label: t('common.men'), icon: <User className="w-4 h-4" /> },
        { value: 'women', label: t('common.women'), icon: <User className="w-4 h-4 text-pink-500" /> },
        { value: 'unisex', label: t('common.unisex'), icon: <UserRound className="w-4 h-4 text-blue-500" /> },
    ];

    const combinedCategories = Array.from(new Set([...VIRTUAL_CATEGORIES, ...allCategories]));

    // Parse current filters from URL
    const getSelected = (key) => searchParams.getAll(key);

    const ABSOLUTE_MAX = 2000;
    const ABSOLUTE_MIN = 0;

    const [selectedBrands, setSelectedBrands] = useState(getSelected('brand'));
    const [selectedCategories, setSelectedCategories] = useState(getSelected('category'));
    const [selectedSeasons, setSelectedSeasons] = useState(getSelected('season'));
    const [selectedCountries, setSelectedCountries] = useState(getSelected('country'));
    const [selectedPerfumers, setSelectedPerfumers] = useState(getSelected('perfumer'));
    const [selectedNotes, setSelectedNotes] = useState(getSelected('note'));
    const [selectedConcentrations, setSelectedConcentrations] = useState(getSelected('concentration'));
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [price, setPrice] = useState(Number(searchParams.get("max")) || ABSOLUTE_MAX);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [noteSearch, setNoteSearch] = useState('');

    useEffect(() => {
        setSelectedBrands(searchParams.getAll('brand'));
        setSelectedCategories(searchParams.getAll('category'));
        setSelectedSeasons(searchParams.getAll('season'));
        setSelectedCountries(searchParams.getAll('country'));
        setSelectedPerfumers(searchParams.getAll('perfumer'));
        setSelectedNotes(searchParams.getAll('note'));
        setSelectedConcentrations(searchParams.getAll('concentration'));
        setSearchTerm(searchParams.get('q') || '');
        setPrice(Number(searchParams.get("max")) || ABSOLUTE_MAX);
    }, [searchParams]);

    const handleSearch = (e) => {
        e.preventDefault();
        applyFilters({ q: searchTerm, resetPage: true });
    };

    const toggleBrand = (brand) => {
        const newBrands = selectedBrands.includes(brand) ? selectedBrands.filter(b => b !== brand) : [...selectedBrands, brand];
        setSelectedBrands(newBrands);
        applyFilters({ brand: newBrands, resetPage: true });
    };

    const toggleCategory = (cat) => {
        const newCats = selectedCategories.includes(cat) ? selectedCategories.filter(c => c !== cat) : [...selectedCategories, cat];
        setSelectedCategories(newCats);
        applyFilters({ category: newCats, resetPage: true });
    };

    const toggleSeason = (season) => {
        const newSeasons = selectedSeasons.includes(season) ? selectedSeasons.filter(s => s !== season) : [...selectedSeasons, season];
        setSelectedSeasons(newSeasons);
        applyFilters({ season: newSeasons, resetPage: true });
    };

    const toggleCountry = (country) => {
        const newCountries = selectedCountries.includes(country) ? selectedCountries.filter(c => c !== country) : [...selectedCountries, country];
        setSelectedCountries(newCountries);
        applyFilters({ country: newCountries, resetPage: true });
    };

    const togglePerfumer = (perfumer) => {
        const newPerfumers = selectedPerfumers.includes(perfumer) ? selectedPerfumers.filter(p => p !== perfumer) : [...selectedPerfumers, perfumer];
        setSelectedPerfumers(newPerfumers);
        applyFilters({ perfumer: newPerfumers, resetPage: true });
    };

    const toggleNote = (note) => {
        const newNotes = selectedNotes.includes(note) ? selectedNotes.filter(n => n !== note) : [...selectedNotes, note];
        setSelectedNotes(newNotes);
        applyFilters({ note: newNotes, resetPage: true });
    };

    const toggleConcentration = (concentration) => {
        const newConcentrations = selectedConcentrations.includes(concentration) ? selectedConcentrations.filter(c => c !== concentration) : [...selectedConcentrations, concentration];
        setSelectedConcentrations(newConcentrations);
        applyFilters({ concentration: newConcentrations, resetPage: true });
    };

    const applyFilters = (updates) => {
        const params = new URLSearchParams(searchParams.toString());

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
        if (updates.note !== undefined) updateArrayParam('note', updates.note);
        if (updates.concentration !== undefined) updateArrayParam('concentration', updates.concentration);
        if (updates.gender !== undefined) {
            if (updates.gender === null) params.delete('gender');
            else params.set('gender', updates.gender);
        }
        if (updates.max !== undefined) {
            if (updates.max === ABSOLUTE_MAX) params.delete('max');
            else params.set('max', updates.max);
        }
        if (updates.resetPage) params.set('page', '1');

        router.push(`${basePath}?${params.toString()}`);
    };

    const filterContent = (
        <div className="space-y-6">
            {/* Gender Filter */}
            <div className={`bg-gray-50 p-4 rounded-lg border ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">{t('common.gender_filter')}</h3>
                <CustomDropdown 
                    options={GENDER_OPTIONS}
                    value={searchParams.get('gender') || 'all'}
                    onChange={(val) => applyFilters({ gender: val === 'all' ? null : val, resetPage: true })}
                    fullWidth
                    className="!bg-white !border-gray-100 !rounded-xl"
                />
            </div>

            {/* Concentration Filter */}
            {allConcentrations && allConcentrations.length > 0 && (
                <CollapsibleSection title={`${t('common.concentration_filter')} (${allConcentrations.length})`} initialOpen={true}>
                    <div className={`space-y-2 text-sm max-h-[110px] overflow-y-auto custom-scrollbar ps-2 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        {allConcentrations.map(c => (
                            <label key={c} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                <input
                                    type="checkbox"
                                    checked={selectedConcentrations.includes(c)}
                                    onChange={() => toggleConcentration(c)}
                                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                />
                                <span className={selectedConcentrations.includes(c) ? 'font-bold' : ''}>
                                    {t(`concentrations.${c}`) === `concentrations.${c}` ? c : t(`concentrations.${c}`)}
                                </span>
                            </label>
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {/* Category Filter */}
            <CollapsibleSection title={`${t('common.category_filter')} (${combinedCategories.length})`} initialOpen={true}>
                <div className={`space-y-2 text-sm max-h-[110px] overflow-y-auto custom-scrollbar ps-2 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                    {combinedCategories.map(cat => (
                        <label key={cat} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                            <input
                                type="checkbox"
                                checked={selectedCategories.includes(cat)}
                                onChange={() => toggleCategory(cat)}
                                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                            />
                            <span className={selectedCategories.includes(cat) ? 'font-bold' : ''}>{translateCategory(cat)}</span>
                        </label>
                    ))}
                </div>
            </CollapsibleSection>

            {/* Brand Filter */}
            <CollapsibleSection title={`${t('common.brand_filter')} (${allBrands.length})`} initialOpen={true}>
                <div className={`space-y-2 text-sm max-h-[110px] overflow-y-auto custom-scrollbar ps-2 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
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
            <CollapsibleSection title={`${t('common.price')} (${t('common.up_to')} ${price} ₪)`} initialOpen={true}>
                <PriceFilter 
                    price={price} 
                    setPrice={setPrice} 
                    onApply={() => applyFilters({ max: price, resetPage: true })}
                    ABSOLUTE_MIN={ABSOLUTE_MIN}
                    ABSOLUTE_MAX={ABSOLUTE_MAX}
                />
            </CollapsibleSection>

            {/* Season Filter */}
            <CollapsibleSection title={t('common.season_filter')} initialOpen={true}>
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
                            {s === 'חורף' ? t('common.winter') :
                             s === 'סתיו' ? t('common.fall') :
                             s === 'אביב' ? t('common.spring') :
                             s === 'קיץ' ? t('common.summer') : s}
                        </button>
                    ))}
                </div>
            </CollapsibleSection>

            {/* Notes Filter */}
            {allNotes && allNotes.length > 0 && (
                <CollapsibleSection title={`${t('common.notes_filter')} (${allNotes.length})`} initialOpen={true}>
                    <div className="space-y-4">
                        {/* Note Search */}
                        <div className="relative">
                            <input
                                type="text"
                                value={noteSearch}
                                onChange={(e) => setNoteSearch(e.target.value)}
                                placeholder={t('common.search')}
                                className="w-full p-2 ps-8 text-xs border border-gray-100 rounded-lg bg-white focus:outline-none focus:border-black"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 ${dir === 'rtl' ? 'right-2' : 'left-2'}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                        </div>

                        <div className={`space-y-2 text-sm max-h-[110px] overflow-y-auto custom-scrollbar ps-2 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                            {Object.values(allNotes.reduce((acc, n) => {
                                const translated = translateNote(n);
                                if (!acc[translated]) {
                                    acc[translated] = { original: [n], translated };
                                } else {
                                    acc[translated].original.push(n);
                                }
                                return acc;
                            }, {}))
                                .sort((a, b) => a.translated.localeCompare(b.translated, locale === 'he' ? 'he' : 'en'))
                                .filter(item => 
                                    item.translated.toLowerCase().includes(noteSearch.toLowerCase()) || 
                                    item.original.some(o => o.toLowerCase().includes(noteSearch.toLowerCase()))
                                )
                                .map(item => {
                                    const isSelected = item.original.some(o => selectedNotes.includes(o));
                                    return (
                                        <label key={item.translated} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => {
                                                    let newNotes;
                                                    if (isSelected) {
                                                        newNotes = selectedNotes.filter(n => !item.original.includes(n));
                                                    } else {
                                                        newNotes = [...selectedNotes, ...item.original];
                                                    }
                                                    setSelectedNotes(newNotes);
                                                    applyFilters({ note: newNotes, resetPage: true });
                                                }}
                                                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                            />
                                            <span className={isSelected ? 'font-bold' : ''}>{item.translated}</span>
                                        </label>
                                    );
                                })}
                        </div>
                    </div>
                </CollapsibleSection>
            )}

            {/* Country Filter */}
            {allCountries && allCountries.length > 0 && (
                <CollapsibleSection title={`${t('common.country_filter')} (${allCountries.length})`} initialOpen={true}>
                    <div className={`space-y-2 text-sm max-h-[110px] overflow-y-auto custom-scrollbar ps-2 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
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
                <CollapsibleSection title={`${t('common.perfumer_filter')} (${allPerfumers.length})`} initialOpen={true}>
                    <div className={`space-y-2 text-sm max-h-[110px] overflow-y-auto custom-scrollbar ps-2 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
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
        </div>
    );

    return (
        <aside className="w-full md:w-64 space-y-6">

            {/* Search - Always Visible */}
            <div className={`bg-gray-50 p-4 rounded-lg border ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                <h3 className="font-bold mb-4 border-b pb-2">{t('common.search_filter')}</h3>
                <form onSubmit={handleSearch} className="relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t('common.search_perfume_placeholder')}
                        className="w-full p-2 ps-10 border rounded text-sm bg-white"
                        dir={dir}
                    />
                    <button
                        type="submit"
                        className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition ${dir === 'rtl' ? 'left-2' : 'right-2'}`}
                        title={t('common.search_filter')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                    </button>
                </form>
            </div>

            {/* Desktop Filters */}
            <div className="hidden md:block">
                {filterContent}
            </div>

            {/* Mobile Filters Collapsible */}
            <div className="md:hidden">
                <div className="bg-gray-50 rounded-lg border overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                        className={`w-full flex justify-between items-center p-4 font-bold bg-gray-50 hover:bg-gray-100 transition ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
                    >
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 12h9.75M10.5 18h9.75M3 6h.008v.008H3V6Zm0 6h.008v.008H3v-.008Zm0 6h.008v.008H3v-.008Z" />
                            </svg>
                            <span>{t('common.filters_title')}</span>
                        </div>
                        <span className={`transform transition ${isMobileFiltersOpen ? 'rotate-180' : ''}`}>
                            ▼
                        </span>
                    </button>

                    {isMobileFiltersOpen && (
                        <div className="p-4 border-t border-gray-100 animate-in slide-in-from-top-2 fade-in duration-200">
                            {filterContent}
                        </div>
                    )}
                </div>
            </div>

        </aside>
    );
}

function CollapsibleSection({ title, children, initialOpen = false }) {
    const { dir } = useLanguage();
    const [isOpen, setIsOpen] = useState(initialOpen);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsOpen(false);
            } else {
                setIsOpen(initialOpen);
            }
        };

        handleResize(); // Set initial state on mount

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [initialOpen]);

    return (
        <div className="bg-gray-50 rounded-lg border overflow-hidden">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex justify-between items-center p-4 font-bold bg-transparent hover:bg-gray-100 transition ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
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
