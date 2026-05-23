"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';

export default function AdminUsersFilter({ initialQuery = '', initialRole = '' }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(initialQuery);
    const [role, setRole] = useState(initialRole);

    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (query) params.set('q', query);
            else params.delete('q');
            
            if (role) params.set('role', role);
            else params.delete('role');
            
            params.set('page', '1'); // Reset to page 1 on search
            router.push(`/admin/users?${params.toString()}`);
        }, 500);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, role, router]);

    return (
        <div className="flex flex-col md:flex-row gap-3 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="חיפוש לפי שם, אימייל או טלפון..."
                    className="w-full pr-10 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-black transition-all text-sm"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    dir="rtl"
                />
                {query && (
                    <button 
                        onClick={() => setQuery('')}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full"
                    >
                        <X className="w-3 h-3 text-gray-500" />
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2">
                <div className="relative">
                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                        className="pr-10 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-black transition-all text-sm appearance-none min-w-[120px]"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        dir="rtl"
                    >
                        <option value="">כל התפקידים</option>
                        <option value="admin">מנהל</option>
                        <option value="deputy">סגן מנהל</option>
                        <option value="warehouse">מחסן</option>
                        <option value="customer">לקוח</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
