const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

const translations = [
    {
        id: 149,
        description_en: "The biggest surprise on the list. Caramelized banana on the fire, mixed with smoky Oud wood. It sounds strange, but it works. An exotic, creative gourmand, unlike anything you've ever smelled.",
        top_notes_en: "Banana, Milk",
        middle_notes_en: "Ambrette, Vanilla",
        base_notes_en: "Oud, Sandalwood, Tonka Bean"
    },
    {
        id: 167,
        description_en: "Sun at its peak. Citrus, mint, and white flowers. A bright, optimistic, and fresh scent perfect for the middle of a workday or brunch.",
        top_notes_en: "Citrus, Mint",
        middle_notes_en: "Jasmine, Neroli",
        base_notes_en: "Vetiver, Ambergris"
    },
    {
        id: 180,
        description_en: "Not the blue and happy sea of a vacation, but the dark depths of the ocean. The scent of very salty water, seaweed, iodine, and an approaching storm. It smells like wet skin coming out of the sea—mineral, salty, and a bit dark. A perfume that tells a story of the power of nature and rushing waters. Suitable for: Lovers of aquatic perfumes looking for a more mature, serious, and rugged version, without the sweetness of standard summer fragrances.",
        top_notes_en: "Ginger, Ylang Ylang",
        middle_notes_en: "Tiare Flower, Marine Notes",
        base_notes_en: "Seaweed, Musk"
    },
    {
        id: 177,
        description_en: "A journey into the heart of the wild and ancient jungle. This is not the scent of a well-kept garden, but the exact, sharp, and green scent obtained at the moment a moist green branch is broken and the resin (Galbanum) splashes out. A green, bittersweet, and incredibly deep fragrance of tangled vegetation, roots, and wet earth, radiating a powerful and uncompromising connection to the forces of nature. Suitable for: Devoted nature lovers looking for the 'greenest' and wildest truth, without the sweetness of fruit or vanilla, but only the cleanliness of the forest itself.",
        top_notes_en: "Green Notes, Galbanum",
        middle_notes_en: "Grass, Green Leaves",
        base_notes_en: "Resins, Woody Notes"
    },
    {
        id: 172,
        description_en: "The scent of black magic. This is not just campfire smoke, but an ancient ritual incense mixed with the surprising and juicy sweetness of Pomegranate and Ginger. The result is a mystical, dark, but also fruity and strangely seductive scent. Suitable for: Mysterious people who love the smell of ancient churches or spiritual rituals but want a modern and sweet twist that won't overwhelm the surroundings.",
        top_notes_en: "Incense, Pomegranate, Ginger",
        middle_notes_en: "Smoke, Spice",
        base_notes_en: "Resin, Wood"
    },
    {
        id: 183,
        description_en: "The carnival of Rio in a bottle. This is a 'samba' of scents—a colorful and joyful burst of tropical fruits (Passion Fruit, Peach, Mango) mixed with fresh green tomato leaves. The perfume feels like drinking a frozen caipirinha on the beach at sunset, with your feet in the sand and music in the background.",
        top_notes_en: "Bergamot, Orange, Tomato Leaves, Cedar",
        middle_notes_en: "Passion Fruit, Mango, Peach, Magnolia",
        base_notes_en: "Sandalwood, Cedar, Musk, Vetiver"
    }
];

async function performUpdate() {
    const client = await pool.connect();
    try {
        for (const t of translations) {
            console.log(`Updating product ${t.id}...`);
            await client.query(
                `UPDATE products SET 
                    description_en = $1, 
                    top_notes_en = $2, 
                    middle_notes_en = $3, 
                    base_notes_en = $4 
                 WHERE id = $5`,
                [t.description_en, t.top_notes_en, t.middle_notes_en, t.base_notes_en, t.id]
            );
        }
        console.log('Batch 2 updated successfully!');
    } finally {
        client.release();
        await pool.end();
    }
}

performUpdate().catch(err => console.error(err));
