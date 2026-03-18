const fs = require('fs');
const path = require('path');

const baseDir = process.cwd();
const filesToProcess = [
    'README.md',
    'public/manifest.json',
    'app/shipping/page.js',
    'app/requests/page.js',
    'app/wishlist/page.js',
    'app/terms/page.js',
    'app/lottery/page.js',
    'app/reviews/page.js',
    'app/reviews/ReviewsClient.js',
    'app/page.js',
    'app/privacy/page.js',
    'app/product/[slug]/page.js',
    'app/orders/page.js',
    'app/my-catalogs/[id]/page.js',
    'app/catalog/[slug]/cart/page.js',
    'app/catalog/[slug]/page.js',
    'app/my-catalogs/page.js',
    'app/matching/page.js',
    'app/layout.js',
    'app/lib/brandData.js',
    'app/landing_page/page.js',
    'app/lib/email.js',
    'app/landing_page/ClientLanding.js',
    'app/catalog/page.js',
    'app/inbox/page.js',
    'app/landing/ClientLandingPage.js',
    'app/landing/page.js',
    'app/faq/page.js',
    'app/components/Chatbot/ChatWidget.js',
    'app/components/InstagramPopup.js',
    'app/components/HomeSEOContent.js',
    'app/components/OrderReviewPrompt.js',
    'app/components/ShareButton.js',
    'app/components/Chat/InboxClient.js',
    'app/components/Footer.js',
    'app/contact/page.js',
    'app/cart/CartClient.js',
    'app/cart/page.js',
    'app/catalogs-info/page.js',
    'app/catalogs-info/InfoPageClient.js',
    'app/components/admin/AdminMobileNav.js',
    'app/components/admin/AdminSidebar.js',
    'app/api/webhooks/clerk/route.js',
    'app/api/orders/route.js',
    'app/api/products/route.js',
    'app/brands/page.js',
    'app/blog/page.js',
    'app/blog/[slug]/page.js'
];

filesToProcess.forEach(fileRelPath => {
    const fullPath = path.join(baseDir, fileRelPath);
    if (fs.existsSync(fullPath)) {
        try {
            let content = fs.readFileSync(fullPath, 'utf8');
            const newContent = content.replace(/ML_TLV/g, 'ml_tlv');
            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log(`Updated: ${fileRelPath}`);
            }
        } catch (err) {
            console.error(`Error processing ${fileRelPath}:`, err);
        }
    } else {
        console.warn(`File not found: ${fileRelPath}`);
    }
});
