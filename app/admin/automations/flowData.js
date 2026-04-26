export const initialNodes = [
  // --- Orders ---
  { id: 't_order_completed', type: 'trigger', position: { x: 200, y: 100 }, data: { label: 'הזמנה חדשה הושלמה', category: 'הזמנות' } },
  { id: 'a_order_conf', type: 'action', position: { x: 600, y: 50 }, data: { label: 'אישור קבלת הזמנה', target: 'customer', description: 'שליחת פרטי ההזמנה ללקוח.' } },
  { id: 'a_order_admin', type: 'action', position: { x: 600, y: 150 }, data: { label: 'התראת הזמנה חדשה', target: 'admin', description: 'התראה למנהל על כניסת הזמנה חדשה.' } },
  
  { id: 't_order_update', type: 'trigger', position: { x: 200, y: 300 }, data: { label: 'הזמנה עודכנה במערכת', category: 'הזמנות' } },
  { id: 'a_order_update', type: 'action', position: { x: 600, y: 300 }, data: { label: 'עדכון פרטי הזמנה', target: 'customer', description: 'עדכון הלקוח על שינוי בפריטים/משלוח.' } },

  { id: 't_order_status', type: 'trigger', position: { x: 200, y: 450 }, data: { label: 'שינוי סטטוס הזמנה', category: 'הזמנות' } },
  { id: 'a_order_status', type: 'action', position: { x: 600, y: 450 }, data: { label: 'עדכון סטטוס ללקוח', target: 'customer', description: 'הודעה כגון: "מוכן לאיסוף", "נשלח".' } },

  // --- Users ---
  { id: 't_user_register', type: 'trigger', position: { x: 200, y: 650 }, data: { label: 'משתמש חדש נרשם', category: 'משתמשים' } },
  { id: 'a_user_welcome', type: 'action', position: { x: 600, y: 600 }, data: { label: 'מייל ברוכים הבאים', target: 'customer', description: 'קבלת פנים למשתמש חדש.' } },
  { id: 'a_user_admin', type: 'action', position: { x: 600, y: 700 }, data: { label: 'התראת נרשם חדש', target: 'admin', description: 'יידוע המנהל על רישום חדש.' } },

  // --- Marketing ---
  { id: 't_cart_abandoned', type: 'trigger', position: { x: 200, y: 850 }, data: { label: 'עגלה נטושה', category: 'שיווק ושימור' } },
  { id: 'a_cart_recovery', type: 'action', position: { x: 600, y: 850 }, data: { label: 'שחזור עגלה + קופון 5%', target: 'customer', description: 'מייל שנשלח במטרה להחזיר את הלקוח.' } },

  { id: 't_nurture_10', type: 'trigger', position: { x: 200, y: 1000 }, data: { label: '10 ימים מהרשמה/רכישה', category: 'שיווק ושימור' } },
  { id: 'a_nurture_10', type: 'action', position: { x: 600, y: 1000 }, data: { label: 'הזמנה לבקש בושם מיוחד', target: 'customer', description: 'עידוד הלקוח להשתמש בשירות בקשת הבשמים.' } },

  { id: 't_nurture_25', type: 'trigger', position: { x: 200, y: 1150 }, data: { label: '25 ימים מהרשמה/רכישה', category: 'שיווק ושימור' } },
  { id: 'a_nurture_25', type: 'action', position: { x: 600, y: 1150 }, data: { label: 'הזמנה להתאמה אישית', target: 'customer', description: 'עידוד למילוי שאלון התאמת בשמים.' } },

  { id: 't_edu_cron', type: 'trigger', position: { x: 200, y: 1300 }, data: { label: 'שליחת טיפים (תזמון)', category: 'שיווק ושימור' } },
  { id: 'a_edu_cron', type: 'action', position: { x: 600, y: 1300 }, data: { label: 'טיפים לשימוש בבושם', target: 'customer', description: 'תוכן חינוכי בנושא ריסוס ואחסון בשמים.' } },

  { id: 't_rec_cron', type: 'trigger', position: { x: 200, y: 1450 }, data: { label: 'המלצות תקופתיות (תזמון)', category: 'שיווק ושימור' } },
  { id: 'a_rec_cron', type: 'action', position: { x: 600, y: 1450 }, data: { label: 'המלצות אישיות', target: 'customer', description: 'שליחת ניחוחות מומלצים בהתאמה אישית.' } },

  // --- Reviews & Products ---
  { id: 't_review_req', type: 'trigger', position: { x: 200, y: 1650 }, data: { label: 'מספר ימים לאחר הזמנה', category: 'חוות דעת ומוצרים' } },
  { id: 'a_review_req', type: 'action', position: { x: 600, y: 1650 }, data: { label: 'בקשת כתיבת חוות דעת', target: 'customer', description: 'שליחת בקשה ללקוח לדירוג המוצרים.' } },

  { id: 't_review_sub', type: 'trigger', position: { x: 200, y: 1800 }, data: { label: 'לקוח פרסם חוות דעת', category: 'חוות דעת ומוצרים' } },
  { id: 'a_review_sub', type: 'action', position: { x: 600, y: 1800 }, data: { label: 'מתנה למדרגים (קופון 10%)', target: 'customer', description: 'שליחת קופון אוטומטי כאות תודה.' } },

  { id: 't_stock_back', type: 'trigger', position: { x: 200, y: 1950 }, data: { label: 'מוצר חזר למלאי', category: 'חוות דעת ומוצרים' } },
  { id: 'a_stock_back', type: 'action', position: { x: 600, y: 1950 }, data: { label: 'התראת "חזר למלאי"', target: 'customer', description: 'נשלח לנרשמים שביקשו עדכון.' } },

  { id: 't_new_prod', type: 'trigger', position: { x: 200, y: 2100 }, data: { label: 'בושם חדש נוסף לקטלוג', category: 'חוות דעת ומוצרים' } },
  { id: 'a_new_prod', type: 'action', position: { x: 600, y: 2100 }, data: { label: 'התראת בושם חדש', target: 'customer', description: 'שליחה לרשימת התפוצה אודות מוצר חדש.' } },

  // --- General ---
  { id: 't_contact', type: 'trigger', position: { x: 200, y: 2300 }, data: { label: 'מילוי טופס צור קשר', category: 'כללי' } },
  { id: 'a_contact', type: 'action', position: { x: 600, y: 2300 }, data: { label: 'התראת צור קשר למנהל', target: 'admin', description: 'העברת פניית הלקוח למייל מנהל האתר.' } }
];

