"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import toast from 'react-hot-toast';


export default function LotteryAdminPage() {
    const { user } = useUser();
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState("all"); // all, in_lottery, not_in_lottery
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;


    // Fetch products
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products?limit=1000'); // Fetch mostly all for this table, or use pagination if needed. For now assuming < 1000
            const data = await res.json();
            if (data.products) {
                setProducts(data.products);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleLotteryStatus = async (productId, currentStatus) => {
        // Optimistic update
        const newStatus = !currentStatus;
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, in_lottery: newStatus } : p));

        try {
            const res = await fetch('/api/products', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                // We need to send enough data to satisfy the PUT endpoint which updates a lot of fields.
                // However, the current PUT endpoint expects ALL fields. 
                // We might need to fetch the full product details first or update the API to support partial updates (PATCH).
                // Or, ensuring we pass existing values back.
                // CAUTION: The existing PUT implementation replaces ALL fields.
                // We must be careful!
                // Let's check `AdminProductsClient.js` logic. It sends `editForm` which has defaults.
                // Ideally we should have a PATCH endpoint or a specific endpoint for toggling.
                // But to be safe with existing robust generic API:
                // We will find the product object from state and send it back with flipped boolean.
                body: JSON.stringify({
                    id: productId,
                    ...products.find(p => p.id === productId),
                    in_lottery: newStatus
                })
            });

            if (!res.ok) {
                throw new Error("Failed to update");
            }
        } catch (error) {
            toast.error("שגיאה בעדכון סטטוס");
            // Revert
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, in_lottery: currentStatus } : p));
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.model.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === "all" ||
            (filter === "in_lottery" && (product.in_lottery ?? true)) ||
            (filter === "not_in_lottery" && !(product.in_lottery ?? true));
        return matchesSearch && matchesFilter;
    });

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const currentUserRole = user?.publicMetadata?.role;
    const canEdit = currentUserRole === 'admin' || user?.emailAddresses[0]?.emailAddress === process.env.ADMIN_EMAIL;


    if (loading) return <div className="p-8 text-center">טוען נתונים...</div>;

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">ניהול מאגר הגרלות</h1>

            <div className="flex flex-col md:flex-row gap-4 mb-6 md:mb-8 justify-between items-start md:items-center">
                <div className="w-full md:w-auto">
                    <input
                        className="w-full md:w-64 border p-3 md:p-2 rounded-xl text-sm focus:ring-2 focus:ring-black outline-none"
                        placeholder="חפש לפי מותג או דגם..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 w-full md:w-auto scrollbar-hide">
                    <button
                        onClick={() => setFilter("all")}
                        className={`px-4 py-2 rounded-xl text-xs font-black shadow-sm transition-all whitespace-nowrap ${filter === 'all' ? 'bg-black text-white shadow-black/20' : 'bg-white border text-gray-400'}`}
                    >
                        הכל
                    </button>
                    <button
                        onClick={() => setFilter("in_lottery")}
                        className={`px-4 py-2 rounded-xl text-xs font-black shadow-sm transition-all whitespace-nowrap ${filter === 'in_lottery' ? 'bg-green-600 text-white shadow-green-200' : 'bg-white border text-gray-400'}`}
                    >
                        נכללים ({products.filter(p => p.in_lottery ?? true).length})
                    </button>
                    <button
                        onClick={() => setFilter("not_in_lottery")}
                        className={`px-4 py-2 rounded-xl text-xs font-black shadow-sm transition-all whitespace-nowrap ${filter === 'not_in_lottery' ? 'bg-red-600 text-white shadow-red-200' : 'bg-white border text-gray-400'}`}
                    >
                        לא נכללים ({products.filter(p => !(p.in_lottery ?? true)).length})
                    </button>
                </div>
            </div>

                {/* Desktop Table */}
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-right border-collapse">
                        <thead className="bg-gray-50 text-gray-500 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100">
                            <tr>
                                <th className="p-4 text-center">תמונה</th>
                                <th className="p-4 text-center">מותג / דגם</th>
                                <th className="p-4 text-center">מחיר 10 מ״ל</th>
                                <th className="p-4 text-center">מלאי</th>
                                <th className="p-4 text-center">סטטוס הגרלה</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paginatedProducts.map(product => (
                                <tr key={product.id} className={`hover:bg-gray-50/50 transition-colors ${(product.in_lottery ?? true) ? '' : 'opacity-60 bg-gray-50/20'}`}>
                                    <td className="p-4">
                                        <div className="w-16 h-16 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex items-center justify-center p-1.5 mx-auto">
                                            {product.image_url ? (
                                                <img 
                                                    src={product.image_url} 
                                                    alt={product.model} 
                                                    className="max-w-full max-h-full object-contain" 
                                                />
                                            ) : (
                                                <span className="text-2xl opacity-40">🧴</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="font-black text-gray-900 leading-tight">{product.brand}</div>
                                        <div className="text-[12px] text-gray-400 font-medium mt-0.5">{product.model}</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="font-mono text-base font-black text-gray-800 tracking-tight">{product.price_10ml} ₪</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-tight shadow-sm border ${product.stock > 0 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                            {product.stock} מ״ל
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex flex-col items-center gap-1.5">
                                            <button
                                                onClick={() => toggleLotteryStatus(product.id, product.in_lottery ?? true)}
                                                disabled={!canEdit}
                                                dir="ltr"
                                                className={`
                                                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500
                                                    ${(product.in_lottery ?? true) ? 'bg-emerald-500' : 'bg-gray-200'}
                                                    ${!canEdit ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:brightness-105 active:scale-95'}
                                                `}
                                            >
                                                <span
                                                    className={`
                                                        inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out
                                                        ${(product.in_lottery ?? true) ? 'translate-x-5' : 'translate-x-1'}
                                                    `}
                                                />
                                            </button>
                                            <div className={`text-[10px] uppercase font-black tracking-tighter ${(product.in_lottery ?? true) ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                {(product.in_lottery ?? true) ? 'כלול' : 'מושבת'}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                    {paginatedProducts.map(product => (
                        <div key={product.id} className={`bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex gap-5 transition-all ${(product.in_lottery ?? true) ? '' : 'opacity-70 grayscale-[0.3]'}`}>
                            <div className="w-24 h-24 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex items-center justify-center p-2.5 flex-shrink-0">
                                {product.image_url ? (
                                    <img 
                                        src={product.image_url} 
                                        alt={product.model} 
                                        className="max-w-full max-h-full object-contain" 
                                    />
                                ) : (
                                    <span className="text-3xl opacity-30">🧴</span>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-1">
                                <div>
                                    <div className="text-sm font-black text-gray-900 leading-tight">{product.brand}</div>
                                    <div className="text-[11px] text-gray-500 font-bold mb-3 tracking-tight">{product.model}</div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-base font-mono font-black text-black">{product.price_10ml} ₪</div>
                                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-tight border shadow-sm ${product.stock > 0 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                            {product.stock} מ״ל
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-3 mt-auto border-t border-gray-50/50">
                                    <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">סטטוס הגרלה</div>
                                    <div className="flex items-center gap-3">
                                        <div className={`text-[10px] font-black uppercase tracking-tighter ${(product.in_lottery ?? true) ? 'text-green-600' : 'text-gray-400'}`}>
                                            {(product.in_lottery ?? true) ? 'פעיל' : 'כבוי'}
                                        </div>
                                        <button
                                            onClick={() => toggleLotteryStatus(product.id, product.in_lottery ?? true)}
                                            disabled={!canEdit}
                                            dir="ltr"
                                            className={`
                                                relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 outline-none
                                                ${(product.in_lottery ?? true) ? 'bg-emerald-500' : 'bg-gray-200'}
                                                ${!canEdit ? 'opacity-30' : 'active:scale-90'}
                                            `}
                                        >
                                            <span
                                                className={`
                                                    inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out
                                                    ${(product.in_lottery ?? true) ? 'translate-x-5' : 'translate-x-1'}
                                                `}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {filteredProducts.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="text-4xl mb-4">🔍</div>
                        <div className="text-gray-400 font-bold text-lg">לא נמצאו מוצרים תואמים</div>
                        <button 
                            onClick={() => {setSearchTerm(""); setFilter("all");}}
                            className="mt-4 text-blue-600 font-black text-sm hover:underline"
                        >
                            נקה את כל המסננים
                        </button>
                    </div>
                )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-6 mt-10">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-3 bg-white border border-gray-100 rounded-2xl disabled:opacity-30 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                        title="הקודם"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                    <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">עמוד</span>
                        <span className="text-sm font-black text-gray-900 leading-none">
                            {currentPage} <span className="text-gray-300 mx-1">/</span> {totalPages}
                        </span>
                    </div>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-3 bg-white border border-gray-100 rounded-2xl disabled:opacity-30 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                        title="הבא"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                </div>
            )}

        </div>
    );
}
