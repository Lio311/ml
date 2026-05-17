import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import pool from "@/app/lib/db";

export const dynamic = 'force-dynamic';

// Cron configuration — single source of truth
const CRON_CONFIG = [
    { name: 'recovery', path: '/api/cron/recovery', schedule: '0 10 * * *', label: 'שחזור עגלות', description: 'שולח אימייל ללקוחות שנטשו עגלה (רק אם יש עגלות נטושות)' },
    { name: 'educational-email', path: '/api/cron/educational-email', schedule: '0 11 * * *', label: 'אימייל חינוכי', description: 'שולח תוכן חינוכי על בשמים ללקוחות שביצעו הזמנה' },
    { name: 'review-request', path: '/api/cron/review-request', schedule: '0 12 * * *', label: 'בקשת ביקורת', description: 'מבקש ביקורות מלקוחות שקיבלו הזמנה (מותנה בהזמנה שהושלמה)' },
    { name: 'recommendations', path: '/api/cron/recommendations', schedule: '0 13 * * *', label: 'המלצות', description: 'שולח המלצות מותאמות אישית (מותנה בהיסטוריית רכישות)' },
    { name: 'nurture-emails', path: '/api/cron/nurture-emails', schedule: '0 14 * * *', label: 'אימיילי נרטור', description: 'סדרת ליווי ללקוח חדש אחרי הרשמה (מותנה ברישום חדש)' },
    { name: 'seo-bot', path: '/api/cron/seo-bot', schedule: '0 8 * * *', label: 'בוט SEO', description: 'מייצר תוכן SEO למוצרים שחסר להם (מותנה במוצרים חדשים)' },
    { name: 'desc-review', path: '/api/cron/desc-review', schedule: '0 19 * * *', label: 'סקירת תיאורים', description: 'סוקר ומדרג תיאורי מוצרים עם AI (מותנה בתיאורים שטרם נסקרו)' },
];

function scheduleToHebrew(schedule) {
    const parts = schedule.split(' ');
    const hour = parseInt(parts[1]);
    // Convert UTC to Israel time (UTC+3)
    const israelHour = (hour + 3) % 24;
    return `מתוזמן ${String(israelHour).padStart(2, '0')}:00`;
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
        let workflowLogs = [];
        let emailLogs = [];
        let tablesExist = true;
        
        const client = await pool.connect();
        try {
            // Try to get logs from cron_logs table
            try {
                const result = await client.query(`
                    SELECT DISTINCT ON (cron_name) 
                        cron_name, status, message, duration_ms, started_at, finished_at
                    FROM cron_logs 
                    ORDER BY cron_name, started_at DESC
                `);
                cronLogs = result.rows;
            } catch (e) {
                if (e?.code === '42P01') {
                    // cron_logs table doesn't exist, that's ok
                }
            }

            // Also read from workflows table (where crons actually log their runs)
            try {
                const wfResult = await client.query(`
                    SELECT name, last_run, total_runs 
                    FROM workflows 
                    WHERE last_run IS NOT NULL
                `);
                workflowLogs = wfResult.rows;
            } catch (e) {
                // workflows table might not exist
            }

            // Also read from email_logs to track actual mail actions
            try {
                const emailLogsRes = await client.query(`
                    SELECT type, MAX(sent_at) as last_sent, COUNT(*) as total_sent 
                    FROM email_logs 
                    GROUP BY type
                `);
                emailLogs = emailLogsRes.rows;
            } catch (e) {
                // email_logs table might not exist
            }
        } finally {
            client.release();
        }

        // Merge config with latest logs
        const cronLogMap = {};
        cronLogs.forEach(log => { cronLogMap[log.cron_name] = log; });

        // Map workflow names (Hebrew) to cron config names
        const workflowNameMap = {
            'שחזור עגלה נטושה (+5% הנחה)': 'recovery',
            'מייל חינוכי (טיפים לשימוש בבושם)': 'educational-email',
            'בקשת כתיבת חוות דעת מלקוח': 'review-request',
            'המלצות בשמים מותאמות אישית': 'recommendations',
            'טיפוח לקוחות: 10 ימים (בקשת בושם)': 'nurture-emails',
            'טיפוח לקוחות: 25 ימים (התאמה אישית)': 'nurture-emails',
        };

        // Build workflow fallback map
        const workflowMap = {};
        workflowLogs.forEach(wf => {
            const cronName = workflowNameMap[wf.name];
            if (cronName && wf.last_run) {
                workflowMap[cronName] = {
                    status: 'success',
                    started_at: wf.last_run,
                    message: `${wf.total_runs || 0} הרצות סה"כ`,
                };
            }
        });

        // Build email logs fallback map
        const emailLogsMap = {};
        emailLogs.forEach(log => {
            let cronName = null;
            if (log.type === 'cart_recovery') cronName = 'recovery';
            else if (log.type === 'educational') cronName = 'educational-email';
            else if (log.type === 'review_request' || log.type === 'manual_review_request') cronName = 'review-request';
            else if (log.type === 'recommendations') cronName = 'recommendations';
            else if (log.type === 'nurture_10_days' || log.type === 'nurture_25_days') cronName = 'nurture-emails';
            
            if (cronName) {
                const existing = emailLogsMap[cronName];
                const lastSentDate = new Date(log.last_sent);
                if (!existing || lastSentDate > new Date(existing.started_at)) {
                    emailLogsMap[cronName] = {
                        status: 'success',
                        started_at: log.last_sent,
                        message: `נשלחו ${log.total_sent} מיילים`,
                    };
                } else if (existing) {
                    const currentSentCount = parseInt(existing.message.match(/\d+/)?.[0] || 0);
                    existing.message = `נשלחו ${currentSentCount + parseInt(log.total_sent)} מיילים`;
                }
            }
        });

        const crons = CRON_CONFIG.map(cron => ({
            ...cron,
            scheduleLabel: scheduleToHebrew(cron.schedule),
            lastRun: cronLogMap[cron.name] || workflowMap[cron.name] || emailLogsMap[cron.name] || null
        }));

        return NextResponse.json({ crons, tablesExist });
    } catch (error) {
        console.error("System status error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
