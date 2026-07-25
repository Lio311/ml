import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { sendEmail, getTemplate } from '@/app/lib/email';
import { getAutomationConfig, isAutomationActive } from '@/app/lib/automationConfig';

import { checkCronOrAdmin } from "@/app/lib/admin";

export async function GET(req) {
    const isAuthorized = await checkCronOrAdmin(req);
    if (!isAuthorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const client = await pool.connect();
        try {
            // Because adding tracking columns to users table is complex, we use email_logs 
            // to check if a nurture email was already sent to avoid resending.
            // In Postgres we can check NOT EXISTS

            const config3 = await getAutomationConfig('nurture_3_days');
            const delay3 = config3.delay_days || 3;
            const active3 = await isAutomationActive('טיפוח לקוחות: 3 ימים (ללא הזמנה)');

            let users3 = [];
            if (active3) {
                const res3Days = await client.query(`
                    SELECT id, first_name, email, created_at 
                    FROM users u
                    WHERE created_at >= NOW() - INTERVAL '${delay3 + 1} days'
                    AND created_at < NOW() - INTERVAL '${delay3} days'
                    AND NOT EXISTS (
                        SELECT 1 FROM email_logs 
                        WHERE recipient = u.email 
                        AND type = 'nurture_3_days'
                    )
                    AND NOT EXISTS (
                        SELECT 1 FROM orders o
                        WHERE o.customer_details->>'email' = u.email
                    )
                `);
                users3 = res3Days.rows;
            }

            const config10 = await getAutomationConfig('nurture_10_days');
            const delay10 = config10.delay_days || 10;
            const active10 = await isAutomationActive('טיפוח לקוחות: 10 ימים (בקשת בושם)');

            let users10 = [];
            if (active10) {
                const res10Days = await client.query(`
                    SELECT id, first_name, email, created_at 
                    FROM users 
                    WHERE created_at >= NOW() - INTERVAL '${delay10 + 1} days'
                    AND created_at < NOW() - INTERVAL '${delay10} days'
                    AND NOT EXISTS (
                        SELECT 1 FROM email_logs 
                        WHERE recipient = users.email 
                        AND type = 'nurture_10_days'
                    )
                `);
                users10 = res10Days.rows;
            }

            const config25 = await getAutomationConfig('nurture_25_days');
            const delay25 = config25.delay_days || 25;
            const active25 = await isAutomationActive('טיפוח לקוחות: 25 ימים (התאמה אישית)');

            let users25 = [];
            if (active25) {
                const res25Days = await client.query(`
                    SELECT id, first_name, email, created_at 
                    FROM users 
                    WHERE created_at >= NOW() - INTERVAL '${delay25 + 1} days'
                    AND created_at < NOW() - INTERVAL '${delay25} days'
                    AND NOT EXISTS (
                        SELECT 1 FROM email_logs 
                        WHERE recipient = users.email 
                        AND type = 'nurture_25_days'
                    )
                `);
                users25 = res25Days.rows;
            }
            
            console.log(`[Nurture Cron] Found ${users3.length} users for 3-days, ${users10.length} users for 10-days, ${users25.length} users for 25-days.`);

            async function processNurture(users, typeStr) {
                let count = 0;
                for (const user of users) {
                    if (!user.email) continue;
                    await client.query('BEGIN');
                    const lockId = Math.abs(String(user.email + typeStr).split('').reduce((a,b)=>(((a<<5)-a)+b.charCodeAt(0))|0,0));
                    await client.query('SELECT pg_advisory_xact_lock($1)', [lockId]);
                    
                    const check = await client.query("SELECT 1 FROM email_logs WHERE recipient = $1 AND type = $2", [user.email, typeStr]);
                    if (check.rows.length === 0) {
                        await client.query("INSERT INTO email_logs (recipient, subject, type, status) VALUES ($1, 'Processing', $2, 'processing')", [user.email, typeStr]);
                        await client.query('COMMIT');
                        
                        const firstName = user.first_name || 'לקוח/ה';
                        const { html, subject } = await getTemplate(typeStr, { name: firstName });
                        if (html && subject) {
                            await sendEmail(user.email, subject, html, typeStr);
                            count++;
                        }
                    } else {
                        await client.query('ROLLBACK');
                    }
                }
                return count;
            }

            let processed3 = await processNurture(users3, 'nurture_3_days');
            let processed10 = await processNurture(users10, 'nurture_10_days');
            let processed25 = await processNurture(users25, 'nurture_25_days');

            // Update workflow last_run for visual sync
            await client.query(`
                UPDATE workflows 
                SET last_run = NOW(), total_runs = total_runs + $1 
                WHERE name IN ('טיפוח לקוחות: 3 ימים (ללא הזמנה)', 'טיפוח לקוחות: 10 ימים (בקשת בושם)', 'טיפוח לקוחות: 25 ימים (התאמה אישית)')
            `, [processed3 + processed10 + processed25]);

            return NextResponse.json({ 
                success: true, 
                processed3,
                processed10,
                processed25
            });

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Nurture Email Job Error:', error);
        return NextResponse.json({ error: 'Job failed' }, { status: 500 });
    }
}
