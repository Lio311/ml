const { Client } = require('pg'); 
require('dotenv').config({path: '.env.local'}); 
const client = new Client({ connectionString: process.env.DATABASE_URL }); 

const translations = [
  {
    name: 'Clive Christian',
    title_en: 'The British Crown and the World\'s Most Expensive Perfumery: Clive Christian',
    description_en: 'Clive Christian represents the pinnacle of traditional British luxury. The brand acquired the historic Crown Perfumery, the only house granted permission by Queen Victoria to use her crown on perfume bottles as a seal of supreme quality. Clive Christian perfumes are produced in exceptionally high oil concentrations (up to 25%-50%), ensuring extraordinary longevity that can last for days. The brand spares no expense on ingredients, using only the most concentrated and pure extracts of flowers, woods, and spices. The brand\'s No. 1 was crowned the most expensive perfume in the world at the time of its launch. At ml_tlv, we believe every perfume lover must experience the royal, rich, and sophisticated character of Clive Christian at least once through our luxury samples.',
    highlights_en: 'Exceptionally high oil concentrations for maximum longevity, British royal heritage, and use of only pure ingredients.',
    perfumer_en: 'Geza Schoen, Christian Provenzano, Kamila Lelakova'
  },
  {
    name: 'Frederic Malle',
    title_en: 'The Freedom to Create Masterpieces: Editions de Parfums Frederic Malle',
    description_en: 'Frederic Malle revolutionized the world of perfumery when he decided to act as a "perfume editor." He invites the world\'s leading perfumers to create the fragrance they have always dreamed of, without any brand, marketing, or budget constraints. For the first time, the names of the perfumers appear on the bottles as creators, emphasizing the artistic status of the scent. Malle\'s collection is a gallery of unique masterpieces, ranging from the dramatic Portrait of a Lady to the sophisticated French Lover. Every perfume is a world of high-quality ingredients and perfect technique. At ml_tlv, we select the most interesting fragrances from the collection to give you an intellectual and aesthetic experience of haute perfumery at its best.',
    highlights_en: 'Granting absolute artistic freedom to perfumers, emphasis on the perfumer as the creator, and uncompromising quality of raw materials.',
    perfumer_en: 'Dominique Ropion, Jean-Claude Ellena, Maurice Roucel and more'
  },
  {
    name: 'Maison Francis Kurkdjian',
    title_en: 'French Genius: Maison Francis Kurkdjian (MFK)',
    description_en: 'Francis Kurkdjian is one of the youngest and most influential perfumers in history, with major successes at leading fashion houses before founding his own niche brand. MFK offers a modern approach to classic French perfumery under the concept of a "Fragrance Wardrobe" – different scents suited for different situations in life. His most famous creation, Baccarat Rouge 540, changed the face of the industry and became a global phenomenon thanks to its mesmerizing and innovative blend of jasmine, saffron, amber, and cedarwood. Kurkdjian\'s perfumes are characterized by cleanliness, precision, and an airy elegance that is hard to find elsewhere. ml_tlv invites you to discover the artistic precision and French sophistication of MFK through our selection of samples.',
    highlights_en: 'Artistic precision and fragrant cleanliness, the iconic Baccarat Rouge 540, and a versatile "Fragrance Wardrobe" approach.',
    perfumer_en: 'Francis Kurkdjian (The Master)'
  },
  {
    name: 'Parfums de Marly',
    title_en: '18th Century Splendor in the Modern Era: Parfums de Marly',
    description_en: 'Parfums de Marly is a magnificent homage to France\'s golden age under the reign of King Louis XV, "the perfumed king." The brand draws inspiration from "Château de Marly," the royal summer residence where horse races and perfumed balls were prevalent. Each fragrance by the brand is named after a noble horse breed and conveys power, bravery, and elegance. Parfums de Marly fragrances combine the freshness of nature with the depth of oriental and gourmand notes. Layton, Delina, and Percival have become market leaders thanks to their ability to be simultaneously luxurious and accessible with impressive performance. At ml_tlv, you can find samples of the brand that will allow you to feel the royal splendor and French power in every social encounter.',
    highlights_en: 'Inspiration from royal French history, high-quality heavy bottles, and fragrances with a dominant presence.',
    perfumer_en: 'Quentin Bisch, Hamid Merati-Kashani, Julien Sprecher (Founder)'
  },
  {
    name: 'Elixir Privé',
    title_en: 'Private Perfumery Secrets: Elixir Privé and Uncompromising Quality',
    description_en: 'Elixir Privé is a perfume house dedicated to creating fragrant "elixirs" – concentrated and deep extracts produced in small, exclusive batches. The brand focuses on the maximum extraction of each component, using advanced distillation technologies that preserve the most natural and accurate scent of flowers, resins, and woods. The brand\'s philosophy is based on the belief that a perfume should be a personal and intimate signature, one that remains close to the skin yet radiates understated luxury. Elixir Privé fragrances are characterized by perfect balance and longevity that lasts for many hours, making them an ideal choice for those seeking something different and unique. ml_tlv brings you the leading fragrances of the house, allowing you to enter a world of private and exclusive perfumery not found everywhere.',
    highlights_en: 'Small-batch production, high essence concentrations, and industry-leading oil quality.',
    perfumer_en: 'International perfume experts under artistic direction'
  }
];

async function update() {
  await client.connect();
  for (const t of translations) {
    console.log(`Updating ${t.name}...`);
    await client.query(
      `UPDATE brands 
       SET title_en = $1, description_en = $2, highlights_en = $3, perfumer_en = $4 
       WHERE name = $5`,
      [t.title_en, t.description_en, t.highlights_en, t.perfumer_en, t.name]
    );
  }
  console.log('Update complete!');
  process.exit(0);
}

update().catch(err => {
  console.error(err);
  process.exit(1);
});
