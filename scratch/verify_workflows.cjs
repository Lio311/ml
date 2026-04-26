const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.query(`SELECT id, name, nodes, edges FROM workflows ORDER BY name ASC`).then(res => {
    let report = '';
    res.rows.forEach(r => {
        report += `\n========================================\n`;
        report += `WORKFLOW: ${r.name}\n`;
        report += `========================================\n`;
        
        const nodes = Array.isArray(r.nodes) ? r.nodes : [];
        const edges = Array.isArray(r.edges) ? r.edges : [];
        
        // Find triggers
        const triggers = nodes.filter(n => n.type === 'trigger');
        triggers.forEach(t => {
            report += `[TRIGGER] ${t.data.label} (${t.data.triggerType})\n`;
        });
        
        // Find sequence
        let currentNodes = triggers;
        while(currentNodes.length > 0) {
            let nextNodes = [];
            currentNodes.forEach(n => {
                const outEdges = edges.filter(e => e.source === n.id);
                outEdges.forEach(e => {
                    const target = nodes.find(targetNode => targetNode.id === e.target);
                    if (target) {
                        report += `   |--→ `;
                        if (target.type === 'wait') {
                            report += `[WAIT] ${target.data.waitValue} ${target.data.waitUnit}\n`;
                        } else if (target.type === 'action') {
                            report += `[ACTION] ${target.data.label} (${target.data.actionType})`;
                            if (target.data.templateSlug) {
                                report += ` -> Template: ${target.data.templateSlug}`;
                            }
                            if (target.data.actionType === 'coupon') {
                                report += ` -> Coupon: ${target.data.discount_percent}% off, valid ${target.data.coupon_validity_hours}h, cooldown ${target.data.cooldown_days}d`;
                            }
                            report += `\n`;
                        } else {
                            report += `[${target.type.toUpperCase()}] ${target.data.label}\n`;
                        }
                        nextNodes.push(target);
                    }
                });
            });
            currentNodes = nextNodes;
        }
    });
    
    console.log(report);
    pool.end();
}).catch(console.error);
