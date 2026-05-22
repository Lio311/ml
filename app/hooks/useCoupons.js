import { useState, useEffect } from "react";
import toast from 'react-hot-toast';

export function useCoupons(cartItems, activeVendorId, user) {
    const [coupon, setCoupon] = useState(null);

    // Initial Load
    useEffect(() => {
        const savedCoupon = localStorage.getItem("coupon");
        if (savedCoupon) {
            try { setCoupon(JSON.parse(savedCoupon)); } catch (e) { console.error(e); }
        }
    }, []);

    // Persistence
    useEffect(() => {
        if (coupon) localStorage.setItem("coupon", JSON.stringify(coupon));
        else localStorage.removeItem("coupon");
    }, [coupon]);

    // Coupon Expiration (20 minutes)
    useEffect(() => {
        if (!coupon) return;
        
        let addedAt = coupon.addedAt;
        if (!addedAt) {
            addedAt = Date.now();
            setCoupon({ ...coupon, addedAt });
            return;
        }

        const expiresAt = addedAt + (20 * 60 * 1000); // 20 minutes in ms
        const timeRemaining = expiresAt - Date.now();

        if (timeRemaining <= 0) {
            setCoupon(null);
            toast.error("תוקף הקופון בעגלה פג (20 דקות). באפשרותך להזין אותו מחדש.");
            return;
        }

        const timeout = setTimeout(() => {
            setCoupon(null);
            toast.error("תוקף הקופון בעגלה פג (20 דקות). באפשרותך להזין אותו מחדש.");
        }, timeRemaining);

        return () => clearTimeout(timeout);
    }, [coupon]);

    // Re-validate coupon security when user state or cart changes
    useEffect(() => {
        if (!coupon || !coupon.code) return;
        
        const currentActiveItems = cartItems.filter(item => (item.vendorId || 'main') === activeVendorId);
        const currentSubtotal = currentActiveItems.reduce((sum, i) => sum + (Number(i.price) * i.quantity), 0);
        const limits = coupon.limitations || {};

        // 1. Instant Local Validation (UX)
        if (limits.min_cart_total && currentSubtotal < Number(limits.min_cart_total)) {
            setCoupon(null);
            localStorage.removeItem("coupon");
            toast.error(`הקופון הוסר: סכום הסל (₪${currentSubtotal}) נמוך מהמינימום הנדרש (₪${limits.min_cart_total})`);
            return;
        }

        // 2. Instant Item Eligibility Check
        const hasEligible = !limits.allowed_products || limits.allowed_products.length === 0 || 
            currentActiveItems.some(item => {
                let cleanId = item.id;
                if (typeof cleanId === 'string' && cleanId.includes('-')) cleanId = cleanId.split('-')[0];
                return limits.allowed_products.map(String).includes(String(cleanId));
            });
        
        if (!hasEligible) {
            setCoupon(null);
            localStorage.removeItem("coupon");
            toast.error("הקופון הוסר כיוון שהסל לא מכיל פריטים התואמים למבצע");
            return;
        }

        // 3. Debounced Server-side Security Recheck
        const revalidate = async () => {
            try {
                const res = await fetch("/api/coupons/validate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        code: coupon.code,
                        subtotal: currentSubtotal,
                        items: currentActiveItems,
                        userEmail: user?.primaryEmailAddress?.emailAddress
                    }),
                });
                if (!res.ok) {
                    const data = await res.json();
                    setCoupon(null);
                    localStorage.removeItem("coupon");
                    if (data.error) toast.error(data.error);
                }
            } catch (e) {
                console.error("Coupon re-validation failed", e);
            }
        };
        
        const timer = setTimeout(revalidate, 1000); 
        return () => clearTimeout(timer);
    }, [user?.id, cartItems, activeVendorId]);

    const clearCoupon = () => {
        setCoupon(null);
    };

    return { coupon, setCoupon, clearCoupon };
}
