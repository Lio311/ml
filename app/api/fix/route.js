import { NextResponse } from 'next/server';
import { getAuthenticatedClient } from '../../lib/db';

export async function GET() {
    try {
        const client = await getAuthenticatedClient();
        await client.query(`
            UPDATE users 
            SET address = $1::jsonb, phone = $2 
            WHERE email = $3
        `, [
            JSON.stringify({city: 'אכסאל', street: 'לעדן', houseNumber: '5', apartment: '0'}), 
            '0526881303', 
            '5555hade@gmail.com'
        ]);
        client.release();
        return NextResponse.json({ success: true, message: 'Updated HADE5555' });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
