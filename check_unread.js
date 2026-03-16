import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false }
});

async function checkUnread() {
    try {
        const { rows: convs } = await pool.query('SELECT * FROM conversations');
        console.log("Conversations Total:", convs.length);
        
        const { rows: msgs } = await pool.query('SELECT * FROM messages WHERE is_read = false');
        console.log("Unread Messages Total:", msgs.length);
        
        if (msgs.length > 0) {
            console.log("\nSample Unread Messages:");
            msgs.slice(0, 10).forEach(m => {
                console.log(` - Msg ${m.id}: Conv=${m.conversation_id}, Sender=${m.sender_id}`);
            });
        }
        
        const { rows: counts } = await pool.query(`
            SELECT c.id, 
                   c.participant1_id, 
                   c.participant2_id, 
                   (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.is_read = false) as unread
            FROM conversations c
            ORDER BY unread DESC
            LIMIT 10
        `);
        console.log("\nConversations with Unread counts:");
        counts.forEach(c => {
             if (c.unread > 0) {
                 console.log(` - Conv ${c.id}: P1=${c.participant1_id}, P2=${c.participant2_id}, Unread=${c.unread}`);
             }
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUnread();
