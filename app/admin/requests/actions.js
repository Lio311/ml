
"use server";

import pool from "../../lib/db";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

async function checkAdmin() {
    const user = await currentUser();
    const isAdmin = user?.publicMetadata?.role === 'admin' || user?.emailAddresses[0]?.emailAddress === ADMIN_EMAIL;
    if (!isAdmin) throw new Error("Unauthorized");
    return true;
}

export async function deleteRequest(id) {
    await checkAdmin();
    const client = await pool.connect();
    try {
        await client.query('DELETE FROM perfume_requests WHERE id = $1', [id]);
        revalidatePath("/admin/requests");
        return { success: true };
    } catch (error) {
        console.error("Delete error:", error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}

export async function updateRequest(id, brand, model) {
    await checkAdmin();
    const client = await pool.connect();
    try {
        await client.query('UPDATE perfume_requests SET brand = $1, model = $2 WHERE id = $3', [brand, model, id]);
        revalidatePath("/admin/requests");
        return { success: true };
    } catch (error) {
        console.error("Update error:", error);
        return { success: false, error: error.message };
    } finally {
        client.release();
    }
}
