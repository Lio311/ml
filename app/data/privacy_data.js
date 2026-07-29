export const getPrivacyHe = (brandName = 'ml_tlv') => [
    {
        title: "כללי",
        items: [
            { 
                q: "מטרה", 
                a: `מדיניות זו נועדה להסביר כיצד ${brandName} אוספת ומשמשת במידע האישי שלך. אנו מתחייבים לשמור על פרטיותך בהתאם לחוק הגנת הפרטיות הישראלי.` 
            }
        ]
    },
    {
        title: "איסוף מידע",
        items: [
            { 
                q: "פרטי רכישה", 
                a: "אנו אוספים שם, כתובת, טלפון ואימייל לצורך עיבוד ואספקת ההזמנות שלך בצורה היעילה ביותר." 
            },
            { 
                q: "ניהול חשבון ואבטחה", 
                a: "אנו משתמשים בשירות Clerk לאימות משתמשים. זהו אחד השירותים המובילים בעולם המבטיח שפרטי ההתחברות שלך נשמרים בצורה מאובטחת ומוצפנת, ללא גישה ישירה של הנהלת האתר לסיסמאות." 
            },
            { 
                q: "מידע טכני ושיפור חוויה", 
                a: "האתר משתמש בעוגיות (Cookies) לצורך תפעול תקין (כמו שמירה על עגלת הקניות). בנוסף, אנו נעזרים ב-Google Analytics ו-Microsoft Clarity כדי להבין טוב יותר איך המשתמשים גולשים באתר ולשפר את חוויית הקניה באופן מתמיד." 
            }
        ]
    },
    {
        title: "שימוש במידע ושיתוף",
        items: [
            { 
                q: "איך אנו משתמשים במידע?", 
                a: "המידע משמש אך ורק לצורך תפעול האתר, משלוח הדיקנטים ושירות לקוחות. איננו מוכרים או משכירים מידע אישי לצדדים שלישיים לצרכי שיווק." 
            },
            { 
                q: "עם מי אנו משתפים מידע?", 
                a: "מידע משותף אך ורק עם ספקים תפעוליים חיוניים: חברות השילוח (UPS, דואר ישראל) לצורך הגעת החבילה, ושירותי אבטחה (Clerk) וסליקה מורשים." 
            }
        ]
    },
    {
        title: "אבטחה וסליקה",
        items: [
            { 
                q: "אבטחת האתר", 
                a: "כל התקשורת באתר מוצפנת בתקן SSL מחמיר. הגלישה והזנת הנתונים שלכם בטוחה לחלוטין." 
            },
            { 
                q: "סליקת כרטיסי אשראי", 
                a: "פרטי האשראי שלכם אינם נשמרים בשרתי האתר. הסליקה מתבצעת ישירות מול ספקי סליקה חיצוניים העומדים בתקן PCI-DSS המחמיר ביותר." 
            }
        ]
    },
    {
        title: "יצירת קשר",
        items: [
            { 
                q: "איך ניתן לפנות בנושאי פרטיות?", 
                a: "לכל שאלה, בקשה לעיון במידע או מחיקתו, ניתן לפנות אלינו במייל: pornfragrance@gmail.com. אנו מבטיחים מענה מהיר ומקצועי." 
            }
        ]
    }
];

export const getPrivacyEn = (brandName = 'ml_tlv') => [
    {
        title: "General",
        items: [
            { 
                q: "Purpose", 
                a: `This policy is intended to explain how ${brandName} collects and uses your personal information. We are committed to protecting your privacy in accordance with the Israeli Privacy Protection Law.` 
            }
        ]
    },
    {
        title: "Information Collection",
        items: [
            { 
                q: "Purchase Details", 
                a: "We collect name, address, phone and email to process and deliver your orders as efficiently as possible." 
            },
            { 
                q: "Account Management and Security", 
                a: "We use Clerk for user authentication. This is one of the world's leading services that ensures your login details are kept securely and encrypted, without direct access to passwords by website management." 
            },
            { 
                q: "Technical Information and Experience Improvement", 
                a: "The site uses Cookies for proper operation (such as maintaining the shopping cart). In addition, we use Google Analytics and Microsoft Clarity to better understand how users browse the site and constantly improve the shopping experience." 
            }
        ]
    },
    {
        title: "Information Use and Sharing",
        items: [
            { 
                q: "How do we use the information?", 
                a: "The information is used solely for operating the site, shipping decants and customer service. We do not sell or rent personal information to third parties for marketing purposes." 
            },
            { 
                q: "With whom do we share information?", 
                a: "Information is shared only with essential operational suppliers: shipping companies (UPS, Israel Post) for package arrival, and authorized security (Clerk) and clearing services." 
            }
        ]
    },
    {
        title: "Security and Clearing",
        items: [
            { 
                q: "Website Security", 
                a: "All communication on the site is encrypted with strict SSL standards. Your browsing and data entry are completely safe." 
            },
            { 
                q: "Credit Card Clearing", 
                a: "Your credit card details are not stored on the site's servers. Clearing is performed directly with external clearing providers that comply with the strictest PCI-DSS standard." 
            }
        ]
    },
    {
        title: "Contact Us",
        items: [
            { 
                q: "How can I contact you regarding privacy issues?", 
                a: "For any question, request to view information or delete it, you can contact us by email: pornfragrance@gmail.com. We promise a quick and professional response." 
            }
        ]
    }
];
