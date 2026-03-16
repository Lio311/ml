import ReviewsClient from './ReviewsClient';

export const metadata = {
    title: 'ביקורות לקוחות | ml_tlv',
    description: 'מה הלקוחות שלנו חושבים על חויית הרכישה והבשמים של ml_tlv. ביקורות אמיתיות על דוגמיות בשמי יוקרה.',
};

export default function ReviewsPage() {
    return <ReviewsClient />;
}
