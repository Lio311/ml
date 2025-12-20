import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

// GET: Fetch current inventory and recent purchases
export async function GET() {
    try {
        const client = await pool.connect();
        try {
            // 1. Get Inventory
            const invRes = await client.query('SELECT * FROM bottle_inventory ORDER BY size ASC');

            // 2. Get Recent Purchases (Last 50)
            const histRes = await client.query('SELECT * FROM bottle_purchases ORDER BY purchase_date DESC LIMIT 50');

            return NextResponse.json({
                inventory: invRes.rows,
                history: histRes.rows
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Inventory Fetch Error:", error);
        return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
    }
}

// POST: Add new purchase (Increase stock)
export async function POST(req) {
    try {
        const { size, quantity, date, notes } = await req.json();

        if (!size || !quantity) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

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
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Inventory Update Error:", error);
        return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 });
    }
}
