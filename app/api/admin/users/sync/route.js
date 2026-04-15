import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import pool from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
    const client = await pool.connect();
    try {
        console.log("Starting full user sync from Clerk...");
        const clerk = await clerkClient();
        
        // Fetch all users from Clerk
        const clerkUsers = await clerk.users.getUserList({
            limit: 100,
        });

        let syncedCount = 0;

        for (const user of clerkUsers.data) {
            const id = user.id;
            const email = user.emailAddresses?.[0]?.email_address || '';
            const firstName = user.firstName || '';
            const lastName = user.lastName || '';
            const role = user.publicMetadata?.role || 'customer';
            const imageUrl = user.imageUrl || '';
            const createdDate = new Date(user.createdAt);

            await client.query(`
                INSERT INTO users (id, email, first_name, last_name, role, image_url, phone, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                ON CONFLICT (email) DO UPDATE SET
                    id = EXCLUDED.id,
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    role = EXCLUDED.role,
                    image_url = EXCLUDED.image_url,
                    phone = CASE 
                        WHEN users.phone IS NOT NULL AND users.phone != '' THEN users.phone 
                        ELSE EXCLUDED.phone 
                    END,
                    updated_at = NOW()
            `, [id, email, firstName, lastName, role, imageUrl, '', createdDate]);
            
            syncedCount++;
        }

        console.log(`Sync completed: ${syncedCount} users processed.`);
        return NextResponse.json({ success: true, syncedCount });
    } catch (error) {
        console.error("Sync failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
