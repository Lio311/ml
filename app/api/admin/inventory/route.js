import { NextResponse } from 'next/server';
import { withAdminApi } from '../../../lib/withAdminApi';

// GET: Fetch current inventory and recent purchases
export const GET = withAdminApi(async (req, { client }) => {
    // 1. Get Inventory
    const invRes = await client.query('SELECT size, quantity FROM bottle_inventory ORDER BY size ASC');

    // 2. Get Recent Purchases (Last 50)
    const histRes = await client.query('SELECT id, size, quantity, purchase_date, notes, created_at FROM bottle_purchases ORDER BY purchase_date DESC LIMIT 50');

    return NextResponse.json({
        inventory: invRes.rows,
        history: histRes.rows
    });
});

// POST: Add new purchase (Increase stock)
export const POST = withAdminApi(async (req, { client }) => {
    const { size, quantity, date, notes } = await req.json();

    if (!size || !quantity) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await client.query('BEGIN');
    try {
        // 1. Log Purchase
        await client.query(`
            INSERT INTO bottle_purchases (size, quantity, purchase_date, notes)
            VALUES ($1, $2, $3, $4)
        `, [size, quantity, date || new Date(), notes]);

        // 2. Update Inventory (Increase)
        await client.query(`
            UPDATE bottle_inventory 
            SET quantity = quantity + $1 
            WHERE size = $2
        `, [quantity, size]);

        await client.query('COMMIT');
        return NextResponse.json({ success: true });
    } catch (dbError) {
        await client.query('ROLLBACK');
        throw dbError;
    }
});

// DELETE: Remove purchase log and REVERT the stock addition
export const DELETE = withAdminApi(async (req, { client }) => {
    const { id } = await req.json();

    await client.query('BEGIN');
    try {
        // 1. Get the purchase details to know what to revert
        const res = await client.query('SELECT size, quantity FROM bottle_purchases WHERE id = $1', [id]);
        if (res.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
        }
        const purchase = res.rows[0];

        // 2. Revert Inventory (Subtract what was added)
        await client.query(`
            UPDATE bottle_inventory 
            SET quantity = quantity - $1 
            WHERE size = $2
        `, [purchase.quantity, purchase.size]);

        // 3. Delete Log
        await client.query('DELETE FROM bottle_purchases WHERE id = $1', [id]);

        await client.query('COMMIT');
        return NextResponse.json({ success: true });
    } catch (dbError) {
        await client.query('ROLLBACK');
        throw dbError;
    }
});

// PUT: Edit purchase log and ADJUST stock
export const PUT = withAdminApi(async (req, { client }) => {
    const { id, size, quantity, notes } = await req.json();

    await client.query('BEGIN');
    try {
        // 1. Get Old Details
        const res = await client.query('SELECT size, quantity FROM bottle_purchases WHERE id = $1', [id]);
        if (res.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
        }
        const oldPurchase = res.rows[0];

        // 2. Handle Logic
        if (oldPurchase.size === size) {
            // Same Size: Adjust difference
            const diff = quantity - oldPurchase.quantity;
            await client.query(`
                UPDATE bottle_inventory SET quantity = quantity + $1 WHERE size = $2
            `, [diff, size]);
        } else {
            // Changed Size: Revert Old, Add New
            // Revert Old
            await client.query(`
                UPDATE bottle_inventory SET quantity = quantity - $1 WHERE size = $2
            `, [oldPurchase.quantity, oldPurchase.size]);
            // Add New
            await client.query(`
                UPDATE bottle_inventory SET quantity = quantity + $1 WHERE size = $2
            `, [quantity, size]);
        }

        // 3. Update Log
        await client.query(`
            UPDATE bottle_purchases 
            SET size = $1, quantity = $2, notes = $3
            WHERE id = $4
        `, [size, quantity, notes, id]);

        await client.query('COMMIT');
        return NextResponse.json({ success: true });
    } catch (dbError) {
        await client.query('ROLLBACK');
        throw dbError;
    }
});
