const { getProducts } = require('./app/catalog/dbQueries.js');
async function run() {
  const { products } = await getProducts('fugazzi', null, null, null, null, 'random', 1, {});
  console.log("Fugazzi result:", products.map(p => p.name));
  process.exit(0);
}
run();
