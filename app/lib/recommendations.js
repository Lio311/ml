/**
 * Recommendation Generation Engine
 * Handles scoring products based on user purchase history and scent profiles.
 */

/**
 * Generates a new recommendation for a specific order, excluding products that were already suggested.
 * @param {import('pg').PoolClient} client 
 * @param {number|string} orderId 
 * @param {string} clerkId 
 * @param {number[]} existingExcludeIds - IDs to exclude from this specific run
 * @returns {Promise<number|null>} - Returns the new recommendation ID or null if none found
 */
export async function generateRecommendationForOrder(client, orderId, clerkId, existingExcludeIds = []) {
    // 1. Fetch order items
    const orderRes = await client.query('SELECT items FROM orders WHERE id = $1', [orderId]);
    if (orderRes.rows.length === 0) return null;
    const items = orderRes.rows[0].items || [];
    const currentOrderProductIds = items
        .map(item => parseInt(item.id, 10))
        .filter(id => !isNaN(id));
    if (currentOrderProductIds.length === 0) return null;

    // 1.5 Fetch ALL PAST orders for this user to avoid recommending anything they already bought
    const allOrdersRes = await client.query("SELECT items FROM orders WHERE customer_details->>'clerk_id' = $1", [clerkId]);
    const allBoughtProductIds = new Set(currentOrderProductIds);
    allOrdersRes.rows.forEach(row => {
        (row.items || []).forEach(item => {
            if (item && item.id) {
                const parsedId = parseInt(item.id, 10);
                if (!isNaN(parsedId)) allBoughtProductIds.add(parsedId);
            }
        });
    });

    // 2. Fetch all previously suggested products for this order to avoid repeating them
    const previousRes = await client.query(`
        SELECT suggested_products 
        FROM pending_recommendation_emails 
        WHERE order_id = $1
    `, [orderId]);
    
    const allPreviouslySuggestedIds = new Set(existingExcludeIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id)));
    previousRes.rows.forEach(row => {
        let suggested = row.suggested_products || [];
        if (typeof suggested === 'string') {
            try { suggested = JSON.parse(suggested); } catch (e) { suggested = []; }
        }
        suggested.forEach(p => {
            if (p && p.id) {
                const parsedId = parseInt(p.id, 10);
                if (!isNaN(parsedId)) allPreviouslySuggestedIds.add(parsedId);
            }
        });
    });

    // 3. Calculate average price of bought items
    const sum = items.reduce((acc, item) => acc + (parseFloat(item.price) || 0), 0);
    const avgPrice = items.length > 0 ? sum / items.length : 0;

    // 4. Get notes of bought products
    const boughtProducts = await client.query(`
        SELECT top_notes, middle_notes, base_notes
        FROM products 
        WHERE id = ANY($1)
    `, [currentOrderProductIds]);

    const userNotes = new Set();
    boughtProducts.rows.forEach(p => {
        [...(p.top_notes || '').split(','), 
         ...(p.middle_notes || '').split(','), 
         ...(p.base_notes || '').split(',')].forEach(n => {
            const note = n.trim();
            if (note) userNotes.add(note);
         });
    });

    // 5. Fetch candidate products (excluding bought and already suggested)
    const excludeIds = [...new Set([...allBoughtProductIds, ...allPreviouslySuggestedIds])];
    const allOtherProducts = await client.query(`
        SELECT id, name, brand, image_url, top_notes, middle_notes, base_notes, price_5ml, price_10ml
        FROM products 
        WHERE active = true 
        AND stock >= 10
        AND NOT (id = ANY($1))
    `, [excludeIds]);

    // 6. Score candidates
    let candidates = allOtherProducts.rows.map(p => {
        const pNotes = new Set([
            ...(p.top_notes || '').split(',').map(n => n.trim()).filter(Boolean),
            ...(p.middle_notes || '').split(',').map(n => n.trim()).filter(Boolean),
            ...(p.base_notes || '').split(',').map(n => n.trim()).filter(Boolean)
        ]);
        
        let intersection = 0;
        pNotes.forEach(note => {
            if (userNotes.has(note)) intersection++;
        });

        const price = parseFloat(p.price_5ml) || parseFloat(p.price_10ml) || 0;
        const priceDiff = avgPrice > 0 ? Math.abs(price - avgPrice) : 0;
        const pricePenalty = Math.floor(priceDiff / 50);

        return {
            id: p.id,
            name: p.name,
            brand: p.brand,
            image_url: p.image_url,
            price: price,
            notes: [...pNotes].slice(0, 3).join(', '),
            score: intersection - pricePenalty
        };
    });

    candidates.sort((a, b) => b.score - a.score);
    const suggested = candidates.slice(0, 3);
    
    if (suggested.length === 0) return null;

    // 7. Insert new pending record
    const result = await client.query(`
        INSERT INTO pending_recommendation_emails (user_id, order_id, suggested_products, status)
        VALUES ($1, $2, $3, 'pending')
        RETURNING id
    `, [clerkId, orderId, JSON.stringify(suggested)]);

    return result.rows[0].id;
}
