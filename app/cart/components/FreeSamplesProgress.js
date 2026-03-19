"use client";

export default function FreeSamplesProgress({ 
    isMainVendor, 
    subtotal, 
    freeSamplesCount, 
    vendorConfig 
}) {
    if (isMainVendor) {
        return (
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2 text-right justify-start">
                    <span>🎁</span>
                    {freeSamplesCount === 6 ? (
                        <span className="text-green-600">קיבלת את כל הדוגמיות! (6)</span>
                    ) : (
                        <span>דוגמיות חינם</span>
                    )}
                </h3>

                <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div
                        className="absolute top-0 right-0 h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-1000 ease-out rounded-full"
                        style={{ width: `${Math.min(100, (subtotal / 1000) * 100)}%` }}
                    ></div>
                    <div className="absolute top-0 right-[30%] h-full w-0.5 bg-white/50 z-10" title="300₪ - 2 דוגמיות"></div>
                    <div className="absolute top-0 right-[50%] h-full w-0.5 bg-white/50 z-10" title="500₪ - 4 דוגמיות"></div>
                </div>

                <div className="flex justify-between text-[10px] text-gray-400 font-medium px-1">
                    <span className={subtotal >= 0 ? "text-gray-900 font-bold" : ""}>0</span>
                    <span className={subtotal >= 300 ? "text-blue-600 font-bold" : ""}>300 (2)</span>
                    <span className={subtotal >= 500 ? "text-purple-600 font-bold" : ""}>500 (4)</span>
                    <span className={subtotal >= 1000 ? "text-green-600 font-bold" : ""}>1000 (6)</span>
                </div>

                <div className="mt-3 text-xs text-center font-bold">
                    {freeSamplesCount === 0 && <span className="text-gray-500">עוד <span className="font-bold text-black">{300 - subtotal} ₪</span> ל-2 דוגמיות חינם!</span>}
                    {freeSamplesCount === 2 && <span className="text-blue-600">יש לך 2 דוגמיות. עוד <span className="font-bold">{500 - subtotal} ₪</span> ל-4 דוגמיות!</span>}
                    {freeSamplesCount === 4 && <span className="text-purple-600">וואו! 4 דוגמיות שלך. עוד <span className="font-bold">{1000 - subtotal} ₪</span> ל-6 דוגמיות!</span>}
                    {freeSamplesCount === 6 && <span className="text-green-600 font-bold">פינקנו אותך ב-6 דוגמיות! תהנה! 🎉</span>}
                </div>
            </div>
        );
    }

    // Vendor specific tiers
    let tiers = [];
    try {
        tiers = typeof vendorConfig?.sample_tiers === 'string' ? JSON.parse(vendorConfig.sample_tiers) : (vendorConfig?.sample_tiers || []);
    } catch (e) { tiers = []; }

    if (tiers.length === 0) {
        if (!isMainVendor && freeSamplesCount > 0) {
             return (
                <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-center gap-3 animate-bounce">
                    <div className="bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl">🎁</div>
                    <div>
                        <p className="text-green-900 font-bold text-sm">הטבה מחכה לך!</p>
                        <p className="text-green-700 text-xs font-medium">מגיע לך {freeSamplesCount} דוגמיות חינם בהזמנה זו!</p>
                    </div>
                </div>
            );
        }
        return null;
    }

    const sortedTiers = [...tiers].sort((a, b) => a.minAmount - b.minAmount);
    const maxTierSum = sortedTiers[sortedTiers.length - 1].minAmount;
    const currentTier = sortedTiers.filter(t => subtotal >= t.minAmount).reverse()[0];

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2 text-right justify-start">
                <span>🎁</span>
                {currentTier ? (
                    <span className="text-green-600">קיבלת {currentTier.samplesCount} דוגמיות חינם!</span>
                ) : (
                    <span>דוגמיות חינם</span>
                )}
            </h3>

            <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div
                    className="absolute top-0 right-0 h-full bg-gradient-to-r from-green-400 to-emerald-600 transition-all duration-1000 ease-out rounded-full"
                    style={{ width: `${Math.min(100, (subtotal / maxTierSum) * 100)}%` }}
                ></div>
                {sortedTiers.map((t, idx) => (
                    <div
                        key={idx}
                        className="absolute top-0 h-full w-0.5 bg-white/50 z-10"
                        style={{ right: `${(t.minAmount / maxTierSum) * 100}%` }}
                        title={`${t.minAmount}₪ - ${t.samplesCount} דוגמיות`}
                    ></div>
                ))}
            </div>
            
            <div className="flex justify-between text-[10px] text-gray-400 font-medium px-1">
                 <span>0</span>
                 {sortedTiers.map(t => <span key={t.minAmount}>{t.minAmount} ({t.samplesCount})</span>)}
            </div>
        </div>
    );
}
