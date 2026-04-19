import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { checkAdmin } from '@/app/lib/admin';

export async function PUT(req, props) {
    const params = await props.params;
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { id } = params;
        const { name, base_salary, commission_percent } = await req.json();

        const res = await pool.query(
            'UPDATE influencers SET name = $1, base_salary = $2, commission_percent = $3 WHERE id = $4 RETURNING *',
            [name, base_salary, commission_percent, id]
        );

        if (res.rows.length === 0) {
            return NextResponse.json({ error: "Influencer not found" }, { status: 404 });
        }

        return NextResponse.json(res.rows[0]);
    } catch (error) {
        console.error("PUT Influencer Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req, props) {
    const params = await props.params;
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { id } = params;
        await pool.query('DELETE FROM influencers WHERE id = $1', [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE Influencer Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
