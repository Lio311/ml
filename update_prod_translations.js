const { Client } = require('pg'); 
require('dotenv').config({path: '.env.local'}); 
const client = new Client({ connectionString: process.env.DATABASE_URL }); 

const prodTranslations = [
  {
    name: 'Boadicea the Victorious Blue Sapphire Supercharged',
    description_en: 'A declaration of wealth in a bottle. This is a perfume designed to show presence. A powerful combination of rose, leather, and oud that stays on the body forever and fills every room. Suitable for those who want to be the center of attention and are not afraid of a dominant scent.'
  },
  {
    name: 'Frederic Malle Acne Studios',
    description_en: 'When the world of minimalist fashion meets haute perfumery. This perfume is like wearing a brand-new, white button-down shirt from a luxury brand, or a cool silk scarf. It is extremely clean and modern thanks to the aldehydes, with the softness of an incredibly luxurious fabric softener and delicate fruitiness. A neoclassical creation that radiates style, cleanliness, and distant luxury.'
  },
  {
    name: 'Mayhap Amant Numérique',
    description_en: 'The virtual lover. A perfume that plays on the border between the human and the artificial. A clean, polished scent, almost too perfect, conveying futurism and sophisticated minimalism.'
  },
  {
    name: 'Farmacia SS. Annunziata Sparkling Notturno',
    description_en: 'The magic of the night. A perfume with a scent of nocturnal flowers and powder, conveying a soft mystery and the elegance of an evening in Europe.'
  }
];

async function update() {
  await client.connect();
  for (const t of prodTranslations) {
    console.log(`Updating product ${t.name}...`);
    await client.query(
      `UPDATE products 
       SET description_en = $1 
       WHERE name = $2`,
      [t.description_en, t.name]
    );
  }
  console.log('Product update complete!');
  process.exit(0);
}

update().catch(err => {
  console.error(err);
  process.exit(1);
});
