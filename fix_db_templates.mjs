import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });
import pg from 'pg';
const { Pool } = pg;

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  try {
    const defaultBatchTemplate = `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h1 style="margin: 0 0 10px; font-size: 24px; font-weight: 900; color: #000; text-align: center;">הגיעו חדשים! ✨</h1>
                <p style="margin: 0 0 25px; color: #666; text-align: center;">אנחנו מתרגשים להציג את התוספות החדשות לקולקציה שלנו:</p>
                <div style="text-align: center; margin-bottom: 25px;">
                    {{itemsHtml}}
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://www.ml-tlv.com/catalog" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 36px; text-decoration: none; border-radius: 18px; font-weight: 900; font-size: 14px; box-shadow: 0 10px 20px rgba(0,0,0,0.15);">
                        לצפייה בכל החדשים
                    </a>
                </div>
            </div>
            <div style="text-align: center; padding-top: 15px; padding-bottom: 0; color: #ccc; font-size: 11px;">
                ml - יוקרה בחתיכות קטנות
            </div>
        </div>
    `;

    const defaultDiscoveryTemplate = `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
                <h1 style="margin: 0 0 10px; font-size: 24px; font-weight: 900; color: #000; text-align: center;">מארזי דיסקברי חדשים! ✨</h1>
                <p style="margin: 0 0 25px; color: #666; text-align: center;">הדרך המושלמת לנסות ניחוחות חדשים לפני שמתחייבים:</p>
                <div style="text-align: center; margin-bottom: 25px;">
                    {{itemsHtml}}
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://www.ml-tlv.com/discovery-sets" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 36px; text-decoration: none; border-radius: 18px; font-weight: 900; font-size: 14px; box-shadow: 0 10px 20px rgba(0,0,0,0.15);">
                        לכל מארזי ההתנסות
                    </a>
                </div>
            </div>
            <div style="text-align: center; padding-top: 15px; padding-bottom: 0; color: #ccc; font-size: 11px;">
                ml - יוקרה בחתיכות קטנות
            </div>
        </div>
    `;

    await client.query("UPDATE email_templates SET content_html = $1 WHERE slug = 'new_perfumes_batch'", [defaultBatchTemplate]);
    await client.query("UPDATE email_templates SET content_html = $1 WHERE slug = 'new_discovery_sets'", [defaultDiscoveryTemplate]);
    console.log('Successfully updated templates in the DB!');
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    process.exit(0);
  }
}

main();
