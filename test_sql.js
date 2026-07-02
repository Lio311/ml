const https = require('https');

https.get('https://data.gov.il/api/3/action/datastore_search_sql?sql=SELECT%20%22%D7%A9%D7%9D_%D7%99%D7%A9%D7%95%D7%91%22%20from%20%225c78e9fa-c2e2-4771-93ff-7f400a12f7ba%22%20WHERE%20%22%D7%A9%D7%9D_%D7%99%D7%A9%D7%95%D7%91%22%20LIKE%20%27%D7%A0%D7%AA%25%27%20LIMIT%205', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
