import pool from "../../lib/db";
import { currentUser, createClerkClient } from "@clerk/nextjs/server";
import { sanitizeProductArray } from "../../lib/productUtils";
import Link from "next/link";
import UserRoleSelect from "./UserRoleSelect";
import SyncUsersButton from "./SyncUsersButton";
import EditPhoneInput from "./EditPhoneInput";
import AdminUsersFilter from "./AdminUsersFilter";
import { RatingBadge, RatingLegend } from "./RatingInfo";
import DeleteUserButton from "./DeleteUserButton";
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
    const LIMIT = 50; 
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

        const [usersRes, countRes] = await Promise.all([
            client.query(`
                SELECT 
                    id, first_name, last_name, email, phone, role, image_url, created_at, updated_at,
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

        const userIds = sanitizedUsersRows.map(u => u.id);
        const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
        let clerkUsersMap = {};
        
        if (userIds.length > 0) {
            try {
                const clerkResponse = await clerkClient.users.getUserList({ userId: userIds });
                clerkResponse.data.forEach(cu => {
                    clerkUsersMap[cu.id] = {
                        lastSignInAt: cu.lastSignInAt,
                        imageUrl: cu.imageUrl
                    };
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
            lastLogin: clerkUsersMap[u.id]?.lastSignInAt || u.updated_at,
            imageUrl: u.image_url || clerkUsersMap[u.id]?.imageUrl || null,
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
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-center" dir="rtl">
                        <thead className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-widest font-black">
                            <tr>
                                <th className="p-4 text-right w-[18%]">משתמש</th>
                                <th className="p-4 text-center w-[22%]">אימייל</th>
                                <th className="p-4 text-center w-[10%]">
                                    <div className="flex items-center justify-center gap-1">
                                        <span>דירוג</span>
                                        <RatingLegend />
                                    </div>
                                </th>
                                <th className="p-4 text-center font-black text-blue-700 bg-blue-50/50 w-[20%]">סטטיסטיקה</th>
                                <th className="p-4 text-center w-[18%]">תאריכים</th>
                                <th className="p-4 text-center w-[10%]">תפקיד</th>
                                <th className="p-4 text-center w-[2%]">פעולות</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map(u => {
                                const calculateScore = (u) => {
                                    const tenureDays = Math.max(1, (new Date() - new Date(u.createdAt)) / (1000 * 60 * 60 * 24));
                                    const totalSpent = u.siteSpent + u.catalogSpent;
                                    const totalOrders = Math.max(1, u.siteOrders + u.catalogOrders);
                                    
                                    const financialScore = Math.min(40, (totalSpent / 5000) * 40);
                                    const ordersPerMonth = totalOrders / (tenureDays / 30);
                                    const densityScore = Math.min(30, ordersPerMonth * 10);
                                    const avgSpent = totalSpent / totalOrders;
                                    const aovScore = Math.min(20, (avgSpent / 300) * 20);
                                    const tenureScore = Math.min(10, (tenureDays / 365) * 10);
                                    
                                    return Math.round(financialScore + densityScore + aovScore + tenureScore);
                                };

                                const score = calculateScore(u);

                                return (
                                    <tr key={u.id} className="hover:bg-gray-50/80 group">
                                        <td className="p-4 text-right">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-gray-400 text-[10px] border border-gray-200 overflow-hidden shrink-0">
                                                    {u.imageUrl ? (
                                                        <img src={u.imageUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="uppercase">{u.firstName?.[0]}{u.lastName?.[0]}</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="font-black text-gray-900 leading-tight text-sm uppercase">{u.firstName} {u.lastName}</div>
                                                    <div className="text-[9px] text-gray-400 font-mono mt-1 opacity-60">
                                                        #{u.id.length > 12 ? `${u.id.slice(0, 6)}...${u.id.slice(-4)}` : u.id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="text-gray-600 text-[11px] font-bold tracking-tight">{u.email}</div>
                                                <EditPhoneInput 
                                                    userId={u.id} 
                                                    initialPhone={u.phone} 
                                                    canEdit={canEdit} 
                                                />
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <RatingBadge score={score} />
                                        </td>
                                        <td className="p-4 text-sm bg-gray-50/30">
                                            <div className="flex flex-col items-center justify-center gap-1.5 min-w-[120px]">
                                                <div className="w-full flex items-center justify-between gap-3 bg-white/50 px-3 py-1.5 rounded-xl border border-blue-100/50 shadow-sm">
                                                    <div className="flex flex-col items-start leading-tight">
                                                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-tighter">אתר</span>
                                                        <div className="font-bold text-blue-700 leading-none"><span dir="ltr">₪ {u.siteSpent?.toLocaleString()}</span></div>
                                                    </div>
                                                    <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded leading-none">{u.siteOrders}</div>
                                                </div>
                    
                                                <div className="w-full flex items-center justify-between gap-3 bg-white/50 px-3 py-1.5 rounded-xl border border-amber-100/50 shadow-sm">
                                                    <div className="flex flex-col items-start leading-tight">
                                                        <span className="text-[8px] font-black text-amber-500/80 uppercase tracking-tighter">קטלוג</span>
                                                        <div className="font-bold text-amber-600 leading-none"><span dir="ltr">₪ {u.catalogSpent?.toLocaleString()}</span></div>
                                                    </div>
                                                    <div className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded leading-none">{u.catalogOrders}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-[10px] text-gray-400 text-right space-y-1 font-bold uppercase">
                                            <div className="flex justify-between items-center bg-gray-50/50 px-2 py-1.5 rounded-lg border border-gray-100/50">
                                                <span>הצטרפות</span>
                                                <span dir="ltr">{new Date(u.createdAt).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                                            </div>
                                            {u.lastLogin && (
                                                <div className="flex justify-between items-center bg-green-50/30 text-green-600 px-2 py-1.5 rounded-lg border border-green-100/50">
                                                    <span>ביקור אחרון</span>
                                                    <span dir="ltr">{new Date(u.lastLogin).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <UserRoleSelect
                                                userId={u.id}
                                                initialRole={u.role}
                                                canEdit={canEdit}
                                            />
                                        </td>
                                        <td className="p-4 text-center">
                                            {canEdit && <DeleteUserButton userId={u.id} userName={`${u.firstName} ${u.lastName}`} />}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="md:hidden divide-y divide-gray-100">
                    {users.map(u => {
                        const calculateScore = (u) => {
                            const tenureDays = Math.max(1, (new Date() - new Date(u.createdAt)) / (1000 * 60 * 60 * 24));
                            const totalSpent = u.siteSpent + u.catalogSpent;
                            const totalOrders = Math.max(1, u.siteOrders + u.catalogOrders);
                            
                            const financialScore = Math.min(40, (totalSpent / 5000) * 40);
                            const ordersPerMonth = totalOrders / (tenureDays / 30);
                            const densityScore = Math.min(30, ordersPerMonth * 10);
                            const avgSpent = totalSpent / totalOrders;
                            const aovScore = Math.min(20, (avgSpent / 300) * 20);
                            const tenureScore = Math.min(10, (tenureDays / 365) * 10);
                            
                            return Math.round(financialScore + densityScore + aovScore + tenureScore);
                        };
                        const score = calculateScore(u);

                        return (
                            <div key={u.id} className="p-6 bg-white space-y-5">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3 text-right">
                                        <div className="w-11 h-11 rounded-[1.2rem] bg-gray-50 flex items-center justify-center font-black text-gray-400 text-sm border border-gray-100 overflow-hidden shrink-0">
                                            {u.imageUrl ? (
                                                <img src={u.imageUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="uppercase">{u.firstName?.[0]}{u.lastName?.[0]}</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-black text-gray-900 text-base leading-tight uppercase tracking-tight">{u.firstName} {u.lastName}</div>
                                            <div className="text-[9px] text-gray-400 font-mono mt-1 opacity-70">
                                                #{u.id.length > 12 ? `${u.id.slice(0, 6)}...${u.id.slice(-4)}` : u.id}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 text-right">
                                        <div className="flex items-center gap-2">
                                            <RatingLegend />
                                            <RatingBadge score={score} />
                                        </div>
                                        <div className="text-[9px] text-gray-400 font-black bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 uppercase tracking-tighter" dir="ltr">
                                            {new Date(u.createdAt).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 my-2 text-right">
                                    <div className="flex justify-between items-center bg-blue-50/20 p-3 rounded-2xl border border-blue-100/50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 bg-blue-100/50 rounded-lg flex items-center justify-center text-[10px]">🌐</div>
                                            <div>
                                                <div className="text-[8px] uppercase font-black text-blue-400 tracking-tighter">אתר</div>
                                                <span className="text-sm font-black text-gray-800">{u.siteSpent?.toLocaleString()} ₪</span>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-black text-blue-700 bg-white px-2 py-0.5 rounded-lg border border-blue-50 leading-none shadow-sm">{u.siteOrders}</div>
                                    </div>
    
                                    <div className="flex justify-between items-center bg-amber-50/20 p-3 rounded-2xl border border-amber-100/50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 bg-amber-100/50 rounded-lg flex items-center justify-center text-[10px]">📖</div>
                                            <div>
                                                <div className="text-[8px] uppercase font-black text-amber-500 tracking-tighter">קטלוג</div>
                                                <p className="text-sm font-black text-blue-600">{u.catalogSpent?.toLocaleString()} ₪</p>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-black text-amber-700 bg-white px-2 py-0.5 rounded-lg border border-amber-50 leading-none shadow-sm">{u.catalogOrders}</div>
                                    </div>
                                </div>
    
                                <div className="space-y-2 text-right">
                                    <div className="text-[11px] text-blue-600 font-black tracking-tight py-1.5 border-b border-blue-50/50 mb-1 truncate">
                                        {u.email}
                                    </div>
                                    <EditPhoneInput 
                                        userId={u.id} 
                                        initialPhone={u.phone} 
                                        canEdit={canEdit} 
                                    />
                                    {u.lastLogin && (
                                        <div className="text-[10px] font-black text-green-600/60 pt-2 flex items-center justify-end gap-1.5">
                                            <span dir="ltr" className="tracking-tighter">{new Date(u.lastLogin).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                                            <span className="uppercase tracking-widest text-[9px]">ביקור אחרון</span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                                        </div>
                                    )}
                                </div>
    
                                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="text-[9px] uppercase font-black text-gray-400 tracking-widest">הרשאת מערכת:</div>
                                        <UserRoleSelect
                                            userId={u.id}
                                            initialRole={u.role}
                                            canEdit={canEdit}
                                        />
                                    </div>
                                    {canEdit && <DeleteUserButton userId={u.id} userName={`${u.firstName} ${u.lastName}`} />}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-col items-center gap-4 mt-8 relative">
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

                <div className="text-sm text-gray-500 font-medium md:absolute md:right-0 md:bottom-2">
                    סה״כ {totalUsers} משתמשים
                </div>
            </div>
        </div>
    );
}
