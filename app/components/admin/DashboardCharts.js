"use client";

import React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";

const CustomLegend = ({ payload }) => {
    return (
        <div className="flex flex-col gap-2 mt-4 px-4" dir="rtl">
            {payload.map((entry, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-gray-600 font-medium">{entry.value}</span>
                </div>
            ))}
        </div>
    );
};

const CustomTooltip = ({ active, payload, label, prefix = "" }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border rounded shadow-xl text-right z-50" dir="rtl">
                <p className="font-bold mb-2 text-gray-800 border-b pb-1 text-sm">{`יום ${label} לחודש`}</p>
                <div className="flex flex-col gap-1">
                    {payload.map((entry, index) => (
                        <div key={index} className="flex justify-between gap-4 items-center">
                            <span className="text-xs text-gray-400 font-bold">{entry.name}:</span>
                            <span style={{ color: entry.color }} className="text-sm font-mono font-bold">
                                {prefix}{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export default function DashboardCharts({ orderData, revenueData, visitsData }) {
    const [rightChartMode, setRightChartMode] = React.useState('revenue'); // 'revenue' | 'orders'

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Daily Visits Chart (New Left Chart) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6" dir="rtl">
                    <h3 className="text-lg font-bold text-gray-800">כניסות לאתר</h3>
                </div>
                <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={visitsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                                dataKey="day"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#9ca3af' }}
                            />
                            <YAxis
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#9ca3af' }}
                                orientation="left"
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }} />
                            <Legend content={<CustomLegend />} />
                            <Line
                                name="החודש עד התאריך הנוכחי"
                                type="monotone"
                                dataKey="current"
                                stroke="#8b5cf6" // Purple for visits
                                strokeWidth={4}
                                dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                                connectNulls
                            />
                            <Line
                                name="חודש קודם"
                                type="monotone"
                                dataKey="previous"
                                stroke="#d1d5db"
                                strokeWidth={3}
                                strokeDasharray="6 6"
                                dot={false}
                                activeDot={{ r: 4 }}
                                connectNulls
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Configurable Chart (Revenue OR Orders) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6" dir="rtl">
                    <h3 className="text-lg font-bold text-gray-800">
                        {rightChartMode === 'revenue' ? 'מכירות רשת' : 'הזמנות'}
                    </h3>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setRightChartMode('orders')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition ${rightChartMode === 'orders' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}
                        >
                            הזמנות
                        </button>
                        <button
                            onClick={() => setRightChartMode('revenue')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition ${rightChartMode === 'revenue' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}
                        >
                            הכנסות
                        </button>
                    </div>
                </div>
                <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={rightChartMode === 'revenue' ? revenueData : orderData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                                dataKey="day"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#9ca3af' }}
                            />
                            <YAxis
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#9ca3af' }}
                                orientation="left"
                                tickFormatter={rightChartMode === 'revenue' ? ((value) => `₪${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`) : undefined}
                            />
                            <Tooltip content={<CustomTooltip prefix={rightChartMode === 'revenue' ? "₪" : ""} />} cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }} />
                            <Legend content={<CustomLegend />} />
                            <Line
                                name="החודש עד התאריך הנוכחי"
                                type="monotone"
                                dataKey="current"
                                stroke="#3b82f6"
                                strokeWidth={4}
                                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                                connectNulls
                            />
                            <Line
                                name="חודש קודם"
                                type="monotone"
                                dataKey="previous"
                                stroke="#10b981"
                                strokeWidth={3}
                                strokeDasharray="6 6"
                                dot={false}
                                activeDot={{ r: 4 }}
                                connectNulls
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
