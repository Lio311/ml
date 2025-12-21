import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { currentUser } from '@clerk/nextjs/server';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // optional filtering
    const year = searchParams.get('year');

    const client = await pool.connect();
    try {
        let query = 'SELECT * FROM expenses ORDER BY date DESC';
        let values = [];

        if (month && year) {
            // If month/year provided, we might want specific filtering, 
            // but usually for the Management Page we just want all of them or paginated.
            // For simplicity, let's return all for now and filter client side or add specific WHERE logic if list grows too big.
        }

        const res = await client.query(query, values);
        return NextResponse.json(res.rows);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function POST(req) {
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    if (role !== 'admin' && user?.emailAddresses[0]?.emailAddress !== 'lior31197@gmail.com') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { description, amount, type, date } = await req.json();

    const client = await pool.connect();
    try {
        const res = await client.query(
            'INSERT INTO expenses (description, amount, type, date) VALUES ($1, $2, $3, $4) RETURNING *',
            [description, amount, type || 'monthly', date || new Date()]
        );
        return NextResponse.json(res.rows[0]);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to add expense' }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function PUT(req) {
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    if (role !== 'admin' && user?.emailAddresses[0]?.emailAddress !== 'lior31197@gmail.com') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id, description, amount, type, date } = await req.json();

    const client = await pool.connect();
    try {
        const res = await client.query(
            'UPDATE expenses SET description = $1, amount = $2, type = $3, date = $4 WHERE id = $5 RETURNING *',
            [description, amount, type, date, id]
        );
        return NextResponse.json(res.rows[0]);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function DELETE(req) {
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    if (role !== 'admin' && user?.emailAddresses[0]?.emailAddress !== 'lior31197@gmail.com') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await req.json();

    const client = await pool.connect();
    try {
        await client.query('DELETE FROM expenses WHERE id = $1', [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
    } finally {
        client.release();
    }
}
