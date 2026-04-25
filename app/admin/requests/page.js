
import pool from "../../lib/db";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import RequestRow from "./RequestRow";

export const metadata = {
    title: "בקשות בשמים",
    robots: "noindex, nofollow",
};

export default async function AdminRequestsPage(props) {
    const searchParams = await props.searchParams;
    const page = Number(searchParams?.page) || 1;
    const LIMIT = 5;
    const offset = (page - 1) * LIMIT;

    const client = await pool.connect();
    let requests = [];
    let totalRequests = 0;

    try {
        const [reqRes, countRes] = await Promise.all([
            client.query('SELECT id, user_email, brand, model, created_at FROM perfume_requests ORDER BY created_at DESC LIMIT $1 OFFSET $2', [LIMIT, offset]),
            client.query('SELECT COUNT(*) FROM perfume_requests')
        ]);
        requests = reqRes.rows;
        totalRequests = parseInt(countRes.rows[0].count);
    } finally {
        client.release();
    }

    const totalPages = Math.ceil(totalRequests / LIMIT);

    const user = await currentUser();
    const canEdit = user?.publicMetadata?.role === 'admin' || user?.emailAddresses[0]?.emailAddress === process.env.ADMIN_EMAIL;

    return (
        <div className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold">ניהול בקשות בשמים</h1>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <table className="w-full text-right" dir="rtl">
                    <thead className="bg-gray-50/80 text-gray-500 text-[10px] uppercase font-black border-b border-gray-100">
                        <tr>
                            <th className="p-4 text-center">#</th>
                            <th className="p-4">משתמש</th>
                            <th className="p-4 text-center">מותג</th>
                            <th className="p-4 text-center">דגם</th>
                            <th className="p-4 text-center">תאריך</th>
                            <th className="p-4 text-center">פעולות</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-center">
                        {requests.map((req) => (
                            <RequestRow key={req.id} req={req} canEdit={canEdit} />
                        ))}
                    </tbody>
                </table>
                {requests.length === 0 && (
                    <div className="p-12 text-center text-gray-400 font-bold italic">
                        אין בקשות בשמים להצגה
                    </div>
                )}
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {requests.map((req) => (
                    <RequestRow key={`mobile-${req.id}`} req={req} canEdit={canEdit} />
                ))}
                {requests.length === 0 && (
                    <div className="text-center p-16 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 text-gray-400 font-bold italic">
                        אין בקשות בשמים להצגה
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-12 py-8 border-t border-gray-100">
                    <Link
                        href={`/admin/requests?page=${Math.max(1, page - 1)}`}
                        className={`w-12 h-12 flex items-center justify-center border-2 border-gray-100 rounded-2xl hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm active:scale-95 ${page === 1 ? 'opacity-30 pointer-events-none' : ''}`}
                    >
                        →
                    </Link>

                    <div className="bg-gray-100 px-5 py-2.5 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">
                         <span dir="ltr">{page} / {totalPages}</span>
                    </div>

                    <Link
                        href={`/admin/requests?page=${Math.min(totalPages, page + 1)}`}
                        className={`w-12 h-12 flex items-center justify-center border-2 border-gray-100 rounded-2xl hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm active:scale-95 ${page === totalPages ? 'opacity-30 pointer-events-none' : ''}`}
                    >
                        ←
                    </Link>
                </div>
            )}
        </div>
    );
}
