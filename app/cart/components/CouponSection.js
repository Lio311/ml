"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useLanguage } from "../../context/LanguageContext";

export default function CouponSection({ 
    coupon, 
    setCoupon, 
    subtotal, 
    cartItems, 
    user,
    couponError,
    setCouponError
}) {
    const { t } = useLanguage();
    const [couponCode, setCouponCode] = useState("");
    const [isValidating, setIsValidating] = useState(false);

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setIsValidating(true);
        setCouponError("");

        try {
            const res = await fetch("/api/coupons/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    code: couponCode,
                    subtotal,
                    items: cartItems,
                    userEmail: user?.primaryEmailAddress?.emailAddress
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setCoupon(data.coupon);
                setCouponCode("");
            } else {
                // Map error messages to translation keys
                const errorMap = {
                    "הקופון הזה אינו זמין עבור משתמש זה": "cart.coupon_not_available",
                    "קוד קופון לא תקין או פג תוקף": "cart.coupon_invalid"
                };
                
                let errorKey = errorMap[data.error] || "cart.coupon_invalid";
                
                if (data.error?.includes("סכום")) {
                    setCouponError(t('cart.coupon_min_total', { total: data.min_total }));
                } else if (data.error?.includes("פריטים")) {
                    setCouponError(t('cart.coupon_not_eligible'));
                } else {
                    setCouponError(t(errorKey));
                }
            }
        } catch (error) {
            setCouponError(t('cart.coupon_error'));
        } finally {
            setIsValidating(false);
        }
    };

    return (
        <div className="space-y-3">
            {!coupon ? (
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder={t('cart.coupon_placeholder')}
                        className={`flex-1 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-black transition ${couponError ? 'border-red-500 bg-red-50' : ''}`}
                        value={couponCode}
                        onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase());
                            setCouponError("");
                        }}
                    />
                    <button
                        onClick={handleApplyCoupon}
                        disabled={isValidating || !couponCode}
                        className="px-6 py-3 bg-gray-100 text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition disabled:opacity-50"
                    >
                        {isValidating ? "..." : t('cart.apply_coupon')}
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-2">
                        <span className="text-green-600">🎟️</span>
                        <div>
                            <p className="text-sm font-bold text-green-800">{t('cart.coupon_applied', { code: coupon.code })}</p>
                            <p className="text-xs text-green-600">
                                {coupon.discount_type === 'percent' 
                                    ? t('cart.discount', { percent: coupon.discount_value })
                                    : `${coupon.discount_value} ₪ ${t('cart.discount_amount', { defaultValue: 'הנחה' })}`}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setCoupon(null)}
                        className="text-green-800 hover:text-red-600 transition p-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
            {couponError && (
                <p className="text-red-500 text-xs font-bold animate-pulse px-1">
                    {couponError}
                </p>
            )}
        </div>
    );
}
