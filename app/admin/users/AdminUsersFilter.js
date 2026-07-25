"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, Filter, X, ArrowDownUp } from 'lucide-react';
import CustomDropdown from '../../components/ui/CustomDropdown';

export default function AdminUsersFilter({ initialQuery = '', initialRole = '', initialSort = 'default' }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(initialQuery);
    const [role, setRole] = useState(initialRole);
    const [sort, setSort] = useState(initialSort);

    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (query) params.set('q', query);
            else params.delete('q');
            
            if (role) params.set('role', role);
            else params.delete('role');

            if (sort && sort !== 'default') params.set('sort', sort);
            else params.delete('sort');
            
            params.set('page', '1'); // Reset to page 1 on search
            router.push(`/admin/users?${params.toString()}`);
        }, 500);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, role, sort, router]);

    const roleOptions = [
        { value: '', label: 'כל התפקידים', icon: <Filter className="w-4 h-4 text-gray-400" /> },
        { value: 'admin', label: 'מנהל' },
        { value: 'deputy', label: 'סגן מנהל' },
        { value: 'warehouse', label: 'מחסן' },
        { value: 'viewer', label: 'צופה חיצוני' },
        { value: 'customer', label: 'לקוח' },
    ];

    const sortOptions = [
        { value: 'default', label: 'ברירת מחדל (תפקיד ואז פעילות)' },
        { value: 'last_active_desc', label: 'התחברות אחרונה (החדש ביותר)' },
        { value: 'last_active_asc', label: 'התחברות אחרונה (הישן ביותר)' },
        { value: 'orders_desc', label: 'סה״כ הזמנות (הגבוה ביותר)' },
        { value: 'spent_desc', label: 'הוצאה כוללת (הגבוה ביותר)' },
        { value: 'created_desc', label: 'תאריך הצטרפות (החדש ביותר)' },
        { value: 'created_asc', label: 'תאריך הצטרפות (הישן ביותר)' },
        { value: 'name_asc', label: 'שם משתמש (א-ת)' },
        { value: 'name_desc', label: 'שם משתמש (ת-א)' },
    ];

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

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <CustomDropdown
                    options={roleOptions}
                    value={role}
                    onChange={setRole}
                    placeholder="כל התפקידים"
                    className="min-w-[150px] bg-gray-50"
                />
                
                <div className="flex items-center gap-2 sm:border-r sm:pr-2 border-gray-200">
                    <ArrowDownUp className="hidden sm:block w-4 h-4 text-gray-400" />
                    <CustomDropdown
                        options={sortOptions}
                        value={sort}
                        onChange={setSort}
                        placeholder="מיון לפי..."
                        className="w-full sm:min-w-[240px] bg-gray-50"
                    />
                </div>
            </div>
        </div>
    );
}
