const fetch = require('node-fetch');

async function test() {
    const payload = {
        brand: "Test Brand",
        model: "Test Model",
        price_2ml: 10,
        price_5ml: 20,
        price_10ml: 30,
        image_url: "http://example.com/img.jpg",
        category: "נשים, יוניסקס, טרופי",
        description: "בושם מדהים עם ניחוח של קיץ ושמש",
        stock: 100,
        top_notes: "לימון, ברגמוט",
        middle_notes: "יסמין, ורד",
        base_notes: "מושק, עץ",
        in_lottery: false,
        name_he: "טסט",
        brand_he: "טסט ברנד",
        model_he: "טסט מודל",
        cost_price: 5,
        original_size: 100,
        seasons: "קיץ, אביב",
        perfumers: "ביג בוס",
        country: "צרפת"
    };

    // Note: I can't call the API directly because of isAdmin check (requires Clerk session)
    // So I will instead test the translate functions directly again but more thoroughly.
    const { translateList, translateText } = require('./app/lib/translate.js');
    
    console.log("Testing translateList (Category):", await translateList(payload.category));
    console.log("Testing translateList (Notes):", await translateList(payload.top_notes));
    console.log("Testing translateText (Description):", await translateText(payload.description));
}

test();
