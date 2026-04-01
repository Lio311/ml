
import pool from "../../lib/db";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";


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

    async function deleteRequest(formData) {
        "use server";
        const user = await currentUser();
        const canEdit = user?.publicMetadata?.role === 'admin' || user?.emailAddresses[0]?.emailAddress === process.env.ADMIN_EMAIL;
        if (!canEdit) throw new Error("Unauthorized");

        const id = formData.get("id");

        const client = await pool.connect();
        try {
            await client.query('DELETE FROM perfume_requests WHERE id = $1', [id]);
        } finally {
            client.release();
        }
        revalidatePath("/admin/requests");
    }

    async function updateRequest(formData) {
        "use server";
        const user = await currentUser();
        const canEdit = user?.publicMetadata?.role === 'admin' || user?.emailAddresses[0]?.emailAddress === process.env.ADMIN_EMAIL;
        if (!canEdit) throw new Error("Unauthorized");

        const id = formData.get("id");

        const brand = formData.get("brand");
        const model = formData.get("model");

        const client = await pool.connect();
        try {
            await client.query('UPDATE perfume_requests SET brand = $1, model = $2 WHERE id = $3', [brand, model, id]);
        } finally {
            client.release();
        }
        revalidatePath("/admin/requests");
    }

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
                            <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-4 text-xs font-bold text-gray-400">{req.id}</td>
                                <td className="p-4 text-sm font-bold text-gray-900 text-right">{req.user_email || 'לא ידוע'}</td>

                                {/* Brand Input (Centered) */}
                                <td className="p-4 text-center">
                                    {canEdit ? (
                                        <input
                                            form={`update-${req.id}`}
                                            name="brand"
                                            defaultValue={req.brand}
                                            className="border-2 border-gray-100 rounded-xl px-3 py-1.5 text-sm w-40 text-center focus:border-black focus:ring-0 outline-none transition-colors font-bold"
                                        />
                                    ) : (
                                        <span className="text-gray-900 font-bold">{req.brand}</span>
                                    )}
                                </td>

                                {/* Model Input (Centered) */}
                                <td className="p-4 text-center">
                                    {canEdit ? (
                                        <input
                                            form={`update-${req.id}`}
                                            name="model"
                                            defaultValue={req.model}
                                            className="border-2 border-gray-100 rounded-xl px-3 py-1.5 text-sm w-40 text-center focus:border-black focus:ring-0 outline-none transition-colors font-bold"
                                        />
                                    ) : (
                                        <span className="text-gray-900 font-bold">{req.model}</span>
                                    )}
                                </td>


                                <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                                    {new Date(req.created_at).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </td>

                                <td className="p-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <form id={`update-${req.id}`} action={updateRequest} className="hidden">
                                            <input type="hidden" name="id" value={req.id} />
                                        </form>

                                        {canEdit && (
                                            <>
                                                <button
                                                    form={`update-${req.id}`}
                                                    type="submit"
                                                    className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-sm"
                                                >
                                                    עדכן
                                                </button>

                                                <form action={deleteRequest}>
                                                    <input type="hidden" name="id" value={req.id} />
                                                    <button
                                                        type="submit"
                                                        className="text-red-500 hover:text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-xl transition-all active:scale-95"
                                                        title="מחק"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                        </svg>
                                                    </button>
                                                </form>
                                            </>
                                        )}
                                        {!canEdit && <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">צפייה בלבד</span>}
                                    </div>
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {requests.map((req) => (
                    <div key={req.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1 flex-1">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></span>
                                    #{req.id}
                                </div>
                                <div className="text-sm font-black text-gray-900 leading-tight truncate max-w-[180px]">{req.user_email || 'לא ידוע'}</div>
                            </div>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0 pt-0.5">
                                {new Date(req.created_at).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 opacity-60">מותג</label>
                                {canEdit ? (
                                    <input
                                        form={`update-mobile-${req.id}`}
                                        name="brand"
                                        defaultValue={req.brand}
                                        className="w-full border-2 border-gray-200/50 bg-white rounded-xl px-3 py-2 text-sm font-bold focus:border-black outline-none transition-colors"
                                    />
                                ) : (
                                    <div className="text-sm font-black text-gray-900">{req.brand}</div>
                                )}
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 opacity-60">דגם</label>
                                {canEdit ? (
                                    <input
                                        form={`update-mobile-${req.id}`}
                                        name="model"
                                        defaultValue={req.model}
                                        className="w-full border-2 border-gray-200/50 bg-white rounded-xl px-3 py-2 text-sm font-bold focus:border-black outline-none transition-colors"
                                    />
                                ) : (
                                    <div className="text-sm font-black text-gray-900">{req.model}</div>
                                )}
                            </div>
                        </div>

                        {canEdit && (
                            <div className="flex gap-3 pt-4 border-t border-gray-100/50 mt-1">
                                <form id={`update-mobile-${req.id}`} action={updateRequest} className="flex-1">
                                    <input type="hidden" name="id" value={req.id} />
                                    <button
                                        type="submit"
                                        className="w-full h-11 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all"
                                    >
                                        עדכן
                                    </button>
                                </form>

                                <form action={deleteRequest} className="shrink-0">
                                    <input type="hidden" name="id" value={req.id} />
                                    <button
                                        type="submit"
                                        className="w-14 h-11 flex items-center justify-center text-red-500 bg-red-50 rounded-2xl border border-red-100/50 active:scale-95 transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                        </svg>
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                ))}
                {requests.length === 0 && (
                    <div className="text-center p-16 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 text-gray-400 font-bold italic">
                        אין בקשות בשמים להצגה
                    </div>
                )}
            </div>

            {/* Pagination Controls - Brand Style */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-12 py-8 border-t border-gray-100">
                    <Link
                        href={`/admin/requests?page=${Math.max(1, page - 1)}`}
                        className={`w-12 h-12 flex items-center justify-center border-2 border-gray-100 rounded-2xl hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm active:scale-95 ${page === 1 ? 'opacity-30 pointer-events-none' : ''}`}
                        aria-disabled={page === 1}
                    >
                        →
                    </Link>

                    <div className="bg-gray-100 px-5 py-2.5 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">
                         <span dir="ltr">{page} / {totalPages}</span>
                    </div>

                    <Link
                        href={`/admin/requests?page=${Math.min(totalPages, page + 1)}`}
                        className={`w-12 h-12 flex items-center justify-center border-2 border-gray-100 rounded-2xl hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm active:scale-95 ${page === totalPages ? 'opacity-30 pointer-events-none' : ''}`}
                        aria-disabled={page === totalPages}
                    >
                        ←
                    </Link>
                </div>
            )}
        </div>
    );
}
