"use client";

import { useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";
import { Activity, AlertCircle, Info } from "lucide-react";

export default function NeonConsumptionChart({ data, error, isFreeTier }) {
    if (isFreeTier) {
        return (
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
                <Info className="text-blue-500 mt-1" size={24} />
                <div>
                    <h3 className="text-blue-800 font-bold">מעקב צריכה היסטורי (Compute Units)</h3>
                    <p className="text-blue-600 text-sm mt-1">{error}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex items-start gap-4">
                <AlertCircle className="text-red-500 mt-1" size={24} />
                <div>
                    <h3 className="text-red-800 font-bold">שגיאה בטעינת נתוני שימוש מ-Neon</h3>
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                    <p className="text-red-500 text-xs mt-2 font-mono">
                        ודא שהמשתנים NEON_API_KEY ו-NEON_PROJECT_ID מוגדרים נכון.
                    </p>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 text-center">
                <Activity className="text-gray-400 mx-auto mb-2" size={32} />
                <p className="text-gray-500">אין נתוני שימוש זמינים לחודש זה.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Activity className="text-blue-500" size={20} />
                ניצול משאבים (Compute Unit Seconds) לאורך החודש
            </h2>
            <div className="h-72 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12, fill: '#6B7280' }} 
                            tickMargin={10}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis 
                            tick={{ fontSize: 12, fill: '#6B7280' }} 
                            axisLine={false}
                            tickFormatter={(value) => `${(value / 3600).toFixed(1)}h`}
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                            formatter={(value) => [`${(value / 3600).toFixed(2)} שעות (${value} שניות)`, 'Compute']}
                            labelStyle={{ color: '#374151', fontWeight: 'bold', marginBottom: '8px' }}
                        />
                        <Bar 
                            dataKey="compute_unit_seconds" 
                            fill="#3B82F6" 
                            radius={[4, 4, 0, 0]} 
                            name="Compute Units" 
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
