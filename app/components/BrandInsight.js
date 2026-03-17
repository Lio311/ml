import { getBrandInsight } from '../lib/brandData';

export default function BrandInsight({ brand }) {
    const insight = getBrandInsight(brand);
    
    if (!insight) return null;

    return (
        <section className="mt-16 pt-12 border-t border-gray-100 bg-gray-50/50 rounded-3xl p-8 md:p-12 mb-12">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-right">
                    
                    {/* Brand Meta */}
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4 justify-end md:justify-start flex-row-reverse">
                            <span className="bg-black text-white p-2 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            </span>
                            <h2 className="text-2xl font-serif font-bold text-gray-900 leading-tight">
                                {insight.title}
                            </h2>
                        </div>
                        
                        <p className="text-gray-600 leading-relaxed text-sm md:text-base mb-6">
                            {insight.description}
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <h4 className="text-xs uppercase tracking-widest text-gray-400 mb-2 font-bold">החתימה של המותג</h4>
                                <p className="text-sm text-gray-800 leading-snug">
                                    {insight.highlights}
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <h4 className="text-xs uppercase tracking-widest text-gray-400 mb-2 font-bold">האף שמאחורי הקלעים</h4>
                                <p className="text-sm text-gray-800 leading-snug">
                                    {insight.perfumer}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                        הוכן עבור ml_tlv - מגזין הבישום והנישה
                    </p>
                </div>
            </div>
        </section>
    );
}
