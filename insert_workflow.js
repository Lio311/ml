const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    await client.connect();

    try {
        const workflows = [
            {
                name: 'המלצה חודשית עם קופון אישי',
                nodes: [
                    { id: 't_monthly_rec', type: 'trigger', position: { x: 200, y: 150 }, data: { label: '30 ימים מיום הזמנה (אם לא הזמין שוב)', category: 'תזמון וזמנים' } },
                    { id: 'a_monthly_rec', type: 'action', position: { x: 600, y: 150 }, data: { label: 'שליחת המלצה חודשית', target: 'customer', description: 'שולח אימייל עם המלצות על בסיס העדפות עם קופון אישי' } }
                ],
                edges: [
                    { id: 'e_monthly_rec', source: 't_monthly_rec', target: 'a_monthly_rec', animated: true, style: { stroke: '#16a34a', strokeWidth: 2 } }
                ]
            },
            {
                name: 'טיפוח לקוחות: 3 ימים (ללא הזמנה)',
                nodes: [
                    { id: 't_nurture_3', type: 'trigger', position: { x: 200, y: 150 }, data: { label: '3 ימים לאחר הרשמה (ללא הזמנה)', category: 'תזמון וזמנים' } },
                    { id: 'a_nurture_3', type: 'action', position: { x: 600, y: 150 }, data: { label: 'שליחת מייל שירות לקוחות', target: 'customer', description: 'שולח מייל לבדוק האם הכל בסדר והאם נתקל בתקלה' } }
                ],
                edges: [
                    { id: 'e_nurture_3', source: 't_nurture_3', target: 'a_nurture_3', animated: true, style: { stroke: '#16a34a', strokeWidth: 2 } }
                ]
            },
            {
                name: 'טיפוח לקוחות: דיוור מבצע דיסקברי חודשי',
                nodes: [
                    { id: 't_monthly_discovery', type: 'trigger', position: { x: 200, y: 150 }, data: { label: 'יום רביעי הראשון בכל חודש', category: 'תזמון וזמנים' } },
                    { id: 'a_monthly_discovery', type: 'action', position: { x: 600, y: 150 }, data: { label: 'שליחת דיוור דיסקברי', target: 'customer', description: 'שולח מייל תזכורת על מבצע הדיסקברי החודשי' } }
                ],
                edges: [
                    { id: 'e_monthly_discovery', source: 't_monthly_discovery', target: 'a_monthly_discovery', animated: true, style: { stroke: '#16a34a', strokeWidth: 2 } }
                ]
            }
        ];

        for (const wf of workflows) {
            const check = await client.query("SELECT * FROM workflows WHERE name = $1", [wf.name]);
            if (check.rows.length === 0) {
                await client.query(`
                    INSERT INTO workflows (name, is_active, nodes, edges)
                    VALUES ($1, $2, $3, $4)
                `, [wf.name, true, JSON.stringify(wf.nodes), JSON.stringify(wf.edges)]);
                console.log(`Workflow inserted: ${wf.name}`);
            } else {
                console.log(`Workflow already exists: ${wf.name}`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
