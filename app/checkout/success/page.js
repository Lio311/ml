import Link from "next/link";

export default function CheckoutSuccessPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-4xl font-bold mb-4">תודה על הזמנתך!</h1>
            <p className="text-xl text-gray-600 mb-8 max-w-md">
                ההזמנה שלך נקלטה במערכת בהצלחה.
                <br />
                נציג שלנו ייצור איתך קשר בוואטסאפ בקרוב להסדרת התשלום והמשלוח.
            </p>

            <Link href="/catalog" className="btn btn-primary">
                חזרה לקטלוג
            </Link>
        </div>
    );
}
