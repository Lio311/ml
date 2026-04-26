import { NextResponse } from "next/server";
import { query } from "../../../../lib/db";
import { auth } from "@clerk/nextjs/server";
import { setAutomationConfig } from "../../../../lib/automationConfig";

/**
 * Maps workflow names to their automation_config slug.
 * Only workflows that have tunable parameters are listed here.
 */
const WORKFLOW_SLUG_MAP = {
    'שחזור עגלה נטושה (+5% הנחה)': 'cart_recovery',
    'טיפוח לקוחות: 10 ימים (בקשת בושם)': 'nurture_10_days',
    'טיפוח לקוחות: 25 ימים (התאמה אישית)': 'nurture_25_days',
    'בקשת כתיבת חוות דעת מלקוח': 'review_request',
    // Educational and recommendations don't have wait nodes in seed, but can be added
};

/**
 * Extracts tunable config from workflow nodes.
 * Looks for Wait nodes (delay), Action nodes with coupon params, etc.
 */
function extractConfigFromNodes(nodes, slug) {
    const config = {};

    for (const node of nodes) {
        // Extract delay from Wait nodes
        if (node.type === 'wait' && node.data) {
            const value = parseInt(node.data.waitValue);
            const unit = node.data.waitUnit || 'days';
            if (!isNaN(value) && value > 0) {
                if (slug === 'cart_recovery') {
                    // Convert to hours
                    if (unit === 'minutes') config.delay_hours = value / 60;
                    else if (unit === 'hours') config.delay_hours = value;
                    else if (unit === 'days') config.delay_hours = value * 24;
                    else if (unit === 'weeks') config.delay_hours = value * 24 * 7;
                } else {
                    // Convert to days
                    if (unit === 'minutes') config.delay_days = Math.ceil(value / 1440);
                    else if (unit === 'hours') config.delay_days = Math.ceil(value / 24);
                    else if (unit === 'days') config.delay_days = value;
                    else if (unit === 'weeks') config.delay_days = value * 7;
                }
            }
        }

        // Extract coupon params from Action nodes
        if (node.type === 'action' && node.data) {
            if (node.data.discount_percent !== undefined) {
                config.discount_percent = parseInt(node.data.discount_percent) || 5;
            }
            if (node.data.coupon_validity_hours !== undefined) {
                config.coupon_validity_hours = parseInt(node.data.coupon_validity_hours) || 24;
            }
            if (node.data.cooldown_days !== undefined) {
                config.cooldown_days = parseInt(node.data.cooldown_days) || 7;
            }
        }
    }

    return config;
}

export async function PATCH(req, { params }) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const { nodes, edges } = await req.json();

        const res = await query(`
            UPDATE workflows 
            SET nodes = $1, edges = $2, updated_at = NOW()
            WHERE id = $3
            RETURNING *
        `, [JSON.stringify(nodes), JSON.stringify(edges), id]);

        if (res.rows.length === 0) {
            return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
        }

        const workflow = res.rows[0];

        // Sync config to automation_config table if this is a known system workflow
        const slug = WORKFLOW_SLUG_MAP[workflow.name];
        if (slug && Array.isArray(nodes) && nodes.length > 0) {
            const extractedConfig = extractConfigFromNodes(nodes, slug);
            if (Object.keys(extractedConfig).length > 0) {
                await setAutomationConfig(slug, extractedConfig);
                console.log(`[Automation Sync] Updated config for "${slug}":`, extractedConfig);
            }
        }

        return NextResponse.json(workflow);
    } catch (err) {
        console.error("Update Automation Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;

        await query(`DELETE FROM workflows WHERE id = $1`, [id]);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Delete Automation Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
