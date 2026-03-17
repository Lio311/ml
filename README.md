# 💎 ml_tlv - The Ultimate Luxury Perfume Ecosystem

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black?logo=next.js)](https://nextjs.org/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/) [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-336791?logo=postgresql)](https://www.postgresql.org/) [![Clerk](https://img.shields.io/badge/Authentication-Clerk-6C47FF?logo=clerk)](https://clerk.com/)

A high-performance, enterprise-grade Israeli commerce platform designed for the luxury perfume decant industry. Beyond a simple shop, **ml_tlv** is a multi-tenant ecosystem combining algorithmic bundling, virtual store creation, and real-time operational tools.

---

## 🚀 Key Innovation Pillars

### 🏪 Virtual Stores (Multi-Tenant Architecture)
- **Storefront-as-a-Service**: Users can create personalized "Virtual Catalogs" with custom branding, unique slugs (`ml-tlv.com/catalog/your-name`), and curated item selections.
- **Independent Management**: Store owners receive dedicated dashboards to manage their unique offerings and receive direct order notifications.
- **Branded Experience**: Support for custom logos, descriptions, and direct contact integration.

### 🧪 Algorithmic & Gamified Commerce
- **Smart Matching Wizard**: A data-driven questionnaire that analyzes top, middle, and base notes to build the "Perfect Bundle" based on user taste and budget.
- **Lottery & Games**: 7 high-fidelity mini-games (Roulette, Slot Machine, Shell Game, etc.) with built-in **Value Protection Logic**—ensuring every player receives 15% more value in products than their entry fee.
- **Dynamic Upsell Engine**: Real-time cart analysis that prioritizes Wishlist items and recently viewed products for personalized recommendations.

### 💬 Unified Communication Center (Inbox 2.0)
- **Multi-Role Presence**: High-precision real-time chat connecting Customers, Catalog Owners, and Site Admins.
- **Localized Presence**: Pulsing status indicators with localized "Available Now" or precise "Last Seen" timestamps synchronized across timezones.
- **Order Contextualization**: Chat threads automatically embed order status timelines and product previews for friction-less support.

### 📊 Operational Excellence (Admin Dashboard)
- **Predictive Inventory**: An advanced forecasting engine that calculates daily consumption rates (30-day window) to predict exactly when bottle supplies (2ml, 5ml, 10ml) will deplete.
- **Financial Intelligence**: Real-time Profit/Loss tracking, including COGS (Cost of Goods Sold) calculation, monthly expense balancing, and cumulative net profit analysis.
- **Traffic Observability**: Real-time unique visitor monitoring with bot-filtering logic for clean analytics.
- **Review Curation**: Verified-purchase linked review system with global aggregate stats and administrative moderation tools.

---

## 🛠️ Technical Sophistication

### Frontend & UX
- **Next.js 15 (App Router)**: Utilizing fine-grained Server Components and optimized Server Actions.
- **Accessibility Suite**: A custom, WCAG-compliant accessibility widget that remains isolated from global CSS filters (Invert/Contrast).
- **Premium Design System**: Glassmorphism, tailored Framer Motion animations, and bi-directional RTL support.

### Backend & Data
- **Postgres (Neon)**: Relational database with advanced JSONB usage for flexible order tracking and complex schema constraints.
- **Search Optimization Engine**: A sophisticated Hebrew-to-English alias mapping system allowing complex Hebrew queries to find English-indexed product data.
- **Abandoned Cart Recovery**: Automated CRON infrastructure sending personalized recovery emails with platform-generated unique coupons.

### Security & Infrastructure
- **Role-Based Access Control (RBAC)**: Deep integration with Clerk to enforce permissions for `admin`, `deputy`, and `warehouse` roles.
- **Edge Security**: Custom middleware blocking commercial scrapers and malicious crawlers at the network edge.
- **Full Observability**: Triple-stack monitoring with **Sentry** (Error tracking), **Microsoft Clarity** (Behavioral), and **GA4** (Traffic).

---

## 📂 Architecture Overview

```bash
ml/
├── app/
│   ├── admin/              # Financial Dashboards & Inventory Forecasting
│   ├── my-catalogs/        # Virtual Store Creation & Management
│   ├── matching/           # Algorithmic Perfume Matching Wizard
│   ├── lottery/            # Gamified Mystery Bundle System
│   ├── inbox/              # Multi-Role Real-time Communication
│   ├── blog/               # SEO-Optimized CMS Magazine
│   ├── components/         # High-End Shared UI (Sarah AI, Header, Games)
│   └── lib/                # Core Logic (DB Pooling, Encryption, Mailer)
```

---

## 🔧 Deployment & Setup

1. **Clone & Install**: `npm install` inside `/app`.
2. **Environment**: Configure `.env.local` with DATABASE_URL, Clerk keys, and SMTP credentials.
3. **Database Maintenance**: Use `tmp/repair_db_final.js` for initial schema enforcement.
4. **Development**: `npm run dev`.

---

<div align="center">

**Crafted with excellence for ml_tlv**  
**Luxury Perfume Decants | Tel Aviv | Next.js 15**

</div>