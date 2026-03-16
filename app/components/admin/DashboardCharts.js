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

export default function DashboardCharts({ orderData, revenueData, visitsData, usersData }) {
    const [rightChartMode, setRightChartMode] = React.useState('revenue'); // 'revenue' | 'orders'
    const [leftChartMode, setLeftChartMode] = React.useState('visits'); // 'visits' | 'users'

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* User Configurable Chart (Visits OR Registrations) */}
            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6" dir="rtl">
                    <h3 className="text-base md:text-lg font-bold text-gray-800">
                        {leftChartMode === 'visits' ? 'סטטיסטיקת ביקורים' : 'רישום משתמשים'}
                    </h3>
                    <div className="flex bg-gray-100 p-1 rounded-lg scale-90 md:scale-100">
                        <button
                            onClick={() => setLeftChartMode('visits')}
                            className={`px-3 py-1 text-[10px] md:text-xs font-bold rounded-md transition ${leftChartMode === 'visits' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}
                        >
                            ביקורים
                        </button>
                        <button
                            onClick={() => setLeftChartMode('users')}
                            className={`px-3 py-1 text-[10px] md:text-xs font-bold rounded-md transition ${leftChartMode === 'users' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}
                        >
                            משתמשים
                        </button>
                    </div>
                </div>
                <div className="h-[250px] md:h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={leftChartMode === 'visits' ? visitsData : usersData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                                dataKey="day"
                                fontSize={9}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#9ca3af' }}
                                tickCount={window?.innerWidth < 768 ? 6 : undefined}
                            />
                            <YAxis
                                fontSize={9}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#9ca3af' }}
                                orientation="left"
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }} />
                            <Legend content={<CustomLegend />} verticalAlign="bottom" align="center" />

                            {leftChartMode === 'visits' ? (
                                <>
                                    <Line
                                        name="החודש"
                                        type="monotone"
                                        dataKey="current"
                                        stroke="#ef4444" 
                                        strokeWidth={3}
                                        dot={{ r: 3, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 5, strokeWidth: 0 }}
                                        connectNulls
                                    />
                                    <Line
                                        name="חודש קודם"
                                        type="monotone"
                                        dataKey="previous"
                                        stroke="#f97316" 
                                        strokeWidth={2}
                                        strokeDasharray="4 4"
                                        dot={false}
                                        activeDot={{ r: 3 }}
                                        connectNulls
                                    />
                                </>
                            ) : (
                                <>
                                    <Line
                                        name="החודש"
                                        type="monotone"
                                        dataKey="current"
                                        stroke="#ef4444" 
                                        strokeWidth={3}
                                        dot={{ r: 3, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 5, strokeWidth: 0 }}
                                        connectNulls
                                    />
                                    <Line
                                        name="חודש קודם"
                                        type="monotone"
                                        dataKey="previous"
                                        stroke="#f97316" 
                                        strokeWidth={2}
                                        strokeDasharray="4 4"
                                        dot={false}
                                        activeDot={{ r: 3 }}
                                        connectNulls
                                    />
                                </>
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Configurable Chart (Revenue OR Orders) */}
            <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6" dir="rtl">
                    <h3 className="text-base md:text-lg font-bold text-gray-800">
                        {rightChartMode === 'revenue' ? 'מכירות' : 'הזמנות'}
                    </h3>
                    <div className="flex bg-gray-100 p-1 rounded-lg scale-90 md:scale-100">
                        <button
                            onClick={() => setRightChartMode('orders')}
                            className={`px-3 py-1 text-[10px] md:text-xs font-bold rounded-md transition ${rightChartMode === 'orders' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}
                        >
                            הזמנות
                        </button>
                        <button
                            onClick={() => setRightChartMode('revenue')}
                            className={`px-3 py-1 text-[10px] md:text-xs font-bold rounded-md transition ${rightChartMode === 'revenue' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`}
                        >
                            מכירות
                        </button>
                    </div>
                </div>
                <div className="h-[250px] md:h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={rightChartMode === 'revenue' ? revenueData : orderData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                                dataKey="day"
                                fontSize={9}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#9ca3af' }}
                                tickCount={window?.innerWidth < 768 ? 6 : undefined}
                            />
                            <YAxis
                                fontSize={9}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#9ca3af' }}
                                orientation="left"
                                tickFormatter={rightChartMode === 'revenue' ? ((value) => `₪${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`) : undefined}
                            />
                            <Tooltip content={<CustomTooltip prefix={rightChartMode === 'revenue' ? "₪" : ""} />} cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }} />
                            <Legend content={<CustomLegend />} verticalAlign="bottom" align="center" />
                            <Line
                                name="החודש"
                                type="monotone"
                                dataKey="current"
                                stroke="#10b981" 
                                strokeWidth={3}
                                dot={{ r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 5, strokeWidth: 0 }}
                                connectNulls
                            />
                            <Line
                                name="חודש קודם"
                                type="monotone"
                                dataKey="previous"
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                strokeDasharray="4 4"
                                dot={false}
                                activeDot={{ r: 3 }}
                                connectNulls
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
