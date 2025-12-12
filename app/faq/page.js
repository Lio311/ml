export default function FAQPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl text-right" dir="rtl">
                <h1 className="text-3xl font-bold mb-10 text-center md:text-right">שאלות ותשובות נפוצות</h1>

                <div className="space-y-8">

                    {/* Q1 */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-black mb-3">האם הדוגמיות הנמכרות באתר מקוריות?</h2>
                        <p className="text-gray-700 leading-relaxed">
                            בהחלט! כל הדוגמיות (Decants) נמזגות אך ורק מבקבוקים מקוריים של המותגים. אנו מתחייבים למקוריות מלאה של כל הניחוחות.
                        </p>
                    </div>

                    {/* Q2 */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-black mb-3">איפה אתם נמצאים? האם ניתן לבצע איסוף עצמי?</h2>
                        <p className="text-gray-700 leading-relaxed">
                            איסוף עצמי הוא האופציה המומלצת (וחוסך דמי משלוח!). האיסוף מתבצע מכיכר מילאנו, תל אביב, בתיאום מראש.
                        </p>
                    </div>

                    {/* Q3 */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-black mb-3">האם ניתן להחזיר דוגמית שלא אהבתי?</h2>
                        <p className="text-gray-700 leading-relaxed">
                            שלילי. לא ניתן להחזיר מוצרי קוסמטיקה שנפתחו, ובפרט דוגמיות שנמזגו במיוחד עבורכם.
                            <br />
                            אם אינכם בטוחים לגבי בושם מסוים, אנו ממליצים להזמין את הגודל הקטן ביותר (2 מ״ל) כדי לנסות אותו ולבדוק את ההתאמה לעור שלכם לפני שמתחייבים לבקבוק גדול.
                        </p>
                    </div>

                    {/* Q4 */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-black mb-3">האם ניתן לקבל המלצה לבשמים?</h2>
                        <p className="text-gray-700 leading-relaxed">
                            בטח! צרו איתנו קשר דרך עמוד 'צור קשר' (או בוואטסאפ), ונציג מטעמנו ישמח לחזור אליכם בהקדם ולתת ייעוץ מקצועי להתאמת הניחוח המושלם עבורכם.
                        </p>
                    </div>

                    {/* Q5 */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-black mb-3">כמה ריסוסים יש בדוגמית של 2 מ״ל?</h2>
                        <p className="text-gray-700 leading-relaxed">
                            לפי הבדיקות שלנו, בקבוקון ה-2 מ״ל מכיל כ-45 ריסוסים. גודל זה מספיק בהחלט כדי לחוות את הבושם במשך מספר ימים ולגבש עליו דעה מוצקה.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
