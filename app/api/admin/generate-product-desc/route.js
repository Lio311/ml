import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req) {
    try {
        const user = await currentUser();
        const role = user?.publicMetadata?.role;
        const email = user?.emailAddresses?.[0]?.emailAddress;
        const isSuperAdmin = email === process.env.ADMIN_EMAIL;

        if (!isSuperAdmin && role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { brand, name } = await req.json();

        if (!brand || !name) {
            return NextResponse.json({ error: 'Brand and Name are required' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY is missing' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
אתה קופירייטר מומחה לבשמי נישה עבור אתר ישראלי יוקרתי בשם ml-tlv.
המטרה שלך היא לכתוב תיאור קצר, פואטי ומושך לבושם: "${brand} ${name}".
אם אין לך מידע ספציפי על הבושם הזה, חפש במאגר המידע שלך (או השתמש בידע הפנימי שלך) כדי להבין מהם התווים העיקריים שלו והאווירה שלו.

סגנון הכתיבה הנדרש:
1. התחל במשפט קצר וקולע שמתאר את האווירה או ה"וייב" (לדוגמה: "קוקטייל בשקיעה.", "ממתק יוקרתי.", "טיול ביער עבות וקסום.").
2. שלב את תווי הריח העיקריים בצורה ציורית, לא כרשימה טכנית.
3. תאר למי הבושם מתאים או איזו תחושה הוא משדר (לדוגמה: "מתאים למי שאוהב מתוק אבל בסטייל", "משדר 'החיים הטובים'").
4. השתמש בשפה עשירה, יוקרתית אך נגישה (מילים כמו "עסיסי", "אופולנטי", "יוקרתי בטירוף", "משדר סטייל").
5. אורך התיאור צריך להיות בין 3 ל-5 משפטים בלבד. לא ארוך מדי!
6. התיאור חייב להיות בעברית בלבד. החזר **אך ורק את הטקסט של התיאור**, ללא הקדמות, ללא כותרות וללא מירכאות מסביב.

דוגמאות לתיאורים מעולים מהאתר שלנו להשראה:
- "קוקטייל בשקיעה. מנגו ופסיפלורה עסיסיים בשיא הבשלות. בושם שפשוט מקרין שמחת חיים, צבעוניות וטרופיות מתפרצת."
- "כשעולם האופנה המינימליסטי פוגש את הבישום העילי. כמו ללבוש חולצה לבנה מכופתרת וחדשה לגמרי... יצירה שמשדרת סטייל, ניקיון ויוקרה מרוחקת."
- "לא הקולון של סבא שלך. זהו קולון שעבר דרך האש... מתאים לחובבי בישום שמחפשים את הטוויסט המורכב והמעושן לריח הניקיון הקלאסי."
`;

        const result = await model.generateContent(prompt);
        let description = result.response.text().trim();

        // Clean up markdown quotes or backticks if generated accidentally
        description = description.replace(/^["'״`]+|["'״`]+$/g, '');

        return NextResponse.json({ success: true, description });

    } catch (error) {
        console.error("AI Product Desc Generation Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
