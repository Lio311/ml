import { NextResponse } from 'next/server';
import { withClient } from '../../../lib/db';

export async function GET() {
    try {
        await withClient(async (client) => {
            await client.query(`
                ALTER TABLE products 
                ADD COLUMN IF NOT EXISTS name_he TEXT,
                ADD COLUMN IF NOT EXISTS cost_price DECIMAL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS original_size DECIMAL DEFAULT 100;
            `);

            // Ensure defaults for existing rows (if NULL exist)
            await client.query(`
                UPDATE products 
                SET cost_price = 0 WHERE cost_price IS NULL;
                UPDATE products 
                SET original_size = 100 WHERE original_size IS NULL;
            `);
        });
        return NextResponse.json({ message: "Migration successful: Added name_he column" });
    } catch (error) {
        console.error("Migration failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
