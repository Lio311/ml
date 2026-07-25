const pool = require('./app/lib/db');
pool.query("UPDATE orders SET delivery_method = 'mail' WHERE delivery_method IN ('shipping', 'delivery')").then(r => console.log('Updated ' + r.rowCount)).catch(console.error).finally(() => process.exit(0));
