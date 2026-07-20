import pool, { withClient } from "../lib/db";
import { sanitizeProductArray } from "../lib/productUtils";

export async function getProducts(search, brand, category, minPrice, maxPrice, sort, page, searchParams) {
    const LIMIT = 16;
    const OFFSET = (page - 1) * LIMIT;

    const joinType = 'LEFT JOIN';

    let query = `
    SELECT p.*, COALESCE(ps.sales_count, 0) as sales_count 
    FROM products p
    ${joinType} product_sales ps ON p.id = ps.product_id
    ${joinType} brands b ON p.brand = b.name
    WHERE p.active = true AND p.stock > 0 AND p.is_discovery_set IS NOT TRUE AND (p.category IS NULL OR p.category != 'מארזים') AND (p.category_en IS NULL OR p.category_en != 'bundles')
  `;
    const params = [];

    if (search) {
        params.push(`%${search}%`);
        query += ` AND (p.name ILIKE $${params.length} 
            OR p.brand ILIKE $${params.length} 
            OR p.model ILIKE $${params.length} 
            OR p.description ILIKE $${params.length} 
            OR p.name_he ILIKE $${params.length}
            OR p.brand_he ILIKE $${params.length}
            OR p.model_he ILIKE $${params.length}
        )`;
    }

    if (brand) {
        const brands = Array.isArray(brand) ? brand : [brand];
        if (brands.length > 0) {
            const placeHolders = brands.map((_, i) => `$${params.length + i + 1}`).join(', ');
            query += ` AND p.brand IN (${placeHolders})`;
            params.push(...brands);
        }
    }

    if (category) {
        const categories = Array.isArray(category) ? category : [category];
        if (categories.length > 0) {
            const hasSpecialFilter = categories.some(c => c === 'בוטיק' || c === 'נישה');
            const otherCategories = categories.filter(c => c !== 'בוטיק' && c !== 'נישה');
            
            let catCondition = '';
            if (otherCategories.length > 0) {
                const placeHolders = otherCategories.map((_, i) => `p.category ILIKE $${params.length + i + 1}`).join(' OR ');
                catCondition = `(${placeHolders})`;
                params.push(...otherCategories.map(c => `%${c}%`));
            }

            if (hasSpecialFilter) {
                const nicheBoutiqueCondition = "p.category NOT ILIKE '%דיזיינר%'";
                if (catCondition) {
                    query += ` AND (${catCondition} OR ${nicheBoutiqueCondition})`;
                } else {
                    query += ` AND ${nicheBoutiqueCondition}`;
                }
            } else if (catCondition) {
                query += ` AND ${catCondition}`;
            }
        }
    }

    if (minPrice) {
        params.push(minPrice);
        query += ` AND p.price_10ml >= $${params.length}`;
    }

    if (maxPrice) {
        params.push(maxPrice);
        query += ` AND p.price_10ml <= $${params.length}`;
    }

    if (searchParams?.season) {
        const seasons = Array.isArray(searchParams.season) ? searchParams.season : [searchParams.season];
        if (seasons.length > 0) {
            const conditions = seasons.map((_, i) => `p.seasons ILIKE $${params.length + i + 1}`).join(' OR ');
            query += ` AND (${conditions})`;
            params.push(...seasons.map(s => `%${s}%`));
        }
    }

    if (searchParams?.perfumer) {
        const perfumers = Array.isArray(searchParams.perfumer) ? searchParams.perfumer : [searchParams.perfumer];
        if (perfumers.length > 0) {
            const conditions = perfumers.map((_, i) => `p.perfumers ILIKE $${params.length + i + 1}`).join(' OR ');
            query += ` AND (${conditions})`;
            params.push(...perfumers.map(p => `%${p}%`));
        }
    }

    if (searchParams?.note) {
        const notes = Array.isArray(searchParams.note) ? searchParams.note : [searchParams.note];
        if (notes.length > 0) {
            const conditions = notes.map((_, i) => `(p.top_notes ILIKE $${params.length + i + 1} OR p.middle_notes ILIKE $${params.length + i + 1} OR p.base_notes ILIKE $${params.length + i + 1})`).join(' OR ');
            query += ` AND (${conditions})`;
            params.push(...notes.map(n => `%${n}%`));
        }
    }

    if (searchParams?.country) {
        const countries = Array.isArray(searchParams.country) ? searchParams.country : [searchParams.country];
        if (countries.length > 0) {
            const placeHolders = countries.map((_, i) => `$${params.length + i + 1}`).join(', ');
            query += ` AND p.country IN (${placeHolders})`;
            params.push(...countries);
        }
    }

    if (searchParams?.concentration) {
        const concentrations = Array.isArray(searchParams.concentration) ? searchParams.concentration : [searchParams.concentration];
        if (concentrations.length > 0) {
            const placeHolders = concentrations.map((_, i) => `$${params.length + i + 1}`).join(', ');
            query += ` AND p.concentration IN (${placeHolders})`;
            params.push(...concentrations);
        }
    }

    const countQuery = `SELECT COUNT(*) FROM (${query}) AS total`;

    let orderBy = 'RANDOM()';
    switch (sort) {
        case 'price_asc':
            orderBy = 'p.price_10ml ASC';
            break;
        case 'price_desc':
            orderBy = 'p.price_10ml DESC';
            break;
        case 'bestsellers':
            orderBy = 'sales_count DESC NULLS LAST, p.name ASC';
            break;
        case 'oldest':
            orderBy = 'p.id ASC';
            break;
        case 'newest':
            orderBy = 'p.id DESC';
            break;
        case 'random':
        default:
            orderBy = 'id DESC';
            break;
    }

    query += ` ORDER BY ${orderBy} LIMIT ${LIMIT} OFFSET ${OFFSET}`;

    return await withClient(async (client) => {
        const countRes = await client.query(countQuery, params);
        const totalProducts = parseInt(countRes.rows[0].count);

        const res = await client.query(query, params);
        return { products: sanitizeProductArray(res.rows), totalProducts, totalPages: Math.ceil(totalProducts / LIMIT) };
    }).catch(error => {
        console.error("SEARCH DEBUG - DB Error:", error);
        console.error("SEARCH DEBUG - Query:", query);
        console.error("SEARCH DEBUG - Params:", params);
        return { products: [], totalProducts: 0, totalPages: 0 };
    });
}
