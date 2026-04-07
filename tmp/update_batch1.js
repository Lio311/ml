const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

const translations = [
    {
        id: 111,
        description_en: "A masterpiece of Arabian luxury. Amber Aoud combines the rarest Agarwood (Oud) with a sweet richness of Fig, Rose, and Cinnamon. It's a deep, warm, and regal fragrance that feels like liquid gold on the skin. Perfect for those who want to project undeniable sophistication and power.",
        top_notes_en: "Bergamot, Lemon, Lime",
        middle_notes_en: "Fig, Jasmine, Rose, Ylang Ylang",
        base_notes_en: "Oud, Ambergris, Benzoin, Birch, Cinnamon, Civet, Musk, Patchouli, Oakmoss, Sandalwood, Saffron"
    },
    {
        id: 200,
        description_en: "A tropical vacation that starts with a bite of juicy fruit and ends with a comforting dessert. This perfume takes Mango—a fruit often difficult to master in perfumery—and turns it into a sophisticated tropical masterpiece. It opens with a sweet and joyful burst of Mango and Citrus, but its secret lies in the heart: a unique combination of Rice and Coconut that creates a milky, soft, and comforting sensation (reminiscent of the Asian dessert 'Mango Sticky Rice'). It radiates sunshine, exoticism, and 5-star resort luxury, leaving a creamy and addictive trail on the skin.",
        top_notes_en: "Mango, Orange, Blood Orange, Pineapple",
        middle_notes_en: "Orange Blossom, Jasmine, Rice",
        base_notes_en: "Coconut, Musk, Atlas Cedar, Patchouli, Vanilla"
    },
    {
        id: 178,
        description_en: "A dive into the turquoise sea. A marine-ozonic (clean air) fragrance combined with green notes. It is clear, transparent, and refreshing like cold water on a hot day, radiating absolute freedom.",
        top_notes_en: "Marine Notes, Ozone, Black Pepper, Saffron",
        middle_notes_en: "Seaweed, Bay Leaf, Eucalyptus",
        base_notes_en: "Ambergris, Oakmoss, Sandalwood"
    },
    {
        id: 179,
        description_en: "The dance of the flames. This perfume isn't just 'warm', it's burning. An intense combination of spicy spices (Pepper, Cinnamon, Ginger), thick smoke, and resins that melt in the heat. It simulates the scent of whispering coals and a wild bonfire, with a sharp sting that feels like sparks flying in the air. Suitable for: People with a strong and dramatic presence who want to leave a trail of heat, passion, and mystery (perfect for winter).",
        top_notes_en: "Smoke, Resin",
        middle_notes_en: "Spicy Spices, Pepper",
        base_notes_en: "Warm Resins, Burnt Wood"
    },
    {
        id: 53,
        description_en: "Golden serenity. Vanilla, Toffee, Honey, and Cinnamon. A buttery, rich, and very comforting gourmand fragrance. The scent of a high-quality sweet pastry that is simply a joy to smell.",
        top_notes_en: "Honey, Toffee",
        middle_notes_en: "Cinnamon, Vanilla",
        base_notes_en: "Benzoin, Tonka Bean, Tobacco"
    },
    {
        id: 72,
        description_en: "The connection to the earth. Standing in an orange grove after the rain, as the scent of wet earth and minerals rises into the air. A masculine, dry, mature, and stable perfume. A professional's classic.",
        top_notes_en: "Orange, Grapefruit",
        middle_notes_en: "Pepper, Geranium",
        base_notes_en: "Vetiver, Cedar, Patchouli, Benzoin"
    },
    {
        id: 137,
        description_en: "A decade celebration. Berries, Almonds, Leather, and Tobacco. A rich, sweet, complex, and very luxurious perfume that leaves a massive trail.",
        top_notes_en: "Red Berries, Tobacco, Almonds",
        middle_notes_en: "Jasmine, Coconut, Iris",
        base_notes_en: "Musk, Vetiver, Sandalwood"
    },
    {
        id: 134,
        description_en: "Peach in the sun. Peach, Currants, and Lemon. A happy, yellow, and optimistic perfume that feels like a warm ray of sunshine caressing the skin.",
        top_notes_en: "Peach, Black Currant, Lemon",
        middle_notes_en: "Jasmine",
        base_notes_en: "Dreamwood"
    },
    {
        id: 45,
        description_en: "A perfume that enters the room before you. Imagine a woman in a magnificent evening dress holding a glass of aged apple brandy (Calvados). The scent is intoxicating, alcoholic, with a depth of leather and resins. It's a theatrical creation for gala events, projecting feminine power, self-confidence, and uncompromising wealth. For the brave—also suitable for self-confident men.",
        top_notes_en: "Bergamot, Saffron, Apple Brandy",
        middle_notes_en: "Rose, Geranium, Myrrh, Cinnamon",
        base_notes_en: "Frankincense, Leather, Labdanum"
    },
    {
        id: 176,
        description_en: "The perfect contrast between ice and fire. The perfume opens with a cold blast of Mint and Pepper, then dives into a dark depth of Licorice, Patchouli, and Vanilla. It feels like sipping a luxurious herbal liqueur in a dark, underground bar. A gothic, sharp, and addictive scent. Suitable for: Individuals who are not afraid of 'weird' scents. A must for licorice and anise lovers.",
        top_notes_en: "Mint, Pepper",
        middle_notes_en: "Licorice, Anise",
        base_notes_en: "Patchouli, Vanilla"
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
        console.log('Batch 1 updated successfully!');
    } finally {
        client.release();
        await pool.end();
    }
}

performUpdate().catch(err => console.error(err));
