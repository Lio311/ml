const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/Users/liorzafrir/.gemini/antigravity/brain/295768e2-d196-40e2-85f0-17f10cdec266/.system_generated/steps/65/output.txt', 'utf8'));

const items = data[0].items;

items.forEach((orderItem, index) => {
  if (orderItem.type === 'bundle') {
    console.log(`\nחבילה ${index + 1}: ${orderItem.name} (גודל: ${orderItem.size} מ"ל)`);
    orderItem.items.forEach(item => {
      const sizeKey = `price_${orderItem.size}ml`;
      let price = item[sizeKey];
      if (price === undefined) {
          price = item.price; // fallback
      }
      console.log(`- ${item.name_he || item.name}: ${price} ש"ח`);
    });
  } else {
    // Regular item
    let size = orderItem.size;
    let sizeKey = `price_${size}ml`;
    let price = orderItem[sizeKey] || orderItem.price;
    console.log(`\nפריט רגיל: ${orderItem.name_he || orderItem.name} (גודל: ${size} מ"ל) - ${price} ש"ח`);
  }
});
