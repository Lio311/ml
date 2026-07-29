const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/Users/liorzafrir/.gemini/antigravity/brain/295768e2-d196-40e2-85f0-17f10cdec266/.system_generated/steps/65/output.txt', 'utf8'));

const items = data[0].items;

items.forEach((orderItem, index) => {
  if (orderItem.type === 'bundle') {
    let sumBefore = 0;
    orderItem.items.forEach(item => {
      const sizeKey = `price_${orderItem.size}ml`;
      let price = item[sizeKey];
      if (price === undefined) {
          price = item.price;
      }
      sumBefore += price;
    });
    
    let priceAfter = orderItem.price; // This is the bundle price the user pays
    
    // Calculate percentage
    let discountPercent = ((sumBefore - priceAfter) / sumBefore) * 100;
    
    console.log(`\nחבילה ${index + 1}: ${orderItem.name}`);
    console.log(`מחיר כולל לפני הנחה (חיבור הפריטים): ${sumBefore} ש"ח`);
    console.log(`מחיר החבילה בפועל (אחרי הנחה): ${priceAfter} ש"ח`);
    console.log(`אחוז הנחה: ${discountPercent.toFixed(2)}%`);
  }
});
