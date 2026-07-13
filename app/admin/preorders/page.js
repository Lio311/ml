import PreordersClient from './PreordersClient';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function PreordersPage() {
    const { sessionClaims } = await auth();
    const userEmail = sessionClaims?.email;
    const role = sessionClaims?.publicMetadata?.role;

    if (userEmail !== process.env.ADMIN_EMAIL && role !== 'admin') {
        redirect('/');
    }

    return <PreordersClient />;
}
