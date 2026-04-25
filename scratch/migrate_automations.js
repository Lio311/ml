const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function migrate() {
    console.log("🚀 Starting Automation Tables Migration...");
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Create Workflows Table
        console.log("Creating 'workflows' table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS workflows (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                description TEXT,
                nodes JSONB DEFAULT '[]',
                edges JSONB DEFAULT '[]',
                is_active BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        // 2. Create Workflow Runs Table
        console.log("Creating 'workflow_runs' table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS workflow_runs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
                status TEXT NOT NULL DEFAULT 'running',
                trigger_data JSONB DEFAULT '{}',
                logs JSONB DEFAULT '[]',
                started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                completed_at TIMESTAMP WITH TIME ZONE
            );
        `);

        // 3. Add Updated At Trigger
        console.log("Adding update trigger...");
        await client.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql';

            DROP TRIGGER IF EXISTS update_workflows_updated_at ON workflows;
            CREATE TRIGGER update_workflows_updated_at
                BEFORE UPDATE ON workflows
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

        await client.query('COMMIT');
        console.log("✅ Migration completed successfully!");
    } catch (err) {
        await client.query('ROLLBACK');
        console.log("❌ Migration failed!");
        console.error(err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
