const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    await client.connect();

    try {
        const nodes = [
            { id: 't_monthly_rec', type: 'trigger', position: { x: 200, y: 150 }, data: { label: '30 לכל חודש (או 28 בפברואר)', category: 'שיווק ושימור' } },
            { id: 'a_monthly_rec', type: 'action', position: { x: 600, y: 150 }, data: { label: 'שליחת המלצת החודש', target: 'customer', description: 'שליחת המייל החודשי של המנהל עם 4 בשמים מומלצים לכל מנויי הדיוור' } }
        ];

        const edges = [
            { id: 'e_monthly_rec', source: 't_monthly_rec', target: 'a_monthly_rec', animated: true, style: { stroke: '#16a34a', strokeWidth: 2 } }
        ];

        // Check if it already exists
        const check = await client.query("SELECT * FROM workflows WHERE name = 'המלצת החודש של מנהל האתר'");
        if (check.rows.length === 0) {
            await client.query(`
                INSERT INTO workflows (name, is_active, nodes, edges)
                VALUES ($1, $2, $3, $4)
            `, ['המלצת החודש של מנהל האתר', true, JSON.stringify(nodes), JSON.stringify(edges)]);
            console.log("Workflow inserted successfully!");
        } else {
            console.log("Workflow already exists.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
