"use client";

import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, Truck, Sparkles, MessageCircle } from 'lucide-react';

export default function TrustSection() {
    const { t, dir } = useLanguage();
    const isRTL = dir === 'rtl';

    const items = [
        {
            icon: <ShieldCheck className="w-6 h-6" />,
            title: isRTL ? "100% מקוריות בהתחייבות" : "100% Guaranteed Original",
            desc: isRTL ? "אנחנו שואבים ישירות מהבקבוקים המקוריים בלבד. בלי פשרות." : "We draw directly from original bottles only. No compromises."
        },
        {
            icon: <Truck className="w-6 h-6" />,
            title: isRTL ? "משלוח אקספרס לכל הארץ" : "Express Nationwide Shipping",
            desc: isRTL ? "מגיעים לכל נקודה בישראל תוך 3-5 ימי עסקים." : "Delivery to any point in Israel within 3-5 business days."
        },
        {
            icon: <Sparkles className="w-6 h-6" />,
            title: isRTL ? "אוצרות של מומחים" : "Expert Curation",
            desc: isRTL ? "כל בושם נבחר ע\"י צוות האתר כדי להבטיח איכות וניחוח בלתי נשכח." : "Every perfume is hand-picked by our team to ensure quality and memory."
        },
        {
            icon: <MessageCircle className="w-6 h-6" />,
            title: isRTL ? "ייעוץ אישי בוואטסאפ" : "Personal Consultation",
            desc: isRTL ? "זקוקים לעזרה בבחירה? אנחנו זמינים לייעוץ 1-על-1." : "Need help choosing? We're available for 1-on-1 advice."
        }
    ];

    return (
        <section className="py-16 bg-white border-t border-b border-gray-100">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {items.map((item, index) => (
                        <div key={index} className="flex flex-col items-center text-center space-y-3 group">
                            <div className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center text-gray-900 group-hover:bg-black group-hover:text-white transition-colors duration-300">
                                {item.icon}
                            </div>
                            <h4 className="font-bold text-gray-900">{item.title}</h4>
                            <p className="text-sm text-gray-500 leading-relaxed max-w-[220px]">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
