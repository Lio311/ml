# 💎 ml_tlv - Luxury Perfume Decants & Smart Commerce

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?logo=next.js)](https://nextjs.org/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/) [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-336791?logo=postgresql)](https://www.postgresql.org/) [![Clerk](https://img.shields.io/badge/Authentication-Clerk-6C47FF?logo=clerk)](https://clerk.com/)

An advanced, full-stack Israeli commerce platform specializing in niche and boutique perfume decants. This project combines a premium shopping experience with sophisticated real-time communication and management tools.

---

## 🌟 Premium Features

### 🛒 Advanced Commerce Engine
- **Dynamic Cart & Bonus System**: Real-time total calculation with a layered bonus system (up to 6 free samples).
- **Smart Cart Sharing**: Persistence-backed short URLs for seamless cross-device cart sharing.
- **Abandoned Cart Recovery**: Automated CRON tasks send personalized recovery emails with unique 5% discount coupons.
- **Inventory Precision**: Real-time ml-level stock tracking across multiple decant sizes (2ml to 10ml).

### 💬 Real-time Communication Hub (Inbox 2.0)
- **Multi-Role Messaging**: Integrated chat system connecting Customers, Sales Representatives (Catalogs), and Platform Administrators.
- **Presence & "Last Seen"**: High-accuracy presence tracking with "Available Now" pulsing indicators and precise localized "Last Seen" timestamps.
- **Order-Linked Conversations**: Context-aware chat threads automatically show current order status timelines and item previews.
- **Mobile Optimized**: Responsive chat interface with dynamic bubble sizing and layout adjustments for clear readability on all devices.

### ⭐️ Intelligent Reviews Engine
- **Automated Engagement**: Precise triggers prompt users for reviews once orders reach "Completed" status.
- **Interactive Ratings**: Sleek, Lucide-indexed star rating selector with responsive feedback.
- **Dynamic Social Proof**: The public `/reviews` page features real-time calculated statistics:
  - **Verified Purchase Badges**: Trust-building indicators for confirmed customers.
  - **Live Aggregate Stats**: Average rating and total counts updated on the fly.
- **Admin Curation Dashboard**: Comprehensive interface for administrators to Moderate (Hide/Show) or Permanently Delete reviews.

### 🎲 Gamified Engagement (Lottery)
- **7 Built-in Mini-Games**: Roulette, Slot Machines, Shell games, and more.
- **Value Optimization**: Smart logic ensures users always receive bundles worth 15% more than their entry fee.
- **Interactive Mystery Reveal**: A high-end unboxing experience for curated fragrance bundles.

### 🛡️ Admin Command Center
- **Advanced Identity Management**: Role-based access control (Admin, Deputy, Warehouse, Customer) with advanced search (Clerk ID, Email, Phone).
- **Pro Dictionary Mapping**: Smart Hebrew-to-English alias mapping for searching fragrances across languages.
- **Revenue Dashboard**: Real-time KPIs including active carts, revenue metrics, and monthly visit trends.
- **Coupons & Promotions**: Granular control over discount categories, expiration, and user-targeted coupons.

---

## 🏗️ Technical Stack

### Core
- **Next.js 15 (App Router)**: Utilizing server actions and streaming for high performance.
- **React 19**: Modern component architecture with localized state management.
- **PostgreSQL (Neon)**: Relational data storage with robust schema constraints and optimized pooling.
- **Clerk Auth**: Enterprise-grade identity management with custom public metadata roles.

### UI/UX
- **Tailwind CSS**: Utility-first styling for a premium, consistent design language.
- **Framer Motion**: Smooth micro-interactions and page transitions.
- **Lucide React**: High-quality vector iconography used site-wide.
- **React Hot Toast**: Real-time UI feedback and notifications.

### Observability & Infrastructure
- **Sentry**: Critical error monitoring and performance tracing.
- **Microsoft Clarity**: Visual behavioral session recordings.
- **Google Analytics 4**: Deep traffic and conversion analytics.
- **Nodemailer**: Automated SMTP delivery system for order updates and recovery.

---

## 📂 Project Architecture

```
ml/
├── app/
│   ├── admin/              # Management Dashboards & Live Stats
│   ├── api/                # Robust Backend (Orders, Inbox, Webhooks)
│   ├── components/         # Premium UI Components (Chat, Header, Reviews)
│   ├── context/            # Global State (Cart, Wishlist)
│   ├── lib/                # Shared Utilities (DB Pool, Helper functions)
│   └── reviews/            # Public Customer Feedback System
├── public/                 # Optimized Static Assets (High-Res Logos)
├── scripts/                # Utility & Maintenance Scripts
└── tmp/                    # Database Migration & Schema Repair tools
```

---

## 🔧 Installation & Setup

1. **Clone the project**
   ```bash
   git clone https://github.com/Lio311/ml.git
   cd ml/app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file with the following keys:
   - `DATABASE_URL`: PostgreSQL connection string.
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk access key.
   - `CLERK_SECRET_KEY`: Clerk backend secret.
   - `ADMIN_EMAIL`: Master admin identification.
   - `EMAIL_USER`/`PASS`: SMTP credentials for automated notifications.

4. **Start Development**
   ```bash
   npm run dev
   ```

---

<div align="center">

**Developed with precision for ml_tlv**  
**Luxury Niche Fragrances | Tel Aviv, Israel**

</div>