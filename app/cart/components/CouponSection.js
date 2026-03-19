"use client";

import { useState } from 'react';

export default function CouponSection({ 
    coupon, 
    setCoupon, 
    subtotal, 
    cartItems, 
    user, 
    couponError, 
    setCouponError 
}) {
    const [couponInput, setCouponInput] = useState('');
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

    const handleApplyCoupon = async () => {
        if (!couponInput) return;
        setIsValidatingCoupon(true);
        setCouponError('');

        try {
            const res = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponInput })
            });
            const data = await res.json();
            if (res.ok) {
                const couponData = data;
                let limits = couponData.limitations || {};
                if (typeof limits === 'string') {
                    try { limits = JSON.parse(limits); } catch (e) { limits = {}; }
                }

                if (limits.allowed_users?.length > 0) {
                    const userEmail = user?.primaryEmailAddress?.emailAddress;
                    if (!userEmail || !limits.allowed_users.some(u => u.trim().toLowerCase() === userEmail.trim().toLowerCase())) {
                        setCouponError('הקופון הזה אינו זמין עבור משתמש זה');
                        return;
                    }
                }

                if (limits.min_cart_total && subtotal < limits.min_cart_total) {
                    setCouponError(`הקופון אינו מגיע לסכום ${limits.min_cart_total} ₪`);
                    return;
                }

                const hasItemFilters = (limits.allowed_sizes?.length > 0) ||
                    (limits.allowed_brands?.length > 0) ||
                    (limits.allowed_categories?.length > 0) ||
                    (limits.allowed_products?.length > 0);

                if (hasItemFilters) {
                    let hasMatch = false;
                    cartItems.forEach(item => {
                        let isItemEligible = true;
                        if (limits.allowed_sizes?.length > 0) {
                            const sizeStr = String(item.size).replace(/\D/g, '');
                            const sizeInt = sizeStr ? parseInt(sizeStr) : null;
                            if (sizeInt && !limits.allowed_sizes.some(s => parseInt(s) === sizeInt)) isItemEligible = false;
                        }
                        if (limits.allowed_brands?.length > 0) {
                            if (!item.brand || !limits.allowed_brands.some(b => b.trim().toLowerCase() === item.brand.trim().toLowerCase())) isItemEligible = false;
                        }
                        if (limits.allowed_categories?.length > 0) {
                            if (!item.category || !limits.allowed_categories.some(c => c.trim().toLowerCase() === item.category.trim().toLowerCase())) isItemEligible = false;
                        }
                        if (limits.allowed_products?.length > 0) {
                            if (!item.id || !limits.allowed_products.some(pid => String(pid).trim() === String(item.id).trim())) isItemEligible = false;
                        }
                        if (isItemEligible) hasMatch = true;
                    });

                    if (!hasMatch) {
                        setCouponError('הקופון הזה אינו חל על פריטים בסל שלך');
                        return;
                    }
                }

                setCoupon({
                    code: data.code,
                    discountPercent: data.discountPercent,
                    limitations: limits
                });
                setCouponInput('');
            } else {
                setCouponError('קוד קופון לא תקין');
            }
        } catch (e) {
            console.error(e);
            setCouponError('שגיאה בבדיקת הקופון');
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    return (
        <div className="border-t border-b py-4">
            {coupon ? (
                <div className="flex justify-between items-center bg-green-50 p-3 rounded border border-green-200">
                    <div>
                        <div className="font-bold text-green-700">קופון {coupon.code}</div>
                        <div className="text-xs text-green-600">הנחה של {coupon.discountPercent}%</div>
                    </div>
                    <button onClick={() => setCoupon(null)} className="text-red-500 hover:bg-red-50 p-1 rounded">✕</button>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="קוד קופון"
                            className={`flex-1 p-2 border rounded ${couponError ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-500' : ''}`}
                            value={couponInput}
                            onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); if (couponError) setCouponError(''); }}
                        />
                        <button
                            onClick={handleApplyCoupon}
                            disabled={isValidatingCoupon || !couponInput}
                            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-black disabled:opacity-50"
                        >
                            {isValidatingCoupon ? '...' : 'החל'}
                        </button>
                    </div>
                    {couponError && (
                        <div className="text-red-600 text-sm font-bold flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {couponError}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
