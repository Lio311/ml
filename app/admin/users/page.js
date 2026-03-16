import pool from "../../lib/db";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import UserRoleSelect from "./UserRoleSelect";
import SyncUsersButton from "./SyncUsersButton";

export const metadata = {
    title: "ניהול זהויות | ml_tlv",
    robots: "noindex, nofollow",
};

export default async function AdminUsersPage(props) {
    const searchParams = await props.searchParams;
    const page = Number(searchParams?.page) || 1;
    const LIMIT = 10;
    const offset = (page - 1) * LIMIT;

    const user = await currentUser();
    const currentUserRole = user?.publicMetadata?.role;
    const currentUserEmail = user?.emailAddresses[0]?.emailAddress;
    const canEdit = currentUserRole === 'admin' || currentUserEmail === process.env.ADMIN_EMAIL;

    let users = [];
    let totalUsers = 0;

    const client = await pool.connect();
    try {
        // Fetch Users with specific Role Priority sorting and Pagination
        const [usersRes, countRes] = await Promise.all([
            client.query(`
                SELECT id, first_name, last_name, email, phone, role, created_at 
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
            phone: u.phone,
            role: u.role || 'customer',
            createdAt: u.created_at
        }));

        totalUsers = parseInt(countRes.rows[0].count);
    } finally {
        client.release();
    }

    const totalPages = Math.ceil(totalUsers / LIMIT);

    return (
        <div className="pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ניהול זהויות והרשאות</h1>
                <SyncUsersButton />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-right" dir="rtl">
                        <thead className="bg-gray-50/80 text-gray-500 text-[10px] md:text-xs uppercase font-bold">
                            <tr>
                                <th className="p-4">משתמש</th>
                                <th className="p-4 hidden md:table-cell">אימייל</th>
                                <th className="p-4">נוצר</th>
                                <th className="p-4">תפקיד</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900 mb-0.5">{u.firstName} {u.lastName}</div>
                                        <div className="text-[10px] text-gray-400 font-mono">{u.id}</div>
                                        <div className="md:hidden text-xs text-blue-600 mt-1 truncate max-w-[150px]">{u.email}</div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600 hidden md:table-cell">
                                        <div className="font-medium">{u.email}</div>
                                        {u.phone && (
                                            <div className="text-xs text-gray-400 mt-1">
                                                <a href={`tel:${u.phone}`} className="hover:text-blue-600 transition-colors">
                                                    {u.phone}
                                                </a>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-xs md:text-sm text-gray-500 whitespace-nowrap">
                                        {new Date(u.createdAt).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-end md:justify-center">
                                            <UserRoleSelect
                                                userId={u.id}
                                                initialRole={u.role}
                                                canEdit={canEdit}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination & Count */}
            <div className="mt-8 flex flex-col items-center gap-6">
                {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/admin/users?page=${Math.max(1, page - 1)}`}
                            className={`p-2 w-10 h-10 flex items-center justify-center border rounded-xl hover:bg-gray-50 transition ${page === 1 ? 'opacity-30 pointer-events-none' : ''}`}
                            aria-disabled={page === 1}
                        >
                            <span className="sr-only">הקודם</span>
                            <span aria-hidden="true">→</span>
                        </Link>

                        <div className="flex gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                .map((p, i, arr) => {
                                    const showDots = i > 0 && p - arr[i-1] > 1;
                                    return (
                                        <React.Fragment key={p}>
                                            {showDots && <span className="px-2 self-end text-gray-400">...</span>}
                                            <Link
                                                href={`/admin/users?page=${p}`}
                                                className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${page === p ? 'bg-black text-white shadow-lg scale-110' : 'hover:bg-gray-100 text-gray-600'}`}
                                            >
                                                {p}
                                            </Link>
                                        </React.Fragment>
                                    );
                                })}
                        </div>

                        <Link
                            href={`/admin/users?page=${Math.min(totalPages, page + 1)}`}
                            className={`p-2 w-10 h-10 flex items-center justify-center border rounded-xl hover:bg-gray-50 transition ${page === totalPages ? 'opacity-30 pointer-events-none' : ''}`}
                            aria-disabled={page === totalPages}
                        >
                            <span className="sr-only">הבא</span>
                            <span aria-hidden="true">←</span>
                        </Link>
                    </div>
                )}

                <div className="text-xs text-gray-400 font-bold bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                    סה״כ {totalUsers} משתמשים רשומים
                </div>
            </div>
        </div>
    );
}
