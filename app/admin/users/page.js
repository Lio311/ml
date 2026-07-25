import pool from "../../lib/db";
import { currentUser, createClerkClient } from "@clerk/nextjs/server";
import { sanitizeProductArray } from "../../lib/productUtils";
import Link from "next/link";
import UserRoleSelect from "./UserRoleSelect";
import SyncUsersButton from "./SyncUsersButton";
import EditPhoneInput from "./EditPhoneInput";
import AdminUsersFilter from "./AdminUsersFilter";
import UsersTableClient from "./UsersTableClient";
import React from 'react';

import { getBrandName } from "../../lib/brand";

export async function generateMetadata() {
    return {
        title: "ניהול זהויות Admin",
        robots: "noindex, nofollow",
    };
}

export default async function AdminUsersPage(props) {
    const searchParams = await props.searchParams;
    const page = Number(searchParams?.page) || 1;
    const q = searchParams?.q || '';
    const roleFilter = searchParams?.role || '';
    const sortParam = searchParams?.sort || 'default';
    const LIMIT = 50; 
    const offset = (page - 1) * LIMIT;

    const user = await currentUser();
    const currentUserRole = user?.publicMetadata?.role;
    const currentUserEmail = user?.emailAddresses[0]?.emailAddress;
    const canEdit = currentUserRole === 'admin' || currentUserRole === 'viewer' || currentUserEmail === process.env.ADMIN_EMAIL;

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

        let orderByClause = `
            CASE role 
                WHEN 'admin' THEN 1 
                WHEN 'deputy' THEN 2 
                WHEN 'warehouse' THEN 3 
                WHEN 'viewer' THEN 4
                ELSE 5 
            END ASC, 
            COALESCE(last_active_at, created_at) DESC
        `;

        if (sortParam === 'last_active_desc') orderByClause = `COALESCE(last_active_at, created_at) DESC`;
        else if (sortParam === 'last_active_asc') orderByClause = `COALESCE(last_active_at, created_at) ASC`;
        else if (sortParam === 'orders_desc') orderByClause = `(SELECT COUNT(*) FROM orders WHERE customer_details->>'clerk_id' = users.id AND status != 'cancelled') DESC, (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_details->>'clerk_id' = users.id AND status != 'cancelled') DESC`;
        else if (sortParam === 'spent_desc') orderByClause = `(SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_details->>'clerk_id' = users.id AND status != 'cancelled') DESC, (SELECT COUNT(*) FROM orders WHERE customer_details->>'clerk_id' = users.id AND status != 'cancelled') DESC`;
        else if (sortParam === 'created_desc') orderByClause = `created_at DESC`;
        else if (sortParam === 'created_asc') orderByClause = `created_at ASC`;
        else if (sortParam === 'name_asc') orderByClause = `first_name ASC, last_name ASC`;
        else if (sortParam === 'name_desc') orderByClause = `first_name DESC, last_name DESC`;

        const [usersRes, countRes] = await Promise.all([
            client.query(`
                SELECT 
                    id, first_name, last_name, email, secondary_email, phone, role, image_url, created_at, updated_at, last_active_at,
                    (SELECT COUNT(*) FROM orders WHERE customer_details->>'clerk_id' = users.id AND status != 'cancelled' AND catalog_id IS NULL) as site_orders,
                    (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_details->>'clerk_id' = users.id AND status != 'cancelled' AND catalog_id IS NULL) as site_spent,
                    (SELECT COUNT(*) FROM orders WHERE customer_details->>'clerk_id' = users.id AND status != 'cancelled' AND catalog_id IS NOT NULL) as catalog_orders,
                    (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_details->>'clerk_id' = users.id AND status != 'cancelled' AND catalog_id IS NOT NULL) as catalog_spent,
                    (SELECT MAX(created_at) FROM orders WHERE customer_details->>'clerk_id' = users.id) as last_order_at,
                    (SELECT MAX(updated_at) FROM live_carts WHERE live_carts.email = users.email) as last_cart_at
                FROM users 
                ${whereClause}
                ORDER BY ${orderByClause}
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

        users = sanitizedUsersRows.map(u => {
            const clerkLastSignIn = clerkUsersMap[u.id]?.lastSignInAt ? new Date(clerkUsersMap[u.id].lastSignInAt) : null;
            const dbLastActive = u.last_active_at ? new Date(u.last_active_at) : null;
            const lastOrderAt = u.last_order_at ? new Date(u.last_order_at) : null;
            const lastCartAt = u.last_cart_at ? new Date(u.last_cart_at) : null;
            
            const dates = [clerkLastSignIn, dbLastActive, lastOrderAt, lastCartAt].filter(d => d && !isNaN(d));
            const mostRecentDate = dates.length > 0 ? new Date(Math.max(...dates)) : null;

            return {
                id: u.id,
                firstName: u.first_name,
                lastName: u.last_name,
                email: u.email,
                secondary_email: u.secondary_email,
                phone: u.phone,
                role: u.role || 'customer',
                createdAt: u.created_at,
                updatedAt: u.updated_at,
                lastLogin: mostRecentDate,
                imageUrl: u.image_url || clerkUsersMap[u.id]?.imageUrl || null,
                siteOrders: parseInt(u.site_orders) || 0,
                siteSpent: parseFloat(u.site_spent) || 0,
                catalogOrders: parseInt(u.catalog_orders) || 0,
                catalogSpent: parseFloat(u.catalog_spent) || 0,
            };
        });

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

            <AdminUsersFilter initialQuery={q} initialRole={roleFilter} initialSort={sortParam} />

            <UsersTableClient users={users} canEdit={canEdit} />

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
