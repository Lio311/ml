"use client";
import React from 'react';
import { TrendingDown, AlertTriangle, CheckCircle, Package } from 'lucide-react';

export default function InventoryForecast({ forecasts = [] }) {
    if (!forecasts.length) return null;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 w-full">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4" dir="rtl">
                <div className="bg-purple-100 p-2 rounded-lg">
                    <Package className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800">חיזוי מלאי חכם</h3>
                    <p className="text-xs text-gray-500">מבוסס על קצב המכירות ב-30 הימים האחרונים</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" dir="rtl">
                {forecasts.map((item, index) => {
                    let colorClass = "bg-green-50 border-green-200 text-green-800";
                    let icon = <CheckCircle className="w-5 h-5 text-green-500" />;

                    if (item.daysLeft <= 7) {
                        colorClass = "bg-red-50 border-red-200 text-red-800";
                        icon = <AlertTriangle className="w-5 h-5 text-red-500" />;
                    } else if (item.daysLeft <= 14) {
                        colorClass = "bg-yellow-50 border-yellow-200 text-yellow-800";
                        icon = <TrendingDown className="w-5 h-5 text-yellow-600" />;
                    }

                    return (
                        <div key={index} className={`p-4 rounded-xl border flex items-start gap-3 ${colorClass}`}>
                            <div className="mt-1">{icon}</div>
                            <div>
                                <h4 className="font-bold text-sm">{item.name}</h4>
                                <p className="text-xs mt-1 font-medium opacity-80">
                                    {item.daysLeft < 1000 ? `ייגמר בעוד כ-${item.daysLeft} ימים` : 'מלאי מספיק לטווח ארוך'}
                                </p>
                                <p className="text-[10px] mt-2 opacity-60">
                                    קצב נוכחי: {item.dailyRate.toFixed(1)} יח' ליום
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
