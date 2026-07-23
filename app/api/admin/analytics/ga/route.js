import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GA_PROPERTY_ID) {
      return NextResponse.json({ error: 'Missing Analytics Configuration in Environment' }, { status: 400 });
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
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    const analyticsDataClient = google.analyticsdata({
      version: 'v1beta',
      auth: auth,
    });

    const propertyId = process.env.GA_PROPERTY_ID;

    // Run multiple reports in parallel
    const [dailyReport, sourceReport, pageReport] = await Promise.all([
      // 1. Daily Traffic
      analyticsDataClient.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
        },
      }),
      // 2. Traffic Sources
      analyticsDataClient.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'sessionSource' }],
          metrics: [{ name: 'activeUsers' }],
          limit: 100
        },
      }),
      // 3. Top Pages
      analyticsDataClient.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }],
          limit: 15
        },
      })
    ]);

    return NextResponse.json({ 
      daily: dailyReport.data || {},
      sources: sourceReport.data || {},
      pages: pageReport.data || {}
    });
  } catch (error) {
    console.error('GA Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
