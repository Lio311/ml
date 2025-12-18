
import pool from "../../lib/db";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";


export default async function AdminRequestsPage() {
    const client = await pool.connect();
    let requests = [];
    try {
        const res = await client.query('SELECT * FROM perfume_requests ORDER BY created_at DESC');
        requests = res.rows;
    } finally {
        client.release();
    }

    const user = await currentUser();
    const canEdit = user?.publicMetadata?.role === 'admin' || user?.emailAddresses[0]?.emailAddress === 'lior31197@gmail.com';

    async function deleteRequest(formData) {
        "use server";
        const user = await currentUser();
        const canEdit = user?.publicMetadata?.role === 'admin' || user?.emailAddresses[0]?.emailAddress === 'lior31197@gmail.com';
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
        const canEdit = user?.publicMetadata?.role === 'admin' || user?.emailAddresses[0]?.emailAddress === 'lior31197@gmail.com';
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
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-8">ניהול בקשות בשמים</h1>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 text-center">#</th>
                            <th className="p-4">משתמש</th>
                            <th className="p-4 text-center">מותג</th>
                            <th className="p-4 text-center">דגם</th>
                            <th className="p-4 text-center">תאריך</th>
                            <th className="p-4 text-center">פעולות</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {requests.map((req) => (
                            <tr key={req.id} className="hover:bg-gray-50">
                                <td className="p-4 text-sm text-gray-500 text-center">{req.id}</td>
                                <td className="p-4 text-sm font-mono">{req.user_email || 'לא ידוע'}</td>

                                {/* Brand Input (Centered) */}
                                <td className="p-4 text-center">
                                    {canEdit ? (
                                        <input
                                            form={`update-${req.id}`}
                                            name="brand"
                                            defaultValue={req.brand}
                                            className="border rounded px-2 py-1 text-sm w-32 text-center"
                                        />
                                    ) : (
                                        <span className="text-gray-700">{req.brand}</span>
                                    )}
                                </td>

                                {/* Model Input (Centered) */}
                                <td className="p-4 text-center">
                                    {canEdit ? (
                                        <input
                                            form={`update-${req.id}`}
                                            name="model"
                                            defaultValue={req.model}
                                            className="border rounded px-2 py-1 text-sm w-32 text-center"
                                        />
                                    ) : (
                                        <span className="text-gray-700">{req.model}</span>
                                    )}
                                </td>


                                <td className="p-4 text-xs text-gray-400 text-center">
                                    {new Date(req.created_at).toLocaleString('he-IL')}
                                </td>

                                <td className="p-4 flex items-center justify-center gap-2">
                                    {/* Hidden Update Form Logic */}
                                    {/* We put the form here but it has no visible fields, just the submit button and hidden id. 
                                         The Inputs above refer to it via 'form' attribute. */}
                                    <form id={`update-${req.id}`} action={updateRequest} className="hidden">
                                        <input type="hidden" name="id" value={req.id} />
                                    </form>

                                    {canEdit && (
                                        <>
                                            <button
                                                form={`update-${req.id}`}
                                                type="submit"
                                                className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                                            >
                                                עדכן
                                            </button>

                                            <form action={deleteRequest}>
                                                <input type="hidden" name="id" value={req.id} />
                                                <button
                                                    type="submit"
                                                    className="text-red-500 hover:text-red-700 text-xs font-bold border border-red-200 px-3 py-1 rounded hover:bg-red-50"
                                                >
                                                    מחק
                                                </button>
                                            </form>
                                        </>
                                    )}
                                    {!canEdit && <span className="text-gray-400 text-xs">צפייה בלבד</span>}
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
