"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function DiscoveryTimer() {
    const { t } = useLanguage();
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isActive, setIsActive] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        
        const updateTimer = () => {
            const now = new Date();
            const dayOfWeek = now.getDay(); // 0 is Sunday, 4 is Thursday, 5 is Friday
            const currentHour = now.getHours();
            
            // Promo is active from Thursday (4) 00:00 to Friday (5) 18:00
            let active = false;
            let targetDate = new Date(now);

            if (dayOfWeek === 4) {
                // It's Thursday. Active until Friday 18:00.
                active = true;
                targetDate.setDate(now.getDate() + 1); // Friday
                targetDate.setHours(18, 0, 0, 0);
            } else if (dayOfWeek === 5 && currentHour < 18) {
                // It's Friday before 18:00. Active until today 18:00.
                active = true;
                targetDate.setHours(18, 0, 0, 0);
            } else {
                // Not active. Target is next Thursday 00:00.
                active = false;
                let daysUntilThursday = (4 - dayOfWeek + 7) % 7;
                if (daysUntilThursday === 0 && currentHour >= 18) {
                    daysUntilThursday = 7; // Next Thursday
                }
                targetDate.setDate(now.getDate() + daysUntilThursday);
                targetDate.setHours(0, 0, 0, 0);
            }

            setIsActive(active);

            const diff = targetDate - now;
            if (diff > 0) {
                setTimeLeft({
                    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((diff / 1000 / 60) % 60),
                    seconds: Math.floor((diff / 1000) % 60)
                });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, []);

    if (!mounted) return null;

    const locale = typeof document !== 'undefined' ? document.documentElement.lang : 'he';

    return (
        <div className="w-full max-w-3xl mx-auto mb-10 overflow-hidden rounded-3xl shadow-lg border border-gray-100 bg-white">
            <div className={`p-1 text-center text-sm font-bold text-white uppercase tracking-widest ${isActive ? 'bg-black' : 'bg-gray-400'}`}>
                {isActive 
                    ? (locale === 'he' ? 'מבצע סוף השבוע פעיל!' : 'WEEKEND SALE ACTIVE!')
                    : (locale === 'he' ? 'המבצע הבא מתחיל בעוד:' : 'NEXT SALE STARTS IN:')}
            </div>
            
            <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 text-center md:text-right">
                    <h3 className="text-2xl font-black mb-2">
                        {locale === 'he' ? 'חגיגת דיסקברי ודוגמיות' : 'Discovery & Samples Event'}
                    </h3>
                    <p className="text-gray-600 font-medium">
                        {locale === 'he' ? 'על כל דיסקברי סט' : 'On every Discovery Set'} <span className="text-black font-bold text-lg bg-gray-100 px-2 py-0.5 rounded">3+1</span>
                    </p>
                    <p className="text-gray-600 font-medium mt-1">
                        {locale === 'he' ? 'על כל הדוגמיות הרשמיות' : 'On all Official Samples'} <span className="text-black font-bold text-lg bg-gray-100 px-2 py-0.5 rounded">8+2</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                        {locale === 'he' ? '*הפריט/ים הזול/ים ביותר חינם. מתעדכן אוטומטית בעגלה.' : '*Cheapest item(s) free. Automatically applied in cart.'}
                    </p>
                </div>

                <div className="flex items-center justify-center gap-3 md:gap-4" dir="ltr">
                    {[
                        { label: locale === 'he' ? 'ימים' : 'Days', value: timeLeft.days },
                        { label: locale === 'he' ? 'שעות' : 'Hours', value: timeLeft.hours },
                        { label: locale === 'he' ? 'דקות' : 'Mins', value: timeLeft.minutes },
                        { label: locale === 'he' ? 'שניות' : 'Secs', value: timeLeft.seconds }
                    ].map((unit, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                            <div className={`w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-2xl text-2xl md:text-3xl font-black ${isActive ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {String(unit.value).padStart(2, '0')}
                            </div>
                            <span className={`text-[10px] md:text-xs mt-2 uppercase font-bold tracking-wider ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                                {unit.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
