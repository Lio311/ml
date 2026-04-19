import InfluencerClient from './InfluencerClient';

export const metadata = {
    title: "ניהול משפיענים | ml_tlv",
};

export default function InfluencerPage() {
    return (
        <div className="container mx-auto py-8 text-right" dir="rtl">
            <InfluencerClient />
        </div>
    );
}
