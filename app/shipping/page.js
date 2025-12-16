export const metadata = {
    title: "מדיניות משלוחים | ml_tlv",
    description: "מידע על משלוחים, זמני אספקה ומחירים.",
};

export default function ShippingPage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8 text-center">מדיניות משלוחים</h1>
            <div className="bg-white p-8 rounded-xl shadow-sm border space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-3">אפשרויות משלוח</h2>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li><strong>משלוח ללוקר (Boxit/Chita):</strong> בעלות 30 ₪. מגיע לנקודת איסוף קרובה לביתכם תוך 3-5 ימי עסקים.</li>
                        <li><strong>משלוח עד הבית:</strong> בעלות 50 ₪. שליח עד הדלת תוך 2-4 ימי עסקים.</li>
                        <li><strong>איסוף עצמי:</strong> בתיאום מראש מתל אביב.</li>
                    </ul>
                </div>

                <div>
                    <h2 className="text-2xl font-bold mb-3">זמני אספקה</h2>
                    <p className="text-gray-700">
                        אנו עושים מאמץ להוציא כל הזמנה תוך 24 שעות מרגע קבלתה. זמני המשלוח עשויים להשתנות בהתאם למיקום ולחברת השילוח.
                    </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">
                        * ימי עסקים אינם כוללים שישי, שבת וחגים.
                        <br />
                        * ייתכנו עיכובים לישובים מרוחקים.
                    </p>
                </div>
            </div>
        </div>
    );
}
