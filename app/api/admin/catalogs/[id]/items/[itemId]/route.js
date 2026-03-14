import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import pool from '@/app/lib/db';

export async function PUT(req, context) {
    let client;
    try {
        const { userId, sessionClaims } = await auth();
        const params = await context.params;
        const { id, itemId } = params;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admin check
        const role = sessionClaims?.metadata?.role;
        const userEmail = sessionClaims?.email || '';
        if (role !== 'admin' && userEmail !== 'lior31197@gmail.com') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { 
            brand, 
            fragrance_name, 
            description, 
            prices, 
            image_url,
            top_notes,
            middle_notes,
            base_notes,
            gender,
            category
        } = body;

        if (!brand || !fragrance_name || !description || !prices || !image_url || !gender || !category || Object.keys(prices).length === 0) {
            return NextResponse.json({ error: 'שדות מותג, שם בושם, תיאור, מחירים, תמונה, מגדר וקטגוריה הם חובה' }, { status: 400 });
        }

        client = await pool.connect();
        
        const res = await client.query(
            `UPDATE user_catalog_items 
             SET brand = $1, fragrance_name = $2, name = $3, description = $4, prices = $5, image_url = $6, 
                 top_notes = $7, middle_notes = $8, base_notes = $9, gender = $10, category = $11
             WHERE id = $12 AND catalog_id = $13 RETURNING *`,
            [brand, fragrance_name, `${brand} ${fragrance_name}`, description, JSON.stringify(prices), image_url, top_notes || '', middle_notes || '', base_notes || '', gender, category, itemId, id]
        );

        if (res.rowCount === 0) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        return NextResponse.json(res.rows[0]);
    } catch (error) {
        console.error('Error admin updating catalog item:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}

export async function DELETE(req, context) {
    let client;
    try {
        const { userId, sessionClaims } = await auth();
        const params = await context.params;
        const { id, itemId } = params;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admin check
        const role = sessionClaims?.metadata?.role;
        const userEmail = sessionClaims?.email || '';
        if (role !== 'admin' && userEmail !== 'lior31197@gmail.com') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        client = await pool.connect();
        
        const res = await client.query(
            'DELETE FROM user_catalog_items WHERE id = $1 AND catalog_id = $2 RETURNING *',
            [itemId, id]
        );

        if (res.rowCount === 0) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, item: res.rows[0] });
    } catch (error) {
        console.error('Error admin deleting catalog item:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}
