const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

const translations = [
    {
        id: 74,
        description_en: "Seven winning ingredients. Cocoa, Rum, Tobacco, and Coconut. A complex, dark, and sweet gourmand perfume that constantly changes on the skin. Interesting and addictive.",
        top_notes_en: "Mandarin, Bergamot",
        middle_notes_en: "Thyme, Myrrh, Nutmeg",
        base_notes_en: "White Musk, Ambroxan, Cashmeran, Oud, Patchouli, Sandalwood, Vanilla, Guaiac Wood, Cypriol Oil"
    },
    {
        id: 132,
        description_en: "A sunset cocktail. Juicy Mango and Passion Fruit at their peak of ripeness. A perfume that simply radiates joy for life, color, and bursting tropical notes.",
        top_notes_en: "Mango, Passion Fruit, Grapefruit",
        middle_notes_en: "Magnolia, Rose",
        base_notes_en: "Sandalwood, Musk"
    },
    {
        id: 197,
        description_en: "A sparkling Bellini cocktail on a hot summer day. The perfume is an eruption of orange joy—juicy and honey-dripping Nectarine meets bubbles of sparkling wine (Prosecco). The scent is a true 'Frizzante' (sparkling)—tingling in the nose, sweet-tart, refreshing, and full of positive energy. Perfect for those who want to smell like the happiest noon party.",
        top_notes_en: "Nectarine, Grapefruit, Sparkling Notes (Champagne/Soda)",
        middle_notes_en: "Peach, Apricot, Citrus Blossom",
        base_notes_en: "Clean Musk, Subtle Sugar"
    },
    {
        id: 125,
        description_en: "A girl on a motorcycle. Sweet Cherry meets a rugged leather jacket and the smell of asphalt. A perfume with 'attitude'—rebellious, rock-style, and cool.",
        top_notes_en: "Cherry, Saffron",
        middle_notes_en: "Ink, Leather",
        base_notes_en: "Cashmeran, Musk"
    },
    {
        id: 145,
        description_en: "Luxury minimalism. Imagine a soft dark grey cashmere sweater. The perfume takes powdery Iris and gives it a backbone of dark Ebony wood and Leather. This is a scent of 'Quiet Luxury'—it doesn't shout, but it radiates quality and good taste at the office or on a date.",
        top_notes_en: "Mandarin, Pink Pepper",
        middle_notes_en: "Iris, Suede",
        base_notes_en: "Peru Balsam, Ebony Wood, Sandalwood"
    },
    {
        id: 163,
        description_en: "A walk in a thick and magical forest. The scent of giant trees (Sequoia), dripping resin, and warm cocoa. An enveloping, calming, and hugging perfume that feels like a wooden cabin in the heart of nature on a gloomy day.",
        top_notes_en: "Bergamot, Ginger, Sage, Saffron",
        middle_notes_en: "Sequoia, Nard, Black Tea, Incense",
        base_notes_en: "Patchouli, Leather, Cocoa, Styrax"
    },
    {
        id: 51,
        description_en: "An imaginary journey to the center of the earth. The perfume opens with the heat of spices and Saffron, developing into a scent of smoky leather and burning resins. It is dark, mystical, and projects an attractive danger. Suitable for the mysterious person in the room, wearing black, and evenings where you want to leave a dramatic impression.",
        top_notes_en: "Saffron, Ginger",
        middle_notes_en: "Cypriol Oil, Leather",
        base_notes_en: "Styrax, Vanilla, Patchouli"
    },
    {
        id: 147,
        description_en: "A feeling of floating above the clouds. A combination of green with a gentle sweetness of honey and fig, creating an aura of heavenly cleanliness. Perfect for dreamy people, for spring, and for those who want to radiate calm, optimism, and purity.",
        top_notes_en: "Galbanum, Fig",
        middle_notes_en: "Tuberose, Jasmine, Narcissus",
        base_notes_en: "Honey, Iris"
    },
    {
        id: 138,
        description_en: "The low voice. Pink Pepper, Chestnut, Peru Balsam, and Vanilla. A warm, nutty, and soft perfume perfect for autumn and winter.",
        top_notes_en: "Pink Pepper, Clove Buds, Orange Blossom",
        middle_notes_en: "Chestnut, Guaiac Wood, Juniper",
        base_notes_en: "Vanilla, Peru Balsam, Cashmeran"
    },
    {
        id: 82,
        description_en: "A walk on the Atlantic Ocean beach. A salty, slightly rugged scent of sand, wind, and a stormy sea. Perfect for nature lovers and those who miss the freedom of the open sea.",
        top_notes_en: "Marine Notes, Sea Salt, Ozone",
        middle_notes_en: "Sand, Wind",
        base_notes_en: "Ambergris, Driftwood"
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
        console.log('Batch 3 updated successfully!');
    } finally {
        client.release();
        await pool.end();
    }
}

performUpdate().catch(err => console.error(err));
