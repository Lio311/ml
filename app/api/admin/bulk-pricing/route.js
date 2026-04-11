import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { auth as clerkAuth } from '@clerk/nextjs/server';

// DDL for the table (Safe to keep here for auto-creation)
const CREATE_TABLE_SQL = `
    CREATE TABLE IF NOT EXISTS bulk_pricing_log (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        admin_id TEXT,
        filter_type TEXT,
        brand TEXT,
        amount NUMERIC,
        sizes TEXT[],
        affected_count INTEGER,
        affected_products JSONB,
        undone BOOLEAN DEFAULT FALSE
    );
`;

export async function GET() {
    try {
        const res = await pool.query('SELECT * FROM bulk_pricing_log ORDER BY created_at DESC LIMIT 50');
        return NextResponse.json({ logs: res.rows });
    } catch (error) {
        console.error("Fetch Logs Error:", error);
        return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const { filterType, brand, amount, sizes } = await req.json();
        const authData = await clerkAuth();

        if (!filterType || amount === undefined || !sizes || sizes.length === 0) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Ensure table exists
        await pool.query(CREATE_TABLE_SQL);

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 2. Build Query to find products
            let query = 'SELECT id, brand, price_2ml, price_5ml, price_10ml, discount_percentage FROM products WHERE active = true';
            const params = [];

            if (filterType === 'on_sale') {
                query += ' AND discount_percentage > 0';
            } else if (filterType === 'not_on_sale') {
                query += ' AND (discount_percentage IS NULL OR discount_percentage = 0)';
            }

            if (brand) {
                query += ` AND (brand ILIKE $${params.length + 1} OR brand_he ILIKE $${params.length + 1})`;
                params.push(`%${brand}%`);
            }

            const productsRes = await client.query(query, params);
            const products = productsRes.rows;

            if (products.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({ error: "No products matched the filters" }, { status: 404 });
            }

            const affectedProductsLog = [];
            const updatePromises = [];

            for (const p of products) {
                const oldPrices = {
                    price_2ml: p.price_2ml,
                    price_5ml: p.price_5ml,
                    price_10ml: p.price_10ml
                };
                
                const updates = {};
                const discFactor = 1 - (p.discount_percentage || 0) / 100;
                
                sizes.forEach(size => {
                    const priceCol = `price_${size}`;
                    const currentBasePrice = p[priceCol];
                    
                    if (currentBasePrice && currentBasePrice > 0) {
                        const currentVisiblePrice = currentBasePrice * discFactor;
                        const newVisiblePrice = Math.max(0, currentVisiblePrice + Number(amount));
                        const newBasePrice = discFactor > 0 ? (newVisiblePrice / discFactor) : newVisiblePrice;
                        
                        updates[priceCol] = Math.round(newBasePrice * 100) / 100; // Round to 2 decimals
                    }
                });

                if (Object.keys(updates).length > 0) {
                    affectedProductsLog.push({ id: p.id, oldPrices });
                    
                    const setClause = Object.keys(updates).map((key, i) => `${key} = $${i + 2}`).join(', ');
                    const updateValues = Object.values(updates);
                    updatePromises.push(client.query(
                        `UPDATE products SET ${setClause} WHERE id = $1`,
                        [p.id, ...updateValues]
                    ));
                }
            }

            await Promise.all(updatePromises);

            // 3. Create Log entry
            await client.query(`
                INSERT INTO bulk_pricing_log (admin_id, filter_type, brand, amount, sizes, affected_count, affected_products)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                authData?.userId,
                filterType,
                brand || 'All Brands',
                amount,
                sizes,
                affectedProductsLog.length,
                JSON.stringify(affectedProductsLog)
            ]);

            await client.query('COMMIT');
            return NextResponse.json({ success: true, count: affectedProductsLog.length });
        } catch (dbError) {
            await client.query('ROLLBACK');
            throw dbError;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Bulk Pricing Error:", error);
        return NextResponse.json({ error: "Action failed" }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { id } = await req.json();
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const logRes = await client.query('SELECT * FROM bulk_pricing_log WHERE id = $1 AND undone = false', [id]);
            if (logRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({ error: "Log entry not found or already undone" }, { status: 404 });
            }

            const log = logRes.rows[0];
            const affected = log.affected_products; // Array of {id, oldPrices}

            for (const p of affected) {
                await client.query(`
                    UPDATE products 
                    SET price_2ml = $2, price_5ml = $3, price_10ml = $4
                    WHERE id = $1
                `, [p.id, p.oldPrices.price_2ml, p.oldPrices.price_5ml, p.oldPrices.price_10ml]);
            }

            await client.query('UPDATE bulk_pricing_log SET undone = true WHERE id = $1', [id]);

            await client.query('COMMIT');
            return NextResponse.json({ success: true });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Undo Error:", error);
        return NextResponse.json({ error: "Failed to undo" }, { status: 500 });
    }
}
