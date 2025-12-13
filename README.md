# 💎 ml_tlv - Luxury Perfume Decants

[![Next.js](https://img.shields.io/badge/Next.js-14.0-black)](https://nextjs.org/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC)](https://tailwindcss.com/) [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-336791)](https://www.postgresql.org/)

The ultimate Israeli destination for niche & boutique perfume samples (decants).
- **Exclusive Collections**: Curated selection of high-end brands like Xerjoff, Roja, Creed, and more.
- **Authentic Experience**: 100% original fragrances decanted into high-quality 2ml, 5ml, and 10ml bottles.

### 🛍️ Shopping Experience
- **Smart Cart**: Dynamic shopping cart with real-time updates.
- **Tiered Bonuses**: Automatic free sample rewards based on cart value.
- **Wishlist**: Save your favorite scents for later.
- **Secure Checkout**: Streamlined order process.

### 🎨 User Interface
- **Modern Design**: Clean, minimalist, and luxury-focused aesthetic.
- **Mobile First**: Fully responsive layout optimized for all devices.
- **Multi-language**: Partial support for Hebrew, English, and Russian.
- **Accessibility**: RTL support and clear navigation.

---

## 🚀 Quick Start

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ml.git
   cd ml/app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up Environment Variables**
   Create a `.env.local` file with the following:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   POSTGRES_URL=postgres://...
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-app-password
   ```

4. **Run the application**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   The app will automatically open at `http://localhost:3000`

---

## 📁 Project Structure

```
ml/
├── app/
│   ├── admin/              # Admin dashboard pages
│   ├── api/                # Backend API routes (Orders, Users)
│   ├── cart/               # Shopping cart logic
│   ├── catalog/            # Product listing and filtering
│   ├── components/         # Reusable UI components (Header, ProductCard)
│   ├── context/            # Global state context (CartContext)
│   ├── orders/             # User order history
│   └── layout.js           # Root layout and providers
├── public/                 # Static assets (images, icons)
├── scripts/                # Database migration and setup scripts
└── package.json            # Project dependencies
```

---

## 🛠️ Technical Stack

- **Frontend**: Next.js 14 (App Router), React
- **Styling**: Tailwind CSS, PostCSS
- **Database**: PostgreSQL (via `pg` pool)
- **Authentication**: Clerk (`@clerk/nextjs`)
- **Localization**: Google Translate (Cookie-based integration)
- **Deployment**: Vercel ready

---

## 🎯 Key Features

### 🛒 Dynamic Cart & Bonuses
- Real-time total calculation.
- **Bonus Logic**:
    - Over 300 ₪: 2 Free Samples
    - Over 500 ₪: 4 Free Samples
    - Over 1000 ₪: 6 Free Samples

### 📦 Inventory Management
- **Stock Tracking**: Precise milliliter-based stock management (Tracking total ML available).
- **Auto-Block**: Prevents adding items to cart if stock is insufficient.
- **Admin Controls**: Easy stock updates directly from the product edit page.

### 👑 Admin Dashboard
- **Product Management**: Create, edit, and delete products with stock control.
- **Brands Management**: Manage brand logos and details.
- **View Orders**: Comprehensive table with status management.
- **Localised Statuses**: Hebrew status tracking (Pending, Processing, Shipped).

### 🔍 Product Catalog
- **Smart Filtering**: Multi-select support for Brands and Categories.
- **Search**: Fast text-based search for products.
- **Detailed Views**: High-quality images, descriptions, and stock status.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/NewFeature`)
3. Commit your changes (`git commit -m 'Add NewFeature'`)
4. Push to the branch (`git push origin feature/NewFeature`)
5. Open a Pull Request

---

<div align="center">

**Made with ❤️ for ml_tlv**

**Premium Niche Perfumes | Tel Aviv**

</div>
