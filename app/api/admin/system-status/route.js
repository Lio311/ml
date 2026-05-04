import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import pool from "@/app/lib/db";

export const dynamic = 'force-dynamic';

// Cron configuration — single source of truth
const CRON_CONFIG = [
    { name: 'recovery', path: '/api/cron/recovery', schedule: '0 10 * * *', label: 'שחזור עגלות', description: 'שולח אימיילים ללקוחות שנטשו עגלה' },
    { name: 'educational-email', path: '/api/cron/educational-email', schedule: '0 11 * * *', label: 'אימייל חינוכי', description: 'שולח תוכן חינוכי על בשמים' },
    { name: 'review-request', path: '/api/cron/review-request', schedule: '0 12 * * *', label: 'בקשת ביקורת', description: 'מבקש ביקורות מלקוחות אחרי רכישה' },
    { name: 'recommendations', path: '/api/cron/recommendations', schedule: '0 13 * * *', label: 'המלצות', description: 'שולח המלצות מותאמות אישית' },
    { name: 'nurture-emails', path: '/api/cron/nurture-emails', schedule: '0 14 * * *', label: 'אימיילי נרטור', description: 'סדרת אימיילים לליווי לקוח חדש' },
    { name: 'seo-bot', path: '/api/cron/seo-bot', schedule: '0 8 * * *', label: 'בוט SEO', description: 'מייצר תוכן SEO למוצרים' },
    { name: 'desc-review', path: '/api/cron/desc-review', schedule: '0 19 * * *', label: 'סקירת תיאורים', description: 'סוקר ומדרג תיאורי מוצרים עם AI' },
];

function scheduleToHebrew(schedule) {
    const parts = schedule.split(' ');
    const hour = parseInt(parts[1]);
    // Convert UTC to Israel time (UTC+3)
    const israelHour = (hour + 3) % 24;
    return `כל יום ב-${String(israelHour).padStart(2, '0')}:00`;
}

export async function GET() {
    try {
        const user = await currentUser();
        const role = user?.publicMetadata?.role;
        const email = user?.emailAddresses?.[0]?.emailAddress;
        const isSuperAdmin = email === process.env.ADMIN_EMAIL;

        if (!isSuperAdmin && role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let cronLogs = [];
        let tablesExist = true;
        
        const client = await pool.connect();
        try {
            // Get the latest log for each cron
            const result = await client.query(`
                SELECT DISTINCT ON (cron_name) 
                    cron_name, status, message, duration_ms, started_at, finished_at
                FROM cron_logs 
                ORDER BY cron_name, started_at DESC
            `);
            cronLogs = result.rows;
        } catch (e) {
            if (e?.code === '42P01') {
                tablesExist = false;
            }
        } finally {
            client.release();
        }

        // Merge config with latest logs
        const cronLogMap = {};
        cronLogs.forEach(log => { cronLogMap[log.cron_name] = log; });

        const crons = CRON_CONFIG.map(cron => ({
            ...cron,
            scheduleLabel: scheduleToHebrew(cron.schedule),
            lastRun: cronLogMap[cron.name] || null
        }));

        return NextResponse.json({ crons, tablesExist });
    } catch (error) {
        console.error("System status error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
