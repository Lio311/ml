const pool = require('./app/lib/db.js');
pool.query("UPDATE email_campaigns SET status='sent', sent_at=NOW() WHERE status='sending'")
  .then(() => {
    console.log("Updated");
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
