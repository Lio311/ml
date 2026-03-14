"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useCatalogCart } from "./CatalogCartContext";

const ITEMS_PER_PAGE = 16;

// ─── Collapsible Section (same as FilterSidebar) ─────────────────────
function CollapsibleSection({ title, children }) {
    const [isOpen, setIsOpen] = useState(true);
    useEffect(() => { if (window.innerWidth < 768) setIsOpen(false); }, []);
    return (
        <div className="bg-gray-50 rounded-lg border overflow-hidden">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 font-bold bg-gray-50 hover:bg-gray-100 transition text-right"
            >
                <span>{title}</span>
                <span className={`transform transition ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isOpen && (
                <div className="p-4 pt-0 border-t border-gray-100">
                    {children}
                </div>
            )}
        </div>
    );
}

// ─── Catalog Product Card (IDENTICAL to main site ProductCard.js) ─────
function CatalogProductCard({ item, slug, catalogId, catalogName }) {
    const { addToCart } = useCatalogCart();
    const [added, setAdded] = useState(false);

    useEffect(() => {
        let timer;
        if (added) {
            timer = setTimeout(() => setAdded(false), 2000);
        }
        return () => clearTimeout(timer);
    }, [added]);

    const handleAdd = (size, price) => {
        addToCart(
            { ...item, id: `${item.id}_${size}`, originalId: item.id, size, price },
            size,
            price,
            catalogId,
            catalogName
        );
        toast.success(`נוסף לסל: ${item.fragrance_name} (${size} מ"ל)`);
        setAdded(true);
    };

    const sizeEntries = Object.entries(item.prices || {});

    return (
        <div className="group border rounded-lg overflow-hidden hover:shadow-xl transition bg-white flex flex-col h-full relative">
            {/* Wishlist Heart (Placeholder/Decoration for visual consistency) */}
            <div className="absolute top-2 left-2 z-10 opacity-30 pointer-events-none">
                <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center border shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                </div>
            </div>

            {item.gender && (
                <div className="absolute top-2 right-2 z-10 text-[10px] leading-3 font-bold bg-gray-900 text-white px-2 py-1 rounded shadow-sm text-center uppercase tracking-wide">
                    {item.gender}
                </div>
            )}

            <Link href={`/catalog/${slug}/product/${item.id}`} className="block relative aspect-square bg-white overflow-hidden cursor-pointer p-2">
                {item.image_url ? (
                    <img
                        src={item.image_url}
                        alt={item.fragrance_name}
                        className="w-full h-full object-contain group-hover:scale-110 transition duration-700"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-4xl group-hover:scale-105 transition duration-500">
                        🧴
                    </div>
                )}
            </Link>

            <div className="p-4 flex-1 flex flex-col">
                <div className="text-xs text-gray-500 mb-1 line-clamp-1">{(item.category || '').split(',')[0]}</div>
                <Link href={`/catalog/${slug}/product/${item.id}`}>
                    <h3 className="font-bold text-sm mb-2 line-clamp-2 min-h-[40px] hover:underline">
                        <span className="text-gray-400 font-semibold text-[10px] mr-1">{item.brand}</span>
                        {item.fragrance_name}
                    </h3>
                </Link>

                <div className="mt-auto space-y-2">
                    {sizeEntries.length > 0 ? sizeEntries.map(([size, price]) => (
                        <div key={size} className="flex items-center justify-between text-xs text-gray-600">
                            <span>{size} מ״ל</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold">{price} ₪</span>
                                <button
                                    onClick={(e) => { e.preventDefault(); handleAdd(size, price); }}
                                    className="bg-gray-100 hover:bg-black hover:text-white w-6 h-6 rounded flex items-center justify-center transition"
                                    title="הוסף לסל"
                                >+</button>
                            </div>
                        </div>
                    )) : (
                        <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>1 מ״ל</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold">{item.price || 0} ₪</span>
                                <button
                                    onClick={(e) => { e.preventDefault(); handleAdd('1', item.price); }}
                                    className="bg-gray-100 hover:bg-black hover:text-white w-6 h-6 rounded flex items-center justify-center transition"
                                >+</button>
                            </div>
                        </div>
                    )}

                    <Link href={`/catalog/${slug}/product/${item.id}`} className={`block w-full text-center text-xs py-2 mt-3 rounded transition ${added ? 'bg-green-600 text-white' : 'bg-black text-white hover:bg-gray-800'}`}>
                        {added ? 'נוסף לסל!' : 'פרטים נוספים'}
                    </Link>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────
export default function CatalogClient({ slug }) {
    const [catalog, setCatalog] = useState(null);
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter state
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedGenders, setSelectedGenders] = useState([]);
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                const res = await fetch(`/api/user-catalogs/public-by-slug/${slug}`);
                if (res.ok) {
                    const data = await res.json();
                    setCatalog(data.catalog);
                    setItems(data.items);
                } else {
                    setError("הקטלוג לא נמצא או שאינו זמין.");
                }
            } catch (err) {
                setError("שגיאת תקשורת.");
            } finally {
                setIsLoading(false);
            }
        };
        if (slug) fetchCatalog();
    }, [slug]);

    // Derived filter options
    const allCategories = useMemo(() => {
        const cats = new Set();
        items.forEach(item => {
            (item.category || '').split(',').forEach(c => { if (c.trim()) cats.add(c.trim()); });
        });
        return [...cats].sort();
    }, [items]);

    const allGenders = useMemo(() => {
        const g = new Set();
        items.forEach(item => { if (item.gender) g.add(item.gender); });
        return [...g].sort();
    }, [items]);

    // Filtered + sorted + paginated
    const filteredItems = useMemo(() => {
        let result = [...items];

        if (search) {
            const q = search.toLowerCase();
            result = result.filter(item =>
                (item.brand || '').toLowerCase().includes(q) ||
                (item.fragrance_name || '').toLowerCase().includes(q) ||
                (item.name || '').toLowerCase().includes(q) ||
                (item.description || '').toLowerCase().includes(q) ||
                (item.category || '').toLowerCase().includes(q)
            );
        }

        if (selectedCategories.length > 0) {
            result = result.filter(item =>
                selectedCategories.some(cat =>
                    (item.category || '').toLowerCase().includes(cat.toLowerCase())
                )
            );
        }

        if (selectedGenders.length > 0) {
            result = result.filter(item => selectedGenders.includes(item.gender));
        }

        switch (sortBy) {
            case 'price_asc':
                result.sort((a, b) => (Object.values(a.prices || {})[0] || 0) - (Object.values(b.prices || {})[0] || 0));
                break;
            case 'price_desc':
                result.sort((a, b) => (Object.values(b.prices || {})[0] || 0) - (Object.values(a.prices || {})[0] || 0));
                break;
            case 'name_az':
                result.sort((a, b) => (a.brand || '').localeCompare(b.brand || ''));
                break;
            case 'newest':
            default:
                result.sort((a, b) => b.id - a.id);
                break;
        }

        return result;
    }, [items, search, selectedCategories, selectedGenders, sortBy]);

    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
    const pagedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const toggleFilter = (arr, setArr, val) => {
        setCurrentPage(1);
        setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
    };

    if (isLoading) return <div className="text-center py-20 text-xl animate-pulse">טוען קטלוג...</div>;

    if (error || !catalog) {
        return (
            <div className="text-center py-20">
                <h1 className="text-2xl font-bold text-red-500 mb-4">אופס!</h1>
                <p className="text-gray-600">{error || "משהו השתבש."}</p>
                <Link href="/" className="mt-8 inline-block px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition">חזרה לעמוד הבית</Link>
            </div>
        );
    }

    return (
        <div className="container py-12">
            {/* Header */}
            <div className="text-center mb-8">
                {catalog.image_url && (
                    <img src={catalog.image_url} alt={catalog.name} className="w-20 h-20 object-cover rounded-full mx-auto mb-4 border-2 border-gray-200 shadow" />
                )}
                <h1 className="text-3xl font-serif font-bold mb-2">{catalog.name}</h1>
                {catalog.description && <p className="text-gray-500 max-w-xl mx-auto">{catalog.description}</p>}
            </div>

            <div className="flex flex-col md:flex-row gap-8">

                {/* ── Sidebar ── */}
                <aside className="w-full md:w-64 space-y-4 flex-shrink-0">

                    {/* Search */}
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <h3 className="font-bold mb-3 border-b pb-2">חיפוש</h3>
                        <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); setCurrentPage(1); }} className="relative">
                            <input
                                type="text"
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                placeholder="חפש בושם..."
                                className="w-full p-2 pl-10 border rounded text-sm bg-white"
                            />
                            <button type="submit" className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                </svg>
                            </button>
                        </form>
                    </div>

                    {/* Category Filter */}
                    {allCategories.length > 0 && (
                        <CollapsibleSection title={`קטגוריות (${allCategories.length})`}>
                            <div className="space-y-2 text-sm max-h-[200px] overflow-y-auto pl-1">
                                {allCategories.map(cat => (
                                    <label key={cat} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                        <input
                                            type="checkbox"
                                            checked={selectedCategories.includes(cat)}
                                            onChange={() => toggleFilter(selectedCategories, setSelectedCategories, cat)}
                                            className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                        />
                                        <span className={selectedCategories.includes(cat) ? 'font-bold' : ''}>{cat}</span>
                                    </label>
                                ))}
                            </div>
                        </CollapsibleSection>
                    )}

                    {/* Gender Filter */}
                    {allGenders.length > 0 && (
                        <CollapsibleSection title="מגדר">
                            <div className="space-y-2 text-sm">
                                {allGenders.map(g => (
                                    <label key={g} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                        <input
                                            type="checkbox"
                                            checked={selectedGenders.includes(g)}
                                            onChange={() => toggleFilter(selectedGenders, setSelectedGenders, g)}
                                            className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                        />
                                        <span className={selectedGenders.includes(g) ? 'font-bold' : ''}>{g}</span>
                                    </label>
                                ))}
                            </div>
                        </CollapsibleSection>
                    )}
                </aside>

                {/* ── Product Grid ── */}
                <div className="flex-1 min-w-0">
                    {/* Top bar: count + sort */}
                    <div className="mb-4 text-sm text-gray-500 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <div>
                            <span>מציג {pagedItems.length} מוצרים (עמוד {currentPage} מתוך {Math.max(1, totalPages)})</span>
                            {/* Active filter pills */}
                            <div className="flex gap-1.5 flex-wrap mt-1">
                                {selectedCategories.map(c => (
                                    <span key={c} onClick={() => toggleFilter(selectedCategories, setSelectedCategories, c)} className="bg-black text-white text-xs px-2 py-0.5 rounded cursor-pointer hover:bg-gray-700">קטגוריה: {c} ✕</span>
                                ))}
                                {selectedGenders.map(g => (
                                    <span key={g} onClick={() => toggleFilter(selectedGenders, setSelectedGenders, g)} className="bg-black text-white text-xs px-2 py-0.5 rounded cursor-pointer hover:bg-gray-700">מגדר: {g} ✕</span>
                                ))}
                                {search && <span onClick={() => { setSearch(''); setSearchInput(''); }} className="bg-black text-white text-xs px-2 py-0.5 rounded cursor-pointer hover:bg-gray-700">חיפוש: {search} ✕</span>}
                            </div>
                        </div>
                        <select
                            value={sortBy}
                            onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }}
                            className="border rounded p-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-black"
                        >
                            <option value="newest">מין לפי: חדש ביותר</option>
                            <option value="price_asc">מחיר: נמוך לגבוה</option>
                            <option value="price_desc">מחיר: גבוה לנמוך</option>
                            <option value="name_az">שם מותג: א-ת</option>
                        </select>
                    </div>

                    {/* Grid */}
                    {pagedItems.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 rounded-lg">
                            <p className="text-xl text-gray-500">לא נמצאו מוצרים תואמים.</p>
                            <button onClick={() => { setSearch(''); setSearchInput(''); setSelectedCategories([]); setSelectedGenders([]); setCurrentPage(1); }} className="text-blue-600 mt-2 underline text-sm">נקה סינון</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            {pagedItems.map(item => (
                                <CatalogProductCard
                                    key={item.id}
                                    item={item}
                                    slug={slug}
                                    catalogId={catalog.id}
                                    catalogName={catalog.name}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-12 flex justify-center gap-2 flex-wrap" dir="rtl">
                            {currentPage > 1 && (
                                <button onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="px-4 py-2 border rounded hover:bg-gray-100 transition text-sm font-bold">הקודם</button>
                            )}
                            {(() => {
                                let start = Math.max(1, currentPage - 1);
                                let end = Math.min(totalPages, currentPage + 1);
                                if (currentPage === 1) end = Math.min(totalPages, 3);
                                if (currentPage === totalPages) start = Math.max(1, totalPages - 2);
                                const pages = [];
                                for (let i = start; i <= end; i++) pages.push(i);
                                return pages.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        className={`w-10 h-10 flex items-center justify-center rounded border font-bold text-sm transition ${p === currentPage ? 'bg-black text-white border-black' : 'bg-white hover:bg-gray-50'}`}
                                    >
                                        {p}
                                    </button>
                                ));
                            })()}
                            {currentPage < totalPages && (
                                <button onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="px-4 py-2 border rounded hover:bg-gray-100 transition text-sm font-bold">הבא</button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
