const mapping = {
    "בלו": "Bleu",
    "שאנל": "Chanel"
};

function mapHebrewQuery(query) {
    if (!query) return query;
    const lowerQuery = query.toLowerCase().trim();

    // Sequential Replacements
    let currentResult = lowerQuery;
    const sortedMappings = Object.entries(mapping).sort((a, b) => b[0].length - a[0].length);

    for (const [hebrew, english] of sortedMappings) {
        if (currentResult.includes(hebrew)) {
            const boundaryPattern = `[^a-zA-Z0-9\\u0590-\\u05FF]`;
            const regex = new RegExp(`(^|${boundaryPattern})${hebrew}(?=${boundaryPattern}|$)`, 'gu');
            currentResult = currentResult.replace(regex, `$1${english}`);
        }
    }

    return currentResult.trim();
}

console.log("Original: 'בלונד' -> Mapped:", mapHebrewQuery("בלונד"));
console.log("Original: 'בלו שאנל' -> Mapped:", mapHebrewQuery("בלו שאנל"));
console.log("Original: 'בלו' -> Mapped:", mapHebrewQuery("בלו"));
