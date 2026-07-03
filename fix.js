const pool = require('./app/lib/db');
async function fix() {
  await pool.query('UPDATE users SET address = $1, phone = $2 WHERE email = $3', [
    JSON.stringify({city: 'אכסאל', street: 'לעדן', houseNumber: '5', apartment: '0'}), 
    '0526881303', 
    '5555hade@gmail.com'
  ]);
  console.log('Done');
  process.exit(0);
}
fix();
