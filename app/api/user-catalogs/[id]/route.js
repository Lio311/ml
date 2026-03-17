import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAuthenticatedClient } from '@/app/lib/db';
import { recordAuditLog } from '@/app/lib/audit';

export async function GET(req, context) {
    let client;
    try {
        console.log("GET /api/user-catalogs/[id]: Starting request...");
        // Check if auth is defined in the module scope
        if (typeof auth === 'undefined') {
            console.error("DEBUG: 'auth' is UNDEFINED in module scope of GET!");
            throw new ReferenceError("auth is not defined in GET scope");
        }
        
        const authData = await auth();
        const userId = authData?.userId;
        console.log("GET /api/user-catalogs/[id]: Authenticated userId:", userId);
        
        const params = await context.params;
        const { id } = params;
        
        if (!userId) {
            console.log("GET /api/user-catalogs/[id]: Unauthorized");
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        client = await getAuthenticatedClient(userId);
        const res = await client.query('SELECT * FROM user_catalogs WHERE id = $1', [id]);
        if (res.rows.length === 0) {
            return NextResponse.json({ error: 'Catalog not found or unauthorized' }, { status: 404 });
        }
        return NextResponse.json(res.rows[0]);
    } catch (error) {
        console.error('Error fetching user catalog:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}

export async function PUT(req, context) {
    let client;
    try {
        console.log("PUT /api/user-catalogs/[id]: Starting request...");
        const { userId } = await auth();
        console.log("PUT /api/user-catalogs/[id]: Authenticated userId:", userId);
        
        const params = await context.params;
        const { id } = params;

        if (!userId) {
            console.log("PUT /api/user-catalogs/[id]: Unauthorized");
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { 
            name, description, contact_email, slug, image_url, 
            self_pickup_active, delivery_active, delivery_price, sample_tiers 
        } = body;

        if (!name || !contact_email || !slug) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate slug format
        if (!/^[a-z0-9-]+$/.test(slug)) {
            return NextResponse.json({ error: 'Slug must contain only lowercase letters, numbers, and dashes' }, { status: 400 });
        }

        client = await getAuthenticatedClient(userId);
        
        // Check ownership (RLS will also handle this, but explicit check is good for error messages)
        const check = await client.query('SELECT id FROM user_catalogs WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            return NextResponse.json({ error: 'Catalog not found or unauthorized' }, { status: 404 });
        }

        // Check if slug is taken by ANOTHER catalog
        const slugCheck = await client.query('SELECT id FROM user_catalogs WHERE slug = $1 AND id != $2', [slug, id]);
        if (slugCheck.rows.length > 0) {
            return NextResponse.json({ error: 'Slug text already taken. Please choose another one.' }, { status: 409 });
        }

        const res = await client.query(
            `UPDATE user_catalogs 
             SET name = $1, description = $2, contact_email = $3, slug = $4, image_url = $5,
                 self_pickup_active = COALESCE($7, self_pickup_active),
                 delivery_active = COALESCE($8, delivery_active),
                 delivery_price = COALESCE($9, delivery_price),
                 sample_tiers = COALESCE($10, sample_tiers)
             WHERE id = $6 RETURNING *`,
            [
                name, description, contact_email, slug, image_url || null, id,
                self_pickup_active, delivery_active, delivery_price, 
                sample_tiers ? JSON.stringify(sample_tiers) : null
            ]
        );

        // Record Audit Log
        await recordAuditLog({
            userId,
            action: 'update_catalog',
            entityType: 'catalog',
            entityId: id,
            details: { name, slug },
            req
        });

        return NextResponse.json(res.rows[0]);
    } catch (error) {
        console.error('Error updating user catalog:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}

export async function DELETE(req, context) {
    let client;
    try {
        console.log("DELETE /api/user-catalogs/[id]: Starting request...");
        const { userId } = await auth();
        console.log("DELETE /api/user-catalogs/[id]: Authenticated userId:", userId);
        
        const params = await context.params;
        const { id } = params;

        if (!userId) {
            console.log("DELETE /api/user-catalogs/[id]: Unauthorized");
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        client = await getAuthenticatedClient(userId);
        
        // Check ownership and delete
        const res = await client.query('DELETE FROM user_catalogs WHERE id = $1 RETURNING id, name', [id]);
        
        if (res.rowCount === 0) {
             return NextResponse.json({ error: 'Catalog not found or unauthorized' }, { status: 404 });
        }

        // Record Audit Log
        await recordAuditLog({
            userId,
            action: 'delete_catalog',
            entityType: 'catalog',
            entityId: id,
            details: { name: res.rows[0].name },
            req
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting user catalog:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}
