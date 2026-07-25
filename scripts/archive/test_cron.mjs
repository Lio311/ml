import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });
import { GET } from './app/api/cron/new-perfumes/route.js';

// Mock NextResponse for local testing without Next.js
global.NextResponse = {
  json: (data, init) => {
    return {
      status: init?.status || 200,
      json: async () => data
    };
  }
};

async function main() {
  const req = {
    headers: {
      get: (name) => name === 'authorization' ? `Bearer ${process.env.CRON_SECRET}` : null
    }
  };

  try {
    const response = await GET(req);
    console.log('Status:', response.status);
    const body = await response.json();
    console.log('Body:', body);
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
