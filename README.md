# 💎 ml_tlv — The Ultimate Luxury Perfume Ecosystem

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/) [![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/) [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?logo=postgresql)](https://neon.tech/) [![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?logo=clerk)](https://clerk.com/) [![Cloudflare](https://img.shields.io/badge/CDN-Cloudflare-F38020?logo=cloudflare)](https://www.cloudflare.com/) [![Google Analytics](https://img.shields.io/badge/Analytics-GA4-E37400?logo=googleanalytics)](https://analytics.google.com/) [![Google Search Console](https://img.shields.io/badge/SEO-Search_Console-4285F4?logo=google)](https://search.google.com/search-console) [![Sentry](https://img.shields.io/badge/Monitoring-Sentry-362D59?logo=sentry)](https://sentry.io/) [![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel)](https://vercel.com/)

A high-performance, enterprise-grade Israeli commerce platform for the luxury perfume decant industry. Far beyond a simple shop — **ml_tlv** is a multi-tenant ecosystem combining AI-powered product intelligence, visual marketing automation, gamified engagement, real-time customer support, and deep operational analytics.

🌐 **Live at [www.ml-tlv.com](https://www.ml-tlv.com)**

---

## 📊 Project Statistics

| Metric | Value |
| :--- | :--- |
| **Total Lines of Code** | 79,809 |
| **Project Files** | 772 |
| **API Endpoints** | 190 |
| **Custom UI Components** | 106 |
| **Database Tables** | 66 |
| **Automated Cron Jobs** | 12 |
| **Admin Dashboard Pages** | 35+ |
| **Mini-Games** | 8 |
| **Tech Stack** | Next.js 16, React 19, PostgreSQL (Neon), Clerk, Three.js, GSAP, Framer Motion, Recharts, ReactFlow, Sentry, Spotify API, Gemini AI |

---

## 🚀 Key Innovation Pillars

### 🏪 Virtual Stores (Multi-Tenant Architecture)
- **Storefront-as-a-Service**: Users create personalized "Virtual Catalogs" with custom branding, unique slugs (`ml-tlv.com/catalog/your-name`), and curated item selections.
- **Independent Management**: Store owners receive dedicated dashboards to manage their unique offerings and receive direct order notifications.
- **B2B Wholesale Catalogs**: Admin-created B2B catalogs with custom per-item pricing, dedicated order tracking, and fulfillment workflows.
- **Branded Experience**: Support for custom logos, descriptions, and direct contact integration.

### 🧪 Algorithmic & Gamified Commerce
- **Smart Matching Wizard**: A data-driven questionnaire analyzing gender preferences, scent notes (top, middle, base), fragrance families, intensity, and occasion to build the "Perfect Bundle" tailored to each user's taste.
- **Custom Bundle Builder**: Interactive UI allowing users to curate personalized fragrance sample sets (Summer vibes, Date night, Niche collectors) with special tier pricing.
- **Discovery Sets & Official Samples**: Curated trial boxes and official manufacturer sample sets with promotional countdown timers.
- **Lottery & Games**: 8 high-fidelity mini-games (Roulette, Slot Machine, Shell Game, Memory, Speed Tap, Chicken Shooter, Trivia, Lucky Wheel) with built-in **Value Protection Logic** — ensuring every player receives more value in products than their entry fee.
- **Dynamic Upsell Engine**: Real-time cart analysis prioritizing Wishlist items, recently viewed products, and free gift threshold progress for personalized recommendations.

### 💬 Unified Communication Center (Inbox)
- **Multi-Role Presence**: Real-time chat connecting Customers, Catalog Owners, and Site Admins.
- **Order Contextualization**: Chat threads automatically embed order status timelines and product previews for friction-less support.
- **AI Chatbot Widget**: Automated first-line support with knowledge base matching before representative handoff.
- **WhatsApp Integration**: Floating quick-action button for direct customer support via WhatsApp.

### 🤖 AI-Powered Intelligence
- **Product Auto-Fill Engine** (Gemini AI): 1-click generation of fragrance notes (top, middle, base), rich perfume descriptions, and matching Spotify track URLs.
- **AI Description Quality Scoring**: Automated evaluation of product descriptions for quality, clarity, and SEO optimization with auto-generated improvements.
- **AI SEO Content Generator**: Blog post & landing page generation based on topics and target keywords.
- **Smart Recommendation Engine**: Scent recommendation algorithm scoring perfumes based on user purchase history and note affinity.
- **LLM-Ready Endpoint** (`/llms.txt`): Machine-readable store summary optimized for AI Search Engines & LLM agents.

### 🎵 Spotify Integration
- **Fragrance Vibes Player**: Embedded Spotify audio player pairing each perfume product with a curated ambient playlist, creating a multi-sensory shopping experience.
- **Admin Track Selector**: Dedicated Spotify track management interface with bulk assignment and debug tools.

---

## 📊 Operational Excellence (Admin Dashboard)

A comprehensive 35+ page admin panel powering every aspect of the business:

### Sales & Operations
- **Order Management**: Full lifecycle tracking with status workflows (pending → processing → shipped → ready for pickup → completed), batch operations, PDF invoice/dispatch slip generation, and re-send confirmation emails.
- **Customer 360 View**: Complete customer profile modal showing total spend, lifetime orders, address book, and behavioral metrics.
- **Live Cart Monitoring**: Real-time stream of active user shopping carts with GSAP animations, displaying items, value, identified vs. anonymous users, and activity timestamps.
- **Phone Order / Admin POS**: Manual order creation tool for phone/in-store sales with live customer & product search, Israeli address autocomplete, coupon validation, and 1-click checkout.
- **Expense Tracking**: Operational expense manager (recurring vs. one-time) automatically deducted from gross revenue for net profit calculation.

### Inventory & Procurement
- **Products CRUD with AI Auto-Fill**: Full product catalog management with 1-click AI generation of notes, descriptions, and Spotify tracks.
- **Smart Pricing Engine**: Bulk price adjustment tool (+/- NIS) across specific sizes, categories, or brands with audit log and 1-click undo/rollback.
- **Inventory Heatmap**: Visual 90-day sales velocity matrix highlighting fast-selling and low-stock items.
- **Discovery Sets & Bundles Manager**: Custom sample set creation with AI-powered substitute suggestions when stock is low.
- **Procurement Lists**: Restock tracking for raw materials, perfume bottles, and decant vials.
- **Predictive Forecasting** (`InventoryForecast`): Stock depletion projections and reorder threshold alerts.

### Customers & CRM
- **RFM Loyalty Scoring Engine**: Automated customer scoring (0–100) based on total spend, order frequency, AOV, and account tenure.
- **Back-In-Stock Alerts**: Customer subscription tracking for out-of-stock items with 1-click broadcast notification.
- **Pre-Orders**: Pre-order product management with "Mark Available & Notify Subscribers" automation.
- **Fragrance Requests**: Customer wish-list submissions for unlisted perfumes.

### Data & Analytics
- **Google Analytics (GA4) & Search Console Integration**: Visual dashboards for Users, Page Views, Clicks, Impressions, Traffic Sources, and Top GSC Queries with CTR.
- **Conversion Funnel**: Multi-step e-commerce funnel tracking (Visit → Add to Cart → Checkout → Order) with drop-off analysis over 7/14/30/90-day windows.
- **Search Analytics**: Internal search query analysis — top terms, zero-result queries (missing products customers want), and search-to-click conversion rates.

### Marketing & Automations
- **Visual Email Campaign Editor**: WYSIWYG template builder with interactive catalog HTML generator for embedding product cards directly in newsletters.
- **Web Push Notifications**: Browser push broadcasting with title, message, link, thumbnail, and delivery history log.
- **Coupon Engine**: Advanced targeting rules — percentage/fixed discounts, expiration timers, allowed sizes/categories/brands/products/users, minimum order, influencer affiliation tracking.
- **Influencer & Affiliate Manager**: Campaign tracking with base salary, commission percentage, and dynamic payout calculation per influencer.
- **Visual Workflow Automations** (ReactFlow): Node-based drag-and-drop workflow editor with Trigger, Action, Logic/Condition, Wait, WaitUntil, Split (A/B), Merge, and Loop nodes.

### Content & Reviews
- **Review Moderation**: Approve/hide customer reviews, reply to feedback, and manage verified post-purchase review tokens.
- **Monthly Recommendations**: Featured perfume selection with scheduled broadcast date/time and campaign approval workflow.
- **Fragrance Dictionary**: Bilingual glossary of fragrance notes and terminology (Hebrew ↔ English).

### Site Design & Appearance
- **Hero Banner Editor**: Multi-slide banner manager supporting images & video backgrounds with interactive drag-and-drop focal point positioning and rich text overlay editor with separate desktop/mobile preview canvases.
- **Menu Management**: Customizable site navigation links and menu structure.
- **Announcement Bar, Popups, Logo, Maintenance Mode**: Full control over every visual element of the storefront.

### System & Monitoring
- **Database Monitor**: Real-time Neon PostgreSQL monitoring (active/idle connections, top queries, Compute Unit consumption charts).
- **System Status & Crons**: Health monitor with database connectivity, environment key status, and background cron job monitoring with manual "Run Now" buttons.
- **Comprehensive Logging**: Error logs, checkout error logs, audit logs (who/what/when/IP), email delivery logs, and pending email queue.
- **Database Migration Tool**: Admin interface for running schema migrations.

---

## 🛠️ Technical Sophistication

### Frontend & UX
- **Next.js 16 (App Router)**: Fine-grained Server Components with optimized Server Actions (10MB payload limit).
- **3D & Immersive Experiences**: Interactive 3D Spline scenes, Three.js rendering via `@react-three/fiber` and `@react-three/drei`.
- **Animation Stack**: GSAP for performance-critical animations, Framer Motion for declarative transitions, and custom scroll-triggered effects.
- **Hydration Guarding**: Advanced client-side rendering strategies to manage cross-timezone date synchronization without React hydration mismatches.
- **Accessibility Suite**: Custom WCAG-compliant widget (text resize, high contrast, readable fonts, monochrome, inverted colors, animation pause, reading guide bar) isolated from global CSS filters.
- **PWA Features**: Service worker registration for offline caching and Web Push notification support.
- **Premium Design System**: Glassmorphism, canvas confetti celebrations, typewriter text effects, and full bi-directional RTL support (Hebrew/English).

### Backend & Data
- **Neon Serverless Postgres**: Relational database with advanced JSONB usage, connection pooling (`pool`, `sql`, `withClient`), and 66 tables.
- **190 Serverless API Endpoints**: Comprehensive REST API covering admin, products, cart, orders, chat, analytics, search, recommendations, webhooks, and more.
- **Hebrew Search Engine**: Sophisticated Hebrew-to-English alias mapping system with 5-minute caching, allowing complex Hebrew queries to find English-indexed product data.
- **Rate Limiting**: Dual-layer protection — token bucket and sliding window rate limiters on API endpoints, plus middleware-level 60 req/min enforcement.
- **Email Infrastructure**: Nodemailer-powered transactional engine for cart recovery, review requests, educational sequences, monthly recommendations, and marketing campaigns with delivery logging.
- **Automated CRON Infrastructure** (12 scheduled jobs):
  - Abandoned cart recovery
  - Educational email sequences
  - Post-delivery review requests
  - Personalized product recommendations
  - Nurture email campaigns
  - SEO content generation bot
  - AI description quality reviews
  - Monthly recommendation broadcasts
  - Monthly discovery set campaigns
  - New perfume arrival notifications
  - Daily business summary reports
  - Shabbat email queue processing

### Security & Infrastructure
- **Role-Based Access Control (RBAC)**: Deep Clerk integration enforcing `admin`, `deputy`, `warehouse`, and `viewer` roles with client-side ViewerGuard and server-side `checkAdmin` / `checkCronOrAdmin` wrappers.
- **Edge Bot Blocking**: Middleware blocking aggressive scrapers (AhrefsBot, SemrushBot, GPTBot, CCBot, ByteSpider, and more) at the network edge.
- **Security Headers**: HSTS (2 years), X-Frame-Options, X-Content-Type-Options, strict Content-Security-Policy, and Referrer-Policy.
- **HTTPS & Domain Enforcement**: Automatic redirect to `https://www.ml-tlv.com` in production.
- **Maintenance Mode**: Dynamic toggle with admin bypass cookie and `/admin` path exclusion.
- **Cloudflare CDN & DNS**: Global content delivery, DNS management, DDoS protection, and edge caching for static assets and media.
- **Full Observability**: Triple-stack monitoring — **Sentry** (error tracking & Vercel cron instrumentation), **Microsoft Clarity** (session recording & heatmaps), and **GA4** (traffic analytics).
- **Audit Trail**: Every admin action logged with user identity, action type, entity ID, IP address, and user-agent.

---

## 📂 Architecture Overview

```bash
ml-tlv/app/
├── app/
│   ├── admin/              # 35+ Admin Dashboard Pages
│   ├── api/                # 190 Serverless API Endpoints
│   ├── blog/               # SEO-Optimized Fragrance Magazine
│   ├── brands/             # Brand Directory & Brand Pages
│   ├── bundles/            # Custom Bundle Builder
│   ├── cart/               # Shopping Cart Management
│   ├── catalog/            # Product Catalog & User Catalogs
│   ├── checkout/           # Checkout Flow & Order Confirmation
│   ├── components/         # 106 UI Components (3D, GSAP, AI Chat, Games)
│   ├── contact/            # Customer Support & Contact
│   ├── context/            # React Contexts (Cart, Language, Wishlist, Brand)
│   ├── data/               # i18n Locales, FAQ, Chatbot Knowledge Base
│   ├── discovery-sets/     # Discovery Sets & Official Samples
│   ├── hooks/              # Custom React Hooks
│   ├── inbox/              # Real-time Customer Support Chat
│   ├── lib/                # Core Logic (DB, Email, AI, Rate Limiting, Auth)
│   ├── lottery/            # Gamified Spin-and-Win System
│   ├── matching/           # AI Fragrance Matching Wizard
│   ├── my-catalogs/        # User Catalog Dashboard
│   ├── orders/             # Order History & Tracking
│   ├── product/            # Product Detail Pages (PDP)
│   ├── reviews/            # Customer Reviews Gallery
│   ├── sales/              # Sale & Special Offers
│   ├── wishlist/           # User Favorites
│   └── ...                 # Auth, Legal, Accessibility, Maintenance
├── components/             # Shared Root Components
├── lib/                    # Root Utilities (cn helper)
├── migrations/             # Database Schema Migrations
├── middleware.js            # Edge: Auth, Bot Blocking, Rate Limiting, HTTPS
├── next.config.mjs          # Security Headers, Sentry, Image Optimization
└── vercel.json              # 12 Automated Cron Job Schedules
```

---

## 🔧 Deployment & Setup

1. **Clone & Install**: `npm install` inside `/app`.
2. **Environment**: Configure `.env.local` with:
   - `DATABASE_URL` — Neon PostgreSQL connection string
   - Clerk authentication keys
   - SMTP credentials (Nodemailer)
   - Spotify API credentials
   - Google Generative AI (Gemini) API key
   - Sentry DSN
   - Google Analytics & Search Console IDs
3. **Database**: Run migrations via `/admin/migrate` or migration scripts.
4. **Development**: `npm run dev` (launches on `localhost:3000`).
5. **Production**: Push to `main` branch — Vercel auto-deploys with cron job activation.

---

<div align="center">

**Crafted with excellence for ml_tlv**  
**Luxury Perfume Decants | Tel Aviv | Next.js 16**

</div>