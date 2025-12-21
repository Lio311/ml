'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function UserRegistrationsChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-center h-80">
                <span className="text-gray-400">אין נתונים להצגה</span>
            </div>
        );
    }

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800">מצטרפים חדשים (חודשי)</h3>
                <p className="text-sm text-gray-500">מעקב אחר הצטרפות משתמשים חדשים למערכת החודש</p>
            </div>

            <div className="h-80 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorUsers)"
                            name="משתמשים חדשים"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
