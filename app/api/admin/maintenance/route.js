import { NextResponse } from 'next/server';
import client from '../../../../lib/db';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(req) {
    try {
        const user = await currentUser();
        const role = user?.publicMetadata?.role;
        const adminEmail = process.env.ADMIN_EMAIL;
        const isSuperAdmin = user?.emailAddresses?.[0]?.emailAddress === adminEmail;
        
        if (!isSuperAdmin && role !== 'admin' && role !== 'deputy') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { enabled } = await req.json();

        // Check if exists
        const existCheck = await client.query(`SELECT id FROM site_settings WHERE key = 'maintenance_mode'`);
        if (existCheck.rows.length > 0) {
            await client.query(`UPDATE site_settings SET value = $1, updated_at = NOW() WHERE key = 'maintenance_mode'`, [JSON.stringify({ enabled: !!enabled })]);
        } else {
            await client.query(`INSERT INTO site_settings (key, value) VALUES ('maintenance_mode', $1)`, [JSON.stringify({ enabled: !!enabled })]);
        }

        // Add to audit logs
        const adminName = user ? `${user.firstName} ${user.lastName}` : 'Admin';
        await client.query(
            `INSERT INTO audit_logs (admin_id, admin_name, action, details) VALUES ($1, $2, $3, $4)`,
            [user?.id, adminName, 'UPDATE_MAINTENANCE_MODE', JSON.stringify({ enabled })]
        );

        return NextResponse.json({ success: true, enabled: !!enabled });
    } catch (err) {
        console.error('Error updating maintenance mode:', err);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
