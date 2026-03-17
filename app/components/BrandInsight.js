import { getBrandInsight } from '../lib/brandData';

export default function BrandInsight({ brand }) {
    const insight = getBrandInsight(brand);
    
    if (!insight) return null;

    return (
        <section className="mt-12 py-12 border-t border-gray-100 bg-white">
            <div className="max-w-5xl mx-auto px-4 md:px-0">
                <div className="flex flex-col gap-6 text-right">
                    
                    {/* Brand Meta */}
                    <div className="flex-1">
                        <div className="mb-6">
                            <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 leading-tight">
                                {insight.title}
                            </h2>
                        </div>
                        
                        <p className="text-gray-700 leading-relaxed text-base md:text-lg mb-8 max-w-none text-justify group">
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