export const initialEdges = [
  { id: 'e1', source: 't_order_completed', target: 'a_order_conf', animated: true, style: { stroke: '#16a34a', strokeWidth: 2 } },
  { id: 'e2', source: 't_order_completed', target: 'a_order_admin', animated: true, style: { stroke: '#000', strokeWidth: 2 } },
  { id: 'e3', source: 't_order_update', target: 'a_order_update', animated: true, style: { stroke: '#16a34a', strokeWidth: 2 } },
  { id: 'e4', source: 't_order_status', target: 'a_order_status', animated: true, style: { stroke: '#16a34a', strokeWidth: 2 } },

  { id: 'e5', source: 't_user_register', target: 'a_user_welcome', animated: true, style: { stroke: '#16a34a', strokeWidth: 2 } },
  { id: 'e6', source: 't_user_register', target: 'a_user_admin', animated: true, style: { stroke: '#000', strokeWidth: 2 } },

  { id: 'e7', source: 't_cart_abandoned', target: 'a_cart_recovery', animated: true, style: { stroke: '#16a34a', strokeWidth: 2 } },
  { id: 'e8', source: 't_nurture_10', target: 'a_nurture_10', animated: true, style: { stroke: '#16a34a', strokeWidth: 2 } },
  { id: 'e9', source: 't_nurture_25', target: 'a_nurture_25', animated: true, style: { stroke: '#16a34a', strokeWidth: 2 } },
  { id: 'e10', source: 't_edu_cron', target: 'a_edu_cron', animated: true, style: { stroke: '#16a34a', strokeWidth: 2 } },
  { id: 'e11', source: 't_rec_cron', target: 'a_rec_cron', animated: true, style: { stroke: '#16a34a', strokeWidth: 2 } },

  { id: 'e12', source: 't_review_req', target: 'a_review_req', animated: true, style: { stroke: '#16a34a', strokeWidth: 2 } },
  { id: 'e13', source: 't_review_sub', target: 'a_review_sub', animated: true, style: { stroke: '#16a34a', strokeWidth: 2 } },
  { id: 'e14', source: 't_stock_back', target: 'a_stock_back', animated: true, style: { stroke: '#16a34a', strokeWidth: 2 } },
  { id: 'e15', source: 't_new_prod', target: 'a_new_prod', animated: true, style: { stroke: '#16a34a', strokeWidth: 2 } },

  { id: 'e16', source: 't_contact', target: 'a_contact', animated: true, style: { stroke: '#000', strokeWidth: 2 } },
];
