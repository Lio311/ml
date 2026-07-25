import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });
import { GET } from './app/api/cron/monthly-recommendation/route.js';

async function main() {
  // Mock request
  const req = {
    headers: new Map([
      ['authorization', `Bearer ${process.env.CRON_SECRET}`]
    ])
  };
  
  // Actually we need `req.headers.get` to be available.
  const reqWithGet = {
    headers: {
      get: (key) => req.headers.get(key)
    }
  };

  // Wait, let's override the `Date` so `day === 10` is true if today is not the 10th.
  // Today is 13th! So day === 13 right now.
  const OriginalDate = Date;
  global.Date = class extends OriginalDate {
    constructor(...args) {
      if (args.length === 0) {
        // Mock current date as July 10, 2026, 15:00 UTC
        super('2026-07-10T15:00:00Z');
      } else {
        super(...args);
      }
    }
    static now() {
      return new OriginalDate('2026-07-10T15:00:00Z').getTime();
    }
  };

  try {
    const response = await GET(reqWithGet);
    console.log('Status:', response.status);
    console.log('Body:', await response.json?.() || response);
  } catch (err) {
    console.error('Error executing GET:', err);
  } finally {
    process.exit(0);
  }
}

main();
