"use client";

import Image from "next/image";
import { useMemo } from 'react';

export default function UpsellRecs({ 
    isMainVendor, 
    nextTier, 
    upsellProducts, 
    cartItems, 
    addToCart 
}) {
    const recommendations = useMemo(() => {
        if (!isMainVendor || nextTier <= 0) return [];
        return upsellProducts
            .filter(p => !cartItems.some(item => item.id === p.id))
            .map(p => {
                const sizes = [
                    { size: '2', price: Number(p.price_2ml) },
                    { size: '5', price: Number(p.price_5ml) },
                    { size: '10', price: Number(p.price_10ml) }
                ].filter(s => s.price > 0);
                let bestMatch = sizes.find(s => s.price >= nextTier) || sizes[sizes.length - 1];
                return { ...p, ...bestMatch };
            }).slice(0, 3);
    }, [isMainVendor, nextTier, upsellProducts, cartItems]);

    if (!isMainVendor || recommendations.length === 0) return null;

    return (
        <div className="mt-12 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm animate-fade-in">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span>🚀</span>
                <span>השלמות שוות לסל</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recommendations.map(p => (
                    <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-50 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all group">
                        <div className="w-16 h-16 relative flex-shrink-0 bg-white rounded-lg overflow-hidden border border-gray-100">
                            <Image src={p.image_url} alt={p.name} fill className="object-contain p-2" sizes="64px" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm truncate">{p.name}</h4>
                            <p className="text-xs text-gray-500">{p.size} מ"ל ב-{p.price} ₪</p>
                            <button
                                onClick={() => addToCart(p, p.size, p.price)}
                                className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 underline uppercase tracking-tight"
                            >
                                הוסף לסל +
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <p className="mt-4 text-xs text-gray-400 text-center">הוספת מוצרים אלו עשויה לזכות אותך בדוגמיות נוספות!</p>
        </div>
    );
}
