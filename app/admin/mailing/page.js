import MailingClient from './MailingClient';

import { getBrandName } from "../../lib/brand";

export async function generateMetadata() {
    return {
        title: 'ניהול דיוור Admin',
    };
}

export default function MailingPage() {
    return <MailingClient />;
}
