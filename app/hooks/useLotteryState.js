import { useState, useEffect } from "react";

export function useLotteryState(cartItems) {
    const [lotteryMode, setLotteryMode] = useState({ active: false, expiresAt: null });
    const [lotteryTimeLeft, setLotteryTimeLeft] = useState(null);
    const [luckyPrize, setLuckyPrize] = useState(null);

    // Initial Load
    useEffect(() => {
        const savedLottery = localStorage.getItem("lotteryMode");
        if (savedLottery) {
            try {
                const parsed = JSON.parse(savedLottery);
                if (parsed.active && parsed.expiresAt > Date.now()) setLotteryMode(parsed);
                else localStorage.removeItem("lotteryMode");
            } catch (e) { console.error(e); }
        }
    }, []);

    // Persistence
    useEffect(() => {
        if (lotteryMode.active) localStorage.setItem("lotteryMode", JSON.stringify(lotteryMode));
        else localStorage.removeItem("lotteryMode");
    }, [lotteryMode]);

    // Timer Interval for Lottery
    useEffect(() => {
        let interval;
        if (lotteryMode.active && lotteryMode.expiresAt) {
            interval = setInterval(() => {
                const now = Date.now();
                const diff = lotteryMode.expiresAt - now;
                if (diff <= 0) {
                    localStorage.removeItem("lotteryMode");
                    setLotteryMode({ active: false, expiresAt: null });
                    setLotteryTimeLeft(null);
                } else {
                    setLotteryTimeLeft(Math.floor(diff / 1000));
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [lotteryMode]);

    // Safety: Auto-unlock if cart is empty
    useEffect(() => {
        if (lotteryMode.active && cartItems.filter(i => (i.vendorId || 'main') === 'main').length === 0) {
            setLotteryMode({ active: false, expiresAt: null });
            setLotteryTimeLeft(null);
            localStorage.removeItem("lotteryMode");
        }
    }, [cartItems, lotteryMode.active]);

    const isCartLocked = lotteryMode.active;

    const startLottery = (items, setCartItems, setActiveVendorId) => {
        const newCart = items.map(p => ({ ...p, quantity: 1, isLotteryItem: true, vendorId: 'main' }));
        setCartItems(newCart);
        const duration = 10 * 60 * 1000;
        setLotteryMode({ active: true, expiresAt: Date.now() + duration });
        setActiveVendorId('main');
    };

    const cancelLottery = (setCartItems) => {
        setLotteryMode({ active: false, expiresAt: null });
        setLotteryTimeLeft(null);
        setCartItems([]);
    };

    const clearLottery = () => {
        setLotteryMode({ active: false, expiresAt: null });
        setLotteryTimeLeft(null);
        setLuckyPrize(null);
        localStorage.removeItem("lotteryMode");
    };

    return {
        lotteryMode, setLotteryMode,
        lotteryTimeLeft, setLotteryTimeLeft,
        luckyPrize, setLuckyPrize,
        isCartLocked,
        startLottery, cancelLottery, clearLottery
    };
}
