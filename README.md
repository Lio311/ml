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
- **Smart Upsell**: Suggests complementary products in the cart based on user history.
- **Abandoned Cart Recovery**: Automatic email system with unique coupon generation to recover lost sales.

### 🎲 Interactive Games (Lottery)
- **7 Mini-Games**: Roulette, Slot Machine, Chicken Shooter, Truth or Dare, Speed Game, Memory Cards, and Shell Game.
- **Smart Logic**:
    - **Budget Control**: Set a budget (100-1500 ₪).
    - **Value Guarantee**: Always receive 15% more value than paid.
    - **Mystery Unboxing**: Interactive reveal of your curated perfume bundle.

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
- **Coupon Management**: Create, track, and expire discount codes.
- **Bestsellers Algorithm**: Auto-updates "Popular" sorting based on real sales data.

### 🎨 Visual & UX Excellence
- **Accessibility**: Built-in widget for font resizing, high contrast, and readable fonts.
- **Design System**: Glassmorphism, "Dancing Script" typography, and premium animations.
- **Smart Search**: Real-time autocomplete search bar in the header.
- **Responsive**: Mobile-first design optimized for all devices.

### 📈 Advanced SEO Engine
- **Dynamic Metadata**: 
    - Auto-generates unique `<title>` and `<meta>` tags for every Brand and Category page (e.g., "בשמי Xerjoff | ml_tlv").
    - "Smart Logic" for edge cases (e.g., "בשמים שאין בארץ").
- **Sitemap 2.0**: 
    - Automatically maps hundreds of dynamic URLs (Products, Brands, Categories) for Google.
- **Rich Snippets (Schema.org)**:
    - **Product Schema**: Price, Stock, and Description data for Google Shopping results.
    - **Organization Schema**: Identity card for the business (Location, Logo, Support) in the Knowledge Graph.
- **Canonicalization**: Prevents duplicate content penalties for filtered pages.

---

## 🛠️ Technical Stack

- **Frontend**: Next.js 14 (App Router), React, Framer Motion
- **Styling**: Tailwind CSS, PostCSS
- **Database**: PostgreSQL (via `pg` pool)
- **Authentication**: Clerk (`@clerk/nextjs`)
- **Email**: Nodemailer (Gmail SMTP)
- **Localization**: RTL support with Hebrew optimization

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