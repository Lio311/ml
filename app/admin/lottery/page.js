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
    const canEdit = currentUserRole === 'admin' || user?.emailAddresses[0]?.emailAddress === 'lior31197@gmail.com';


    if (loading) return <div className="p-8 text-center">טוען נתונים...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">ניהול מאגר הגרלות (Lottery Pool)</h1>

            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
                <div className="flex gap-2 w-full md:w-auto">
                    <input
                        className="border p-2 rounded w-full md:w-64"
                        placeholder="חפש לפי מותג או דגם..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter("all")}
                        className={`px-4 py-2 rounded font-bold ${filter === 'all' ? 'bg-black text-white' : 'bg-gray-200'}`}
                    >
                        הכל
                    </button>
                    <button
                        onClick={() => setFilter("in_lottery")}
                        className={`px-4 py-2 rounded font-bold ${filter === 'in_lottery' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
                    >
                        נכללים בהגרלה ({products.filter(p => p.in_lottery ?? true).length})
                    </button>
                    <button
                        onClick={() => setFilter("not_in_lottery")}
                        className={`px-4 py-2 rounded font-bold ${filter === 'not_in_lottery' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
                    >
                        לא נכללים ({products.filter(p => !(p.in_lottery ?? true)).length})
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-right border-collapse">
                    <thead className="bg-gray-100 text-gray-600 text-sm uppercase">
                        <tr>
                            <th className="p-4 border-b">תמונה</th>
                            <th className="p-4 border-b">מותג / דגם</th>
                            <th className="p-4 border-b">מחיר 10 מ״ל</th>
                            <th className="p-4 border-b">מלאי</th>
                            <th className="p-4 border-b text-center">סטטוס הגרלה</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {paginatedProducts.map(product => (
                            <tr key={product.id} className="hover:bg-gray-50 trantision">

                                <td className="p-4">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.model} className="w-12 h-12 object-cover rounded shadow-sm border" />
                                    ) : (
                                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xl">🧴</div>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="font-bold">{product.brand}</div>
                                    <div className="text-gray-500 text-sm">{product.model}</div>
                                </td>
                                <td className="p-4 font-mono">
                                    {product.price_10ml} ₪
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {product.stock} מ״ל
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <button
                                        onClick={() => toggleLotteryStatus(product.id, product.in_lottery ?? true)}
                                        disabled={!canEdit}
                                        className={`
                                            relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black
                                            ${(product.in_lottery ?? true) ? 'bg-green-500' : 'bg-gray-300'}
                                            ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}
                                        `}
                                    >

                                        <span
                                            className={`
                                                inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                                                ${(product.in_lottery ?? true) ? 'translate-x-1' : 'translate-x-9'}
                                            `}
                                        />
                                    </button>
                                    <div className="text-xs mt-1 text-gray-500 font-bold">
                                        {(product.in_lottery ?? true) ? 'פעיל' : 'כבוי'}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredProducts.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        לא נמצאו מוצרים
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-white border rounded disabled:opacity-50 hover:bg-gray-50"
                    >
                        הקודם
                    </button>
                    <span className="text-gray-600">
                        עמוד {currentPage} מתוך {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-white border rounded disabled:opacity-50 hover:bg-gray-50"
                    >
                        הבא
                    </button>
                </div>
            )}

        </div>
    );
}
