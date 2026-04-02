import pool from "../../lib/db";
import { currentUser, createClerkClient } from "@clerk/nextjs/server";
import { sanitizeProductArray } from "../../lib/productUtils";
import Link from "next/link";
import UserRoleSelect from "./UserRoleSelect";
import SyncUsersButton from "./SyncUsersButton";
import EditPhoneInput from "./EditPhoneInput";
import AdminUsersFilter from "./AdminUsersFilter";
import React from 'react';

export const metadata = {
    title: "ניהול זהויות | ml_tlv",
    robots: "noindex, nofollow",
};

export default async function AdminUsersPage(props) {
    const searchParams = await props.searchParams;
    const page = Number(searchParams?.page) || 1;
    const q = searchParams?.q || '';
    const roleFilter = searchParams?.role || '';
    const LIMIT = 50; // Increased limit
    const offset = (page - 1) * LIMIT;

    const user = await currentUser();
    const currentUserRole = user?.publicMetadata?.role;
    const currentUserEmail = user?.emailAddresses[0]?.emailAddress;
    const canEdit = currentUserRole === 'admin' || currentUserEmail === process.env.ADMIN_EMAIL;

    let users = [];
    let totalUsers = 0;

    const client = await pool.connect();
    try {
        let whereClause = '';
        let queryParams = [LIMIT, offset];
        let paramIndex = 3;

        const conditions = [];
        if (q) {
            conditions.push(`(first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex} OR id ILIKE $${paramIndex})`);
            queryParams.push(`%${q}%`);
            paramIndex++;
        }
        if (roleFilter) {
            conditions.push(`role = $${paramIndex}`);
            queryParams.push(roleFilter);
            paramIndex++;
        }

        if (conditions.length > 0) {
            whereClause = 'WHERE ' + conditions.join(' AND ');
        }

        // Fetch Users with specific Role Priority sorting and Pagination + Order Stats
        const [usersRes, countRes] = await Promise.all([
            client.query(`
                SELECT 
                    id, first_name, last_name, email, phone, role, created_at, updated_at,
                    (SELECT COUNT(*) FROM orders WHERE customer_details->>'clerk_id' = users.id AND status != 'cancelled' AND catalog_id IS NULL) as site_orders,
                    (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_details->>'clerk_id' = users.id AND status != 'cancelled' AND catalog_id IS NULL) as site_spent,
                    (SELECT COUNT(*) FROM orders WHERE customer_details->>'clerk_id' = users.id AND status != 'cancelled' AND catalog_id IS NOT NULL) as catalog_orders,
                    (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_details->>'clerk_id' = users.id AND status != 'cancelled' AND catalog_id IS NOT NULL) as catalog_spent
                FROM users 
                ${whereClause}
                ORDER BY 
                    CASE role 
                        WHEN 'admin' THEN 1 
                        WHEN 'deputy' THEN 2 
                        WHEN 'warehouse' THEN 3 
                        ELSE 4 
                    END ASC, 
                    created_at DESC
                LIMIT $1 OFFSET $2
            `, queryParams),
            client.query(`SELECT COUNT(*) FROM users ${whereClause.replace(/\$(\d+)/g, (match, num) => `$${parseInt(num) - 2}`)}`, queryParams.slice(2))
        ]);
        const sanitizedUsersRows = sanitizeProductArray(usersRes.rows);

        // Fetch last login from Clerk if possible
        const userIds = sanitizedUsersRows.map(u => u.id);
        const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
        let clerkUsersMap = {};
        
        if (userIds.length > 0) {
            try {
                // Fetch user data from clerk by their IDs for lastSignInAt
                const clerkResponse = await clerkClient.users.getUserList({ userId: userIds });
                clerkResponse.data.forEach(cu => {
                    clerkUsersMap[cu.id] = cu.lastSignInAt;
                });
            } catch (clerkErr) {
                console.error("Error fetching Clerk lastSignInAt:", clerkErr);
            }
        }

        users = sanitizedUsersRows.map(u => ({
            id: u.id,
            firstName: u.first_name,
            lastName: u.last_name,
            email: u.email,
            phone: u.phone,
            role: u.role || 'customer',
            createdAt: u.created_at,
            updatedAt: u.updated_at,
            lastLogin: clerkUsersMap[u.id] || u.updated_at, // Fallback to updated_at if clerk fails
            siteOrders: parseInt(u.site_orders) || 0,
            siteSpent: parseFloat(u.site_spent) || 0,
            catalogOrders: parseInt(u.catalog_orders) || 0,
            catalogSpent: parseFloat(u.catalog_spent) || 0,
        }));

        totalUsers = parseInt(countRes.rows[0].count);
    } finally {
        client.release();
    }

    const totalPages = Math.ceil(totalUsers / LIMIT);

    return (
        <div>
            <div className="flex justify-between items-center mb-6 md:pl-12 gap-4">
                <h1 className="text-xl md:text-3xl font-bold">ניהול זהויות והרשאות</h1>
                <div className="hidden md:block">
                    <SyncUsersButton />
                </div>
            </div>

            <AdminUsersFilter initialQuery={q} initialRole={roleFilter} />

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-center" dir="rtl">
                        <thead className="bg-gray-50 text-gray-500 text-sm">
                            <tr>
                                <th className="p-4 text-center">משתמש</th>
                                <th className="p-4 text-center">אימייל</th>
                                <th className="p-4 text-center font-black text-blue-700 bg-blue-50/50">סטטיסטיקה</th>
                                <th className="p-4 text-center">תאריכים</th>
                                <th className="p-4 text-center">תפקיד נוכחי</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50">
                                    <td className="p-4">
                                        <div className="font-bold">{u.firstName} {u.lastName}</div>
                                        <div className="text-[10px] text-gray-400 font-mono opacity-70 hover:opacity-100 transition-opacity" title={u.id}>
                                            {u.id.length > 12 ? `${u.id.slice(0, 8)}...${u.id.slice(-4)}` : u.id}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm">
                                        <div>{u.email}</div>
                                        <EditPhoneInput 
                                            userId={u.id} 
                                            initialPhone={u.phone} 
                                            canEdit={canEdit} 
                                        />
                                    </td>
                                    <td className="p-4 text-sm bg-gray-50/20">
                                        <div className="flex flex-col items-center justify-center gap-1.5 min-w-[120px]">
                                            {/* Site Orders - Blue */}
                                            <div className="w-full flex items-center justify-between gap-3 bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100/50">
                                                <div className="flex flex-col items-start leading-tight">
                                                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter">אתר</span>
                                                    <div className="font-black text-blue-900">₪{u.siteSpent}</div>
                                                </div>
                                                <div className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded leading-none">{u.siteOrders}</div>
                                            </div>

                                            {/* Catalog Orders - Yellow */}
                                            <div className="w-full flex items-center justify-between gap-3 bg-amber-50/50 px-3 py-1.5 rounded-lg border border-amber-100/50">
                                                <div className="flex flex-col items-start leading-tight">
                                                    <span className="text-[9px] font-black text-amber-500/80 uppercase tracking-tighter">קטלוגים</span>
                                                    <div className="font-black text-amber-900">₪{u.catalogSpent}</div>
                                                </div>
                                                <div className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded leading-none">{u.catalogOrders}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs text-gray-500 text-right space-y-1">
                                        <div className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded">
                                            <span className="font-bold">נוצר:</span>
                                            <span dir="ltr">{new Date(u.createdAt).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                                        </div>
                                        {u.lastLogin && (
                                            <div className="flex justify-between items-center bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100">
                                                <span className="font-bold">התחברות אחרונה:</span>
                                                <span dir="ltr">{new Date(u.lastLogin).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 flex justify-center">
                                        <UserRoleSelect
                                            userId={u.id}
                                            initialRole={u.role}
                                            canEdit={canEdit}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View Card Layout */}
                <div className="md:hidden divide-y divide-gray-100">
                    {users.map(u => (
                        <div key={u.id} className="p-5 bg-white space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="font-bold text-gray-900 text-base">{u.firstName} {u.lastName}</div>
                                    <div className="text-[10px] text-gray-400 font-mono opacity-70 hover:opacity-100 transition-opacity" title={u.id}>
                                        {u.id.length > 12 ? `${u.id.slice(0, 8)}...${u.id.slice(-4)}` : u.id}
                                    </div>
                                </div>
                                <div className="text-[10px] text-gray-400 font-bold bg-gray-50 px-2 py-1 rounded-lg border border-gray-100" dir="ltr">
                                    {new Date(u.createdAt).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-2 my-2">
                                {/* Site Orders - Blue */}
                                <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl border border-blue-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">🌐</div>
                                        <div>
                                            <div className="text-[10px] uppercase font-black text-blue-400 tracking-widest">הזמנות מהאתר</div>
                                            <div className="font-black text-blue-900">₪{u.siteSpent}</div>
                                        </div>
                                    </div>
                                    <div className="text-[12px] font-bold text-blue-700 bg-white px-3 py-1 rounded-md shadow-sm border border-blue-100 leading-none">{u.siteOrders}</div>
                                </div>

                                {/* Catalog Orders - Yellow/Amber */}
                                <div className="flex justify-between items-center bg-amber-50 p-3 rounded-xl border border-amber-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">📖</div>
                                        <div>
                                            <div className="text-[10px] uppercase font-black text-amber-500 tracking-widest">הזמנות מקטלוגים</div>
                                            <div className="font-black text-amber-900">₪{u.catalogSpent}</div>
                                        </div>
                                    </div>
                                    <div className="text-[12px] font-bold text-amber-700 bg-white px-3 py-1 rounded-md shadow-sm border border-amber-100 leading-none">{u.catalogOrders}</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-xs text-blue-600 font-medium truncate py-1 border-b border-blue-50 mb-1">
                                    {u.email}
                                </div>
                                <EditPhoneInput 
                                    userId={u.id} 
                                    initialPhone={u.phone} 
                                    canEdit={canEdit} 
                                />
                                {u.lastLogin && (
                                    <div className="text-[11px] font-bold text-gray-500 pt-2 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        <span>התחברות אחרונה:</span>
                                        <span dir="ltr">{new Date(u.lastLogin).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2 mt-2 border-t border-gray-100">
                                <div className="text-[10px] uppercase font-bold text-gray-400 mb-2">הרשאת מערכת:</div>
                                <UserRoleSelect
                                    userId={u.id}
                                    initialRole={u.role}
                                    canEdit={canEdit}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pagination & Count */}
            <div className="flex flex-col items-center gap-4 mt-8 relative">
                {/* Brand Style Pagination - Centered */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4">
                        <Link
                            href={`/admin/users?page=${Math.max(1, page - 1)}${q ? `&q=${encodeURIComponent(q)}` : ''}${roleFilter ? `&role=${roleFilter}` : ''}`}
                            className={`px-4 py-2 border rounded hover:bg-gray-100 transition ${page === 1 ? 'opacity-50 pointer-events-none' : ''}`}
                            aria-disabled={page === 1}
                        >
                            הקודם
                        </Link>

                        <span className="text-sm text-gray-600">
                            עמוד {page} מתוך {totalPages}
                        </span>

                        <Link
                            href={`/admin/users?page=${Math.min(totalPages, page + 1)}${q ? `&q=${encodeURIComponent(q)}` : ''}${roleFilter ? `&role=${roleFilter}` : ''}`}
                            className={`px-4 py-2 border rounded hover:bg-gray-100 transition ${page === totalPages ? 'opacity-50 pointer-events-none' : ''}`}
                            aria-disabled={page === totalPages}
                        >
                            הבא
                        </Link>
                    </div>
                )}

                {/* Total Count - Absolute positioned to bottom right or kept separate if mobile */}
                <div className="text-sm text-gray-500 font-medium md:absolute md:right-0 md:bottom-2">
                    סה״כ {totalUsers} משתמשים
                </div>
            </div>
        </div>
    );
}
