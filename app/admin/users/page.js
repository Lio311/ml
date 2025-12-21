import pool from "../../../lib/db";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import UserRoleSelect from "./UserRoleSelect";

export const metadata = {
    title: "ניהול זהויות | ml_tlv",
    robots: "noindex, nofollow",
};

export default async function AdminUsersPage({ searchParams }) {
    const page = Number(searchParams?.page) || 1;
    const LIMIT = 10;
    const offset = (page - 1) * LIMIT;

    const user = await currentUser();
    const currentUserRole = user?.publicMetadata?.role;
    const currentUserEmail = user?.emailAddresses[0]?.emailAddress;
    const canEdit = currentUserRole === 'admin' || currentUserEmail === 'lior31197@gmail.com';

    let users = [];
    let totalUsers = 0;

    const client = await pool.connect();
    try {
        // Fetch Users with specific Role Priority sorting and Pagination
        const [usersRes, countRes] = await Promise.all([
            client.query(`
                SELECT id, first_name, last_name, email, role, created_at 
                FROM users 
                ORDER BY 
                    CASE role 
                        WHEN 'admin' THEN 1 
                        WHEN 'deputy' THEN 2 
                        WHEN 'warehouse' THEN 3 
                        ELSE 4 
                    END ASC, 
                    created_at DESC
                LIMIT $1 OFFSET $2
            `, [LIMIT, offset]),
            client.query('SELECT COUNT(*) FROM users')
        ]);

        users = usersRes.rows.map(u => ({
            id: u.id,
            firstName: u.first_name,
            lastName: u.last_name,
            email: u.email,
            role: u.role || 'customer',
            createdAt: u.created_at
        }));

        totalUsers = parseInt(countRes.rows[0].count);
    } finally {
        client.release();
    }

    const totalPages = Math.ceil(totalUsers / LIMIT);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">ניהול זהויות והרשאות</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-center" dir="rtl">
                        <thead className="bg-gray-50 text-gray-500 text-sm">
                            <tr>
                                <th className="p-4 text-center">משתמש</th>
                                <th className="p-4 text-center">אימייל</th>
                                <th className="p-4 text-center">נוצר בתאריך</th>
                                <th className="p-4 text-center">תפקיד נוכחי</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50">
                                    <td className="p-4">
                                        <div className="font-bold">{u.firstName} {u.lastName}</div>
                                        <div className="text-xs text-gray-400 font-mono">{u.id}</div>
                                    </td>
                                    <td className="p-4 text-sm">{u.email}</td>
                                    <td className="p-4 text-sm text-gray-500">
                                        {new Date(u.createdAt).toLocaleDateString('he-IL')}
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
            </div>

            {/* Pagination & Count */}
            <div className="flex justify-between items-end mt-4">
                {/* Pagination Controls */}
                <div className="flex items-center gap-4">
                    {page > 1 && (
                        <Link
                            href={`/admin/users?page=${page - 1}`}
                            className="px-4 py-2 bg-white border rounded shadow-sm hover:bg-gray-50 text-sm"
                        >
                            הקודם
                        </Link>
                    )}

                    <span className="text-gray-600 text-sm">
                        עמוד {page} מתוך {totalPages}
                    </span>

                    {page < totalPages && (
                        <Link
                            href={`/admin/users?page=${page + 1}`}
                            className="px-4 py-2 bg-white border rounded shadow-sm hover:bg-gray-50 text-sm"
                        >
                            הבא
                        </Link>
                    )}
                </div>

                {/* Total Count (Bottom Right) */}
                <div className="text-sm text-gray-500 font-medium">
                    סה״כ {totalUsers} משתמשים
                </div>
            </div>
        </div>
    );
}
