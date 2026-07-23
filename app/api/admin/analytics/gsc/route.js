import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { subDays, format } from 'date-fns';

export async function GET() {
  try {
    if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GSC_SITE_URL) {
      return NextResponse.json({ error: 'Missing Search Console Configuration in Environment' }, { status: 400 });
    }

    let privateKeyEnv = process.env.GOOGLE_PRIVATE_KEY || '';
    let clientEmail = process.env.GOOGLE_CLIENT_EMAIL || '';
    let privateKey = privateKeyEnv;

    try {
      // In case the user pasted the entire JSON file into the environment variable
      const parsed = JSON.parse(privateKeyEnv);
      if (parsed && parsed.private_key) {
        privateKey = parsed.private_key;
      }
      if (parsed && parsed.client_email && !clientEmail) {
        clientEmail = parsed.client_email;
      }
    } catch (e) {}

    privateKey = privateKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const searchconsole = google.searchconsole({
      version: 'v1',
      auth: auth,
    });

    const siteUrl = process.env.GSC_SITE_URL;
    
    const today = new Date();
    const endDate = format(today, 'yyyy-MM-dd');
    const startDate = format(subDays(today, 30), 'yyyy-MM-dd');

    // Run multiple queries in parallel for Daily, Queries, and Pages
    const [dailyRes, queryRes, pageRes] = await Promise.all([
      // 1. Daily Stats
      searchconsole.searchanalytics.query({
        siteUrl: siteUrl,
        requestBody: {
          startDate, endDate,
          dimensions: ['date'],
          rowLimit: 1000,
        },
      }),
      // 2. Top Queries
      searchconsole.searchanalytics.query({
        siteUrl: siteUrl,
        requestBody: {
          startDate, endDate,
          dimensions: ['query'],
          rowLimit: 100,
        },
      }),
       // 3. Top Pages
       searchconsole.searchanalytics.query({
        siteUrl: siteUrl,
        requestBody: {
          startDate, endDate,
          dimensions: ['page'],
          rowLimit: 15,
        },
      })
    ]);

    return NextResponse.json({ 
      daily: dailyRes.data.rows || [],
      queries: queryRes.data.rows || [],
      pages: pageRes.data.rows || []
    });
  } catch (error) {
    console.error('GSC Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
