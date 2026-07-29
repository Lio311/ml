# דוח קבצים ששונו ומיפוי לוגואים (QA Report & Logo Mappings)

## 1. רשימת עמודים וקבצים ששונו
להלן רשימת כל הקבצים ששונו במסגרת הריפקטור של הברנד, כדי שתוכל לעבור ולעשות בדיקה ידנית:

- app/about-2/page.js
- app/about/page.js
- app/admin/banner/BannerClient.js
- app/admin/banner/page.js
- app/admin/brand/BrandClient.js
- app/admin/mailing/MailingClient.js
- app/admin/procurement/ProcurementClient.js
- app/api/admin/email-logs/[log_id]/resend/route.js
- app/api/admin/force-review-email/route.js
- app/api/admin/generate-product-ai/route.js
- app/api/admin/orders/create/route.js
- app/api/admin/orders/process-delayed-emails/route.js
- app/api/admin/orders/send-pdf/route.js
- app/api/admin/orders/update/route.js
- app/api/admin/popups/route.js
- app/api/cron/desc-review/route.js
- app/api/cron/educational-email/route.js
- app/api/cron/new-perfumes/route.js
- app/api/cron/process-delayed-emails/route.js
- app/api/cron/review-request/route.js
- app/api/cron/seo-bot/route.js
- app/api/og/product/route.js
- app/api/orders/route.js
- app/api/preorders/notify/route.js
- app/api/webhooks/clerk/route.js
- app/blog/[slug]/page.js
- app/blog/page.js
- app/brands/[brand]/page.js
- app/brands/page.js
- app/cart/CartClient.js
- app/catalog/[slug]/page.js
- app/catalog/page.js
- app/catalogs-info/page.js
- app/components/AuthorBox.js
- app/components/BrandInsight.js
- app/components/BreadcrumbSchema.js
- app/components/Chat/InboxClient.js
- app/components/Chatbot/ChatWidget.js
- app/components/ClientLayout.js
- app/components/Header.js
- app/components/HomeFAQSection.js
- app/components/InstagramPopup.js
- app/components/ProductGallery.js
- app/components/SmartAdvisorTab.js
- app/contact/page.js
- app/context/BrandContext.js
- app/context/LanguageContext.js
- app/data/faq_data.js
- app/data/privacy_data.js
- app/data/terms_data.js
- app/discovery-sets/page.js
- app/faq/page.js
- app/layout.js
- app/lib/brand.js
- app/lib/brandData.js
- app/lib/email.js
- app/lib/getT.js
- app/llms.txt/route.js
- app/maintenance/MaintenanceClient.js
- app/maintenance/page.js
- app/page.js
- app/privacy/page.js
- app/product/[slug]/page.js
- app/sales/page.js
- app/shipping/page.js
- app/sitemap.js
- app/terms/page.js
- app/unsubscribe/page.js

## 2. מיפוי שימוש בתמונות לוגו בקוד
היכן נעשה שימוש בכל אחד מקבצי הלוגו בתוך קוד המקור:

### `logo_v3.png`
- `app/product/[slug]/page.js`
- `app/api/admin/push/send/route.js`
- `public/offline.html`
- `public/sw.js`
- `scripts/archive/old_product_page_utf8.js`

### `logo_v5.png`
- `app/layout.js`
- `app/admin/logo/LogoClient.js`
- `app/about/page.js`
- `app/about-2/page.js`
- `app/blog/page.js`
- `app/blog/[slug]/page.js`
- `app/components/Header.js`
- `app/api/admin/logo/route.js`
- `app/api/og/product/route.js`
- `app/maintenance/MaintenanceClient.js`
- `tmp_header_content.txt`
- `scripts/archive/test.html`
- `scripts/archive/test2.html`
- `scripts/archive/test3.html`
- `scripts/archive/update_image.js`

### `logo_v6.png`
- `app/lib/email.js`

### `ml_CHAT.png`
- `app/blog/[slug]/page.js`
- `app/components/Chat/InboxClient.js`
