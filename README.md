# 💎 ml_tlv - Luxury Perfume Decants

[![Next.js](https://img.shields.io/badge/Next.js-14.0-black)](https://nextjs.org/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC)](https://tailwindcss.com/) [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-336791)](https://www.postgresql.org/)

The ultimate Israeli destination for niche & boutique perfume samples (decants).
- **Exclusive Collections**: Curated selection of high-end brands like Xerjoff, Roja, Creed, and more.
- **Authentic Experience**: 100% original fragrances decanted into high-quality 2ml, 5ml, and 10ml bottles.

---

## 🚀 Key Features

### 🛍️ Smart Shopping Experience
- **Dynamic Cart**: Real-time total calculation with automatic bonus updates.
- **Smart Bonuses System**:
    - Over 300 ₪: 2 Free Samples 🎁
    - Over 500 ₪: 4 Free Samples 🎁🎁
    - Over 1000 ₪: 6 Free Samples 🎁🎁🎁
- **Order Notes**: Add special requests directly in the cart (e.g., gift wrapping, delivery notes).
- **Stock Management**: Prevents ordering out-of-stock items with precise ml tracking.
- **Smart Upsell Engine**: 
    - AI-driven recommendation logic that pushes users to add more items.
    - **Prioritization Algorithm**: 1. `Wishlist Items` → 2. `Recently Viewed Items` → 3. `Bestsellers`.
- **Smart Cart Sharing**:
    - **Short Links**: Generates clean, database-backed URLs (e.g., `ml-tlv.com/cart?share=UUID`) instead of long encoded strings.
    - **Universal Loading**: Works seamlessly for new users ('Cold Start'), showing a dedicated banner even if their current cart is empty.
- **Abandoned Cart Recovery (CRON)**: 
    - Automated background task detecting inactive carts (1h+).
    - Sends a personalized recovery email containing a **unique 5% discount coupon** to incentivize completion.
- **Smart Delivery Notifications**: Fully automated email dispatch system for every status change (Order Received -> Processing -> Shipped with Tracking).

### 🎲 Interactive Games (Lottery)
- **7 Mini-Games**: Roulette, Slot Machine, Chicken Shooter, Truth or Dare, Speed Game, Memory Cards, and Shell Game.
- **Smart Logic**:
    - **Budget Control**: Set a budget (100-1500 ₪).
    - **Value Guarantee**: Always receive 15% more value than paid.
    - **Mystery Unboxing**: Interactive reveal of your curated perfume bundle.

- [ ] **Marketing Automation & Analytics**
    - [x] Google Analytics 4 Integration
    - [x] Microsoft Clarity Integration
    - [x] Sentry Error Tracking Integration
    - [ ] Newsletter subscription popup (10% off)
    - [ ] "Frequently Bought Together" algorithm

### 🛡️ Analytics & Security Suite
- **Live Visitor Counter**:
    - **Real-Time Tracking**: Database-backed counter showing active unique visitors (5 min window).
    - **Visual Indicator**: Pulsing green badge in the top bar implies high traffic.
    - **Bot Filtering**: Smart logic filters out crawlers (Google, Bing) to show only human users.
- **Bot Protection (Middleware)**:
    - **Aggressive Blocker**: Automatically blocks harmful commercial scrapers (Ahrefs, Semrush, MJ12) at the edge.
- **Full Observability Stack**:
    - **Google Analytics 4**: Traffic sources and conversion tracking.
    - **Microsoft Clarity**: Session recordings and heatmaps.
    - **Sentry**: Real-time error monitoring and performance tracing.

### 🤖 AI Support Chatbot ("Sarah")
- **Smart Assistance**: Answers FAQs about tracking, shipping, and originality.
- **Product Recommendations**: Analyzes user preferences to suggest scents.
- **Return Logic**: Handles return policy queries with interactive options.
- **Persona**: Rotates daily personas to keep interactions fresh.

### 📊 Advanced Analytics & Admin
- **Live Dashboard**:
    - Real-time KPIs: Revenue, Samples Sold, Active Carts.
    - Monthly Site Visits Tracker.
    - Registered Users Counter.
- **Order Management**: Full CRUD for orders with Hebrew status tracking (Pending, Processing, Shipped).
- **Pro Dictionary Management**:
    - **Hebrew Mapping**: Advanced alias system mapping Hebrew searches ("בושם יקר") to English DB queries.
    - **Bulk Editing**: Optimized UI for managing hundreds of aliases.
- **Pro Brands Management**:
    - **Pagination**: Client-side pagination (10/page) for better performance.
    - **A-Z Filtering**: Interactive alphabet sort bars across the admin panel.
- **Coupon Management 2.0**: 
    - **Full Control**: Create, edit, and expire discount codes.
    - **Targeted Logic**: Assign coupons to specific client emails for personalized offers.
    - **Status Tracking**: Visual indicators for Active/Redeemed/Expired coupons.
- **Bestsellers Algorithm**: Auto-updates "Popular" sorting based on real sales data.

### 🎨 Visual & UX Excellence
- **Accessibility 2.0 (Pro)**: 
    - **Isolated Architecture**: Widget UI is immune to site-wide filters (Contrast/Invert).
    - **WCAG Compliant Tools**: Text scale, Readable Font, Highlight Links/Headers, Reading Guide.
    - **Dedicated Page**: Full Accessibility Statement (`/accessibility`).
- **Design System**: Glassmorphism, "Dancing Script" typography, and premium animations.
- **Smart Search**: Real-time autocomplete search bar with **bi-directional RTL support** and Hebrew mapping.
- **Responsive**: Mobile-first design optimized for all devices with "Mobile Hero" optimization.

### 📈 Advanced SEO Engine
- **Dynamic Metadata**: 
    - Auto-generates unique `<title>` and `<meta>` tags for every Brand and Category page.
- **Hebrew Optimization**:
    - **Alt Text Strategy**: Database support for `name_he` to generate `English Name - Hebrew Name` alt tags.
    - **Breadcrumbs Schema**: JSON-LD structured data for rich search results.
- **Sitemap 2.0**: 
    - Automatically maps hundreds of dynamic URLs (Products, Brands, Categories) for Google.
- **Rich Snippets (Schema.org)**:
    - **Product Schema**: Price, Stock, and Description data for Google Shopping results.
    - **Organization Schema**: Identity card for the business in the Knowledge Graph.
- **Canonicalization**: Prevents duplicate content penalties for filtered pages.

---

## 🛠️ Technical Stack

- **Frontend**: Next.js 14 (App Router), React, Framer Motion
- **Styling**: Tailwind CSS, PostCSS
- **Database**: PostgreSQL (via `pg` pool)
- **Authentication**: Clerk (`@clerk/nextjs`)
- **Email**: Nodemailer (Gmail SMTP)
- **Localization**: RTL support with Hebrew optimization
- **Background Tasks**: CRON Jobs (Vercel Cron) for Cart Recovery & Analytics Sync

---

## 📁 Project Structure

```
ml/
├── app/
│   ├── admin/              # Admin dashboard & Analytics
│   ├── api/                # Backend API routes (Orders, Sync, Recovery)
│   ├── cart/               # Shopping cart & Checkout Logic
│   ├── catalog/            # Product listing with Smart Sorting
│   ├── components/         # Chatbot, Header, Games, UI Elements
│   ├── context/            # CartContext & AuthContext
│   ├── data/               # Static Data (Chatbot Brain)
│   └── lib/                # DB Connection & Email Utils
├── public/                 # Static assets
└── scripts/                # Database setup scripts
```

---

## 🚀 Quick Start

1. **Clone & Install**
   ```bash
   git clone https://github.com/Lio311/ml.git
   cd ml/app
   npm install
   ```

2. **Environment Setup**
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   DATABASE_URL=postgres://...
   EMAIL_USER=...
   EMAIL_PASS=...
   ```

3. **Run Locally**
   ```bash
   npm run dev
   ```

---

<div align="center">

**Made with ❤️ for ml_tlv**

**Premium Niche Perfumes | Tel Aviv**

</div>