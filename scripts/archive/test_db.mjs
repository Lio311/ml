import { getProducts } from './app/catalog/dbQueries.js';
async function run() {
  const { products } = await getProducts('fugazzi', null, null, null, null, 'random', 1, {});
  console.log("Fugazzi result mappedSearch ('fugazzi'):", products.map(p => p.name));
  
  const { products: p2 } = await getProducts('FUGAZZI', null, null, null, null, 'random', 1, {});
  console.log("Fugazzi result original search ('FUGAZZI'):", p2.map(p => p.name));
  process.exit(0);
}
run();
