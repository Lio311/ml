import React from 'react';

export default function AnalyticsTables({ topBrands, topSizes, monthName }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Top Brands Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b bg-gray-50/50">
                    <h3 className="font-bold text-gray-800 text-lg">חמשת המותגים הכי מוכרים - {monthName}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right" dir="rtl">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                            <tr>
                                <th className="p-4">שם המותג</th>
                                <th className="p-4 text-left">מכירות ברוטו (ש״ח)*</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {topBrands && topBrands.length > 0 ? (
                                topBrands.map((brand, index) => (
                                    <tr key={index} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold">
                                                    {index + 1}
                                                </span>
                                                <span className="font-bold text-gray-700">{brand.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-left font-mono font-bold text-gray-900">
                                            {parseFloat(brand.sales).toLocaleString()} ₪
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="2" className="p-8 text-center text-gray-400 text-sm italic">
                                        אין עדיין נתוני מכירות ל{monthName}...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <div className="bg-gray-50 text-[10px] text-gray-400 p-2 text-center">
                        * לפי שווי פריט בעת ההזמנה (לפני הנחות/קופונים)
                    </div>
                </div>
            </div>

            {/* Top Sizes Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b bg-gray-50/50">
                    <h3 className="font-bold text-gray-800 text-lg">הגדלים הכי מוכרים - {monthName}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right" dir="rtl">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                            <tr>
                                <th className="p-4">גודל דוגמית (מ״ל)</th>
                                <th className="p-4 text-left">מכירות ברוטו (ש״ח)*</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {topSizes && topSizes.length > 0 ? (
                                topSizes.map((size, index) => (
                                    <tr key={index} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="p-4 text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                                <span className="font-bold">{size.size} מ״ל</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-left font-mono font-bold text-gray-900">
                                            {parseFloat(size.sales).toLocaleString()} ₪
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="2" className="p-8 text-center text-gray-400 text-sm italic">
                                        אין עדיין נתוני מכירות ל{monthName}...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
