import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            // Table: Abandoned Carts
            // We use 'email' as primary key because one active cart per user is enough for tracking.
            // If they have multiple devices, last write wins.
            await client.query(`
                CREATE TABLE IF NOT EXISTS abandoned_carts (
                    email TEXT PRIMARY KEY,
                    items JSONB,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    recovery_status TEXT DEFAULT 'pending' 
                );
            `);
            // recovery_status: 'pending', 'sent', 'converted'

            // Table: Coupons
            await client.query(`
                CREATE TABLE IF NOT EXISTS coupons (
                    id SERIAL PRIMARY KEY,
                    code TEXT UNIQUE NOT NULL,
                    discount_percent INTEGER NOT NULL,
                    expires_at TIMESTAMP WITH TIME ZONE,
                    status TEXT DEFAULT 'active',
                    email TEXT, 
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `);
            // status: 'active', 'redeemed', 'expired', 'cancelled'

            console.log("Recovery DB Setup: Tables 'abandoned_carts' and 'coupons' verified/created.");
            return NextResponse.json({ success: true, message: 'Recovery DB setup complete.' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Setup DB Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
