const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

const BRANDS_DATA = {
    'Kilian': {
        title_en: 'Kilian Paris: The Art of Olfactory Storytelling',
        description_en: 'Founded by Kilian Hennessy, heir to the historic cognac dynasty, Kilian Paris combines the family brand’s deep French heritage with a contemporary sense of luxury. Kilian’s fragrances are like classic cognac: complex, deep, and maturing with grace. The brand is known for its sophisticated storytelling, where each perfume is a scene, a memory, or an emotion. With eco-luxury at its core, Kilian emphasizes refillability and high-end craftsmanship. From the seductive "Good Girl Gone Bad" to the cognac-inspired "Angels\' Share," Kilian remains a symbol of Parisian elegance and nocturnal mystery.',
        highlights_en: 'Fragrances as art, cognac-inspired bottle designs, and a focus on eco-conscious luxury craftsmanship.',
        perfumer_en: 'Kilian Hennessy (Creative Director)'
    },
    'Xerjoff': {
        title_en: 'Xerjoff: Where Nature and Luxury Converge',
        description_en: 'Representing the peak of Italian artistic perfumery, Xerjoff is a multisensory experience that begins with the scent and ends with the bottle - often a work of art made of crystal or rare stones. Founded by Sergio Momo, the brand focuses on the highest quality raw materials processed with advanced distillation techniques. Xerjoff perfumes are bold, long-lasting, and unapologetically luxurious. Whether it’s the citrusy freshness of the Casamorati collection or the deep, animalic oud of the Oud Stars line, Xerjoff defines modern Mediterranean elegance.',
        highlights_en: 'Exceptional raw material quality, artisanal bottle designs, and unparalleled long-lasting scent profiles.',
        perfumer_en: 'Sergio Momo (Founder & Designer)'
    },
    'Creed': {
        title_en: 'The House of Creed: A Legacy of Royal Fragrance',
        description_en: 'Since 1760, the House of Creed has been creating artisanal perfumes for the world’s elite. Known for its "Millésime" standards - where ingredients are hand-picked and processed using ancient techniques - Creed maintains a distinct, natural, and timeless character. From the legendary "Aventus" to "Silver Mountain Water," Creed scents evoke power, history, and sophistication. It remains one of the few houses that still uses traditional infusion methods to capture the true essence of its botanical components.',
        highlights_en: 'Hand-crafted infusion methods, royal heritage, and iconic status among fragrance collectors.',
        perfumer_en: 'Erwin Creed (7th Generation Perfumer)'
    },
    'Amouage': {
        title_en: 'Amouage: The Gift of Kings',
        description_en: 'Born in the Sultanate of Oman, Amouage is an international luxury fragrance house renowned for its innovative and long-lasting scents that bridge Eastern tradition with Western technical brilliance. Using rare and precious ingredients like Omani Silver Frankincense, Rock Rose, and Ambergris, Amouage creates "the gift of kings." Each perfume is a symphony of complexity, balancing exotic spices with delicate florals, representing the ultimate expression of hospitality and royalty.',
        highlights_en: 'Rare Middle Eastern ingredients, extraordinary longevity, and a bridge between Eastern and Western cultures.',
        perfumer_en: 'Renaud Salmon (Creative Director)'
    },
    'Maison Francis Kurkdjian': {
        title_en: 'Maison Francis Kurkdjian: The Fragrance Wardrobe',
        description_en: 'Francis Kurkdjian, one of the most celebrated master perfumers of our time, co-founded his house with the idea of a "fragrance wardrobe" - a scent for every mood and every occasion. The house is defined by artistic precision, purity of ingredients, and a certain French "art de vivre." Best known for the global phenomenon "Baccarat Rouge 540," the brand balances minimalism with high-impact olfactory signatures, creating fragrances that are both modern and classic.',
        highlights_en: 'Masterful blending precision, iconic olfactory signatures, and a versatile approach to luxury perfumery.',
        perfumer_en: 'Francis Kurkdjian (Master Perfumer)'
    },
    'Initio Parfums Privés': {
        title_en: 'Initio: The Science of Scent and Seduction',
        description_en: 'Initio Parfums Privés returns to the origin of perfume, when scent was used for prayer, healing, and seduction. The brand focuses on "functional fragments" - molecules that trigger emotional and physiological responses. By combining high-science chemistry with the power of nature, Initio creates fragrances that are magnetic, powerful, and deeply carnal. It is a brand for those who see perfume not just as a scent, but as a silent language of attraction.',
        highlights_en: 'Focus on pheromone-like molecules, addictive scent profiles, and the emotional power of fragrance.',
        perfumer_en: 'Alexandra Carlin & others'
    }
};

async function translateTopBrands() {
    for (const [name, trans] of Object.entries(BRANDS_DATA)) {
        console.log(`Updating brand: ${name}`);
        const res = await pool.query(`
            UPDATE brands 
            SET title_en = $1, description_en = $2, highlights_en = $3, perfumer_en = $4
            WHERE name ILIKE $5
        `, [trans.title_en, trans.description_en, trans.highlights_en, trans.perfumer_en, `%${name}%`]);
        console.log(`Rows affected for ${name}: ${res.rowCount}`);
    }
    await pool.end();
}

translateTopBrands().catch(err => console.error(err));
