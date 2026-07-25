fetch(`https://data.gov.il/api/3/action/datastore_search?resource_id=5c78e9fa-c2e2-4771-93ff-7f400a12f7ba&limit=3000`)
    .then(res => res.json())
    .then(data => console.log('Total cities:', data.result.records.length, 'Size in KB:', JSON.stringify(data.result.records.map(r => r['שם_ישוב'].trim())).length / 1024));
