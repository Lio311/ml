import { getProducts } from './app/catalog/dbQueries.js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

async function run() {
  const result = await getProducts('FUGAZZI', null, null, null, null, 'random', 1, {});
  console.log('Results:', result.products.length);
  result.products.forEach(p => console.log(p.name, p.brand, p.is_discovery_set));
}

run().catch(console.error);
