# 🌾 FarmConnect

> A modern farmers-to-buyers agricultural marketplace built with Django REST Framework and React.js

FarmConnect connects smallholder farmers in Uganda directly with buyers, eliminating middlemen and ensuring fair prices for everyone. Farmers list their produce, buyers browse and order, and AI tools help farmers write better listings and understand their sales.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Frontend Routes](#frontend-routes)
- [User Roles](#user-roles)
- [AI Features](#ai-features)
- [Real-Time Notifications](#real-time-notifications)
- [Screenshots](#screenshots)

---

## ✨ Features

### For Farmers
- 📦 **Product Management** — Add, edit, hide, and delete product listings with image uploads
- 📋 **Order Management** — View incoming orders and advance them through a status flow
- ✨ **AI Description Generator** — Let AI write compelling product descriptions
- 💰 **AI Price Suggestion** — Get min/recommended/max price based on market data
- 📊 **AI Insights** — 30-day sales analysis with plain-English advice
- 🖨️ **Print Order Summaries** — Printable/PDF receipts for every order

### For Buyers
- 🛒 **Product Catalog** — Browse, search, filter by category/price, sort listings
- ⭐ **Star Ratings** — See average ratings from other buyers on product cards
- 🛒 **Cart** — Persistent cart (survives page refreshes) with quantity controls
- 📦 **Checkout** — Place orders with cash-on-delivery, grouped by farmer
- 📍 **Order Tracking** — Real-time status updates from farmer
- ✍️ **Reviews** — Leave star ratings on delivered orders
- 🖨️ **Print Order Summaries** — Printable/PDF receipts for every order

### For Admins
- 👥 **User Management** — View, search, activate/deactivate, delete users
- 📦 **Product Moderation** — View and remove any listing platform-wide
- 📋 **Order Overview** — See every order on the platform with status filters
- 📊 **Platform Stats** — Total users, farmers, buyers, active/inactive, new this week

### Platform-wide
- 🔔 **Real-Time Notifications** — Instant WebSocket push notifications for order events
- 💬 **AI Chatbot** — Context-aware assistant for both farmers and buyers
- ✏️ **Profile Management** — Edit personal details, farm info, delivery address
- 🔐 **Secure JWT Auth** — Access token in memory + HttpOnly refresh cookie

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 4.2 + Django REST Framework 3.15 |
| Authentication | JWT via `djangorestframework-simplejwt` |
| Real-time | Django Channels 4.0 (WebSockets) |
| AI | Google Gemini 2.0 Flash API (free tier) |
| Frontend | React 18 + Vite 5 |
| Styling | Tailwind CSS 3 with custom design system |
| Icons | Lucide React |
| State | Zustand (auth + cart) |
| HTTP Client | Axios with auto token-refresh interceptor |
| Database | SQLite (dev) → PostgreSQL (production) |
| Fonts | Plus Jakarta Sans + Syne (Google Fonts) |

---

## 📁 Project Structure

```
farmconnect/
├── backend/
│   ├── apps/
│   │   ├── accounts/          # Users, auth, profiles, admin management
│   │   ├── products/          # Product listings, categories
│   │   ├── orders/            # Orders, order items, reviews
│   │   ├── ai/                # Gemini API integration
│   │   └── notifications/     # WebSocket consumer, notification model
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py        # Shared settings
│   │   │   └── development.py # Dev overrides
│   │   ├── urls.py            # Root URL configuration
│   │   └── asgi.py            # ASGI config (HTTP + WebSocket)
│   ├── manage.py
│   ├── requirements.txt
│   └── .env                   # ← create this (see below)
│
└── frontend/
    ├── src/
    │   ├── api/               # Axios modules per feature
    │   │   ├── axios.js       # Base client + JWT interceptor
    │   │   ├── authApi.js
    │   │   ├── productsApi.js
    │   │   ├── ordersApi.js
    │   │   ├── aiApi.js
    │   │   ├── adminApi.js
    │   │   └── notificationsApi.js
    │   ├── components/
    │   │   ├── AppLayout.jsx  # Sidebar + header (shared layout)
    │   │   ├── ChatWidget.jsx # Floating AI chat bubble
    │   │   ├── NotificationBell.jsx
    │   │   ├── OrderSummary.jsx
    │   │   ├── RouteGuards.jsx
    │   │   └── ui/index.jsx   # Design system components
    │   ├── hooks/
    │   │   ├── useAuth.js
    │   │   └── useNotifications.js
    │   ├── pages/
    │   │   ├── auth/          # LoginPage, RegisterPage
    │   │   ├── dashboard/     # FarmerDashboard, BuyerDashboard
    │   │   ├── farmer/        # ProductsManage, OrdersManage, FarmerInsights
    │   │   ├── buyer/         # ProductCatalog, CartPage, CheckoutPage, BuyerOrders
    │   │   ├── admin/         # AdminDashboard
    │   │   └── profile/       # EditProfile
    │   ├── store/
    │   │   ├── authStore.js   # Zustand auth state
    │   │   └── cartStore.js   # Zustand cart (localStorage persist)
    │   ├── App.jsx            # Router + auth initialisation
    │   ├── main.jsx
    │   └── index.css          # Tailwind + custom CSS
    ├── package.json
    ├── vite.config.js         # Dev server with /api proxy
    └── tailwind.config.js
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- pip & npm

### 1. Clone or extract the project

```bash
cd C:\Users\YourName\Desktop   # or wherever you want it
# If using the setup script:
python setup_farmconnect.py
```

### 2. Backend setup

```bash
cd farmconnect/backend

# Create virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac / Linux

# Install packages
pip install -r requirements.txt

# Create .env file (see Environment Variables section below)

# Run migrations
python manage.py makemigrations accounts
python manage.py makemigrations products
python manage.py makemigrations orders
python manage.py makemigrations notifications
python manage.py migrate

# Create admin account
python manage.py shell
>>> from apps.accounts.models import User
>>> User.objects.create_superuser(
...     email="admin@farm.com",
...     password="admin123",
...     first_name="Admin",
...     last_name="User",
...     role="admin"
... )
>>> exit()

# Seed product categories
python manage.py shell
>>> from apps.products.models import Category
>>> from django.utils.text import slugify
>>> cats = [
...   ("Vegetables","🥦"), ("Fruits","🍎"), ("Grains & Cereals","🌾"),
...   ("Dairy & Eggs","🥛"), ("Poultry & Meat","🍗"), ("Fish & Seafood","🐟"),
...   ("Herbs & Spices","🌿"), ("Roots & Tubers","🥔"), ("Legumes & Beans","🫘"),
...   ("Honey & Bee Products","🍯"), ("Organic Produce","🌱"), ("Other","📦"),
... ]
>>> [Category.objects.get_or_create(name=n, defaults={"slug":slugify(n),"icon":i}) for n,i in cats]
>>> exit()

# Start the server
python manage.py runserver
```

Backend runs at **http://localhost:8000**

### 3. Frontend setup

Open a **new terminal**:

```bash
cd farmconnect/frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173**

### 4. Open the app

Go to **http://localhost:5173** in your browser.

---

## 🔑 Environment Variables

Create a file at `farmconnect/backend/.env`:

```env
SECRET_KEY=django-insecure-change-this-in-production-use-a-long-random-string
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
GEMINI_API_KEY=your-gemini-api-key-here
```

### Getting a free Gemini API key

1. Go to **https://aistudio.google.com**
2. Sign in with Google
3. Click **Get API Key** → **Create API key**
4. Copy the key (starts with `AIzaSy...`)
5. Paste it as `GEMINI_API_KEY` in your `.env`

> The free tier allows 1,500 requests/day and 15 requests/minute — more than enough for development and demos.

---

## 📡 API Reference

All endpoints are prefixed with `/api/v1/`. All authenticated endpoints require:
```
Authorization: Bearer <access_token>
```

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register/` | No | Register a new farmer or buyer |
| POST | `/auth/login/` | No | Login — returns access token + sets refresh cookie |
| POST | `/auth/logout/` | Yes | Blacklist refresh token and clear cookie |
| POST | `/auth/refresh/` | No | Get new access token using refresh cookie |
| GET | `/auth/me/` | Yes | Get current user profile |
| PATCH | `/auth/me/update/` | Yes | Update profile details |
| POST | `/auth/change-password/` | Yes | Change password |

### Admin

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/auth/admin/stats/` | Admin | Platform stats |
| GET | `/auth/admin/users/` | Admin | List all users (`?search=` `?role=`) |
| PATCH | `/auth/admin/users/<id>/update/` | Admin | Update user role/status |
| DELETE | `/auth/admin/users/<id>/delete/` | Admin | Delete a user |
| POST | `/auth/admin/users/<id>/toggle/` | Admin | Toggle active/inactive |

### Products

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/products/` | No | Public catalog (`?search=` `?category=` `?min_price=` `?max_price=` `?ordering=`) |
| GET | `/products/<id>/` | No | Product detail (increments view count) |
| GET | `/products/categories/` | No | All categories with product counts |
| GET | `/products/my-listings/` | Farmer | Farmer's own listings |
| POST | `/products/my-listings/` | Farmer | Create product (`multipart/form-data`) |
| PATCH | `/products/my-listings/<id>/` | Farmer | Update product |
| DELETE | `/products/my-listings/<id>/` | Farmer | Delete product |
| POST | `/products/my-listings/<id>/toggle/` | Farmer | Toggle availability |

### Orders

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/orders/` | Buyer | Place order (atomic, one order per farmer) |
| GET | `/orders/buyer/` | Buyer | Buyer's orders (`?status=`) |
| GET | `/orders/farmer/` | Farmer | Farmer's received orders (`?status=`) |
| GET | `/orders/all/` | Admin | All platform orders (`?status=`) |
| GET | `/orders/<id>/` | Buyer or Farmer | Single order detail |
| PATCH | `/orders/<id>/status/` | Farmer | Advance order status |
| POST | `/orders/<id>/cancel/` | Buyer | Cancel pending order |
| POST | `/orders/review/` | Buyer | Submit review (`order_id`, `product_id`, `rating`, `comment`) |
| GET | `/orders/reviews/<product_id>/` | No | All reviews for a product |

### AI

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/ai/generate-description/` | Farmer | `{ name, category, quantity, unit }` | AI-written product description |
| POST | `/ai/price-suggest/` | Farmer | `{ name, category, unit, quantity }` | Min/recommended/max price range |
| POST | `/ai/chat/` | Yes | `{ message, history }` | Context-aware chatbot reply |
| GET | `/ai/insights/` | Farmer | — | 30-day AI sales analysis |

### Notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/notifications/` | Yes | List notifications with unread count |
| POST | `/notifications/read-all/` | Yes | Mark all as read |
| DELETE | `/notifications/clear/` | Yes | Delete all notifications |
| POST | `/notifications/<id>/read/` | Yes | Mark one as read |
| WS | `ws://localhost:8000/ws/notifications/?token=<jwt>` | JWT query param | Real-time push channel |

---

## 🗺 Frontend Routes

| Route | Role | Page |
|---|---|---|
| `/login` | Public | Login form |
| `/register` | Public | Two-step registration |
| `/farmer/dashboard` | Farmer | Stats + quick actions |
| `/farmer/products` | Farmer | Product CRUD with AI tools |
| `/farmer/orders` | Farmer | Incoming orders + status management |
| `/farmer/insights` | Farmer | AI-powered sales insights |
| `/buyer/dashboard` | Buyer | Order stats + quick links |
| `/buyer/products` | Buyer | Product catalog + search + cart |
| `/buyer/cart` | Buyer | Cart review + checkout button |
| `/buyer/checkout` | Buyer | Order confirmation + address + place order |
| `/buyer/orders` | Buyer | Order tracking + reviews + print |
| `/admin/dashboard` | Admin | Users / Products / Orders tabs |
| `/profile/edit` | Any | Edit profile + change password |

---

## 👤 User Roles

| Role | How to Create | Access |
|---|---|---|
| **Farmer** | Public registration form | Product listings, orders, AI tools |
| **Buyer** | Public registration form | Catalog, cart, checkout, reviews |
| **Admin** | Django shell only | Full platform management |

> The Admin role is intentionally **never available** on the public registration form. Create admin accounts via `python manage.py shell` only.

---

## 🤖 AI Features

All AI features require a `GEMINI_API_KEY` in `.env`. Uses **Gemini 2.0 Flash** (free tier).

| Feature | Where | How to Use |
|---|---|---|
| **Auto Description** | Add/Edit Product | Enter product name → click **Write with AI** |
| **Price Suggestion** | Add/Edit Product | Enter product name → click **✨ AI** in price field |
| **AI Chatbot** | All pages | Click **💬** bubble (bottom-right corner) |
| **AI Insights** | Farmer sidebar | Click **AI Insights** in the sidebar |

---

## 🔔 Real-Time Notifications

Uses Django Channels with `InMemoryChannelLayer` (development).

**Events that trigger notifications:**

| Event | Recipient | Message |
|---|---|---|
| Buyer places order | Farmer | "New Order Received! 🎉" |
| Farmer confirms order | Buyer | "Order Confirmed ✅" |
| Farmer packs order | Buyer | "Order Packed 📦" |
| Farmer dispatches order | Buyer | "Order On the Way 🚚" |
| Farmer delivers order | Buyer | "Order Delivered 🎉" |
| Buyer cancels order | Buyer | "Order Cancelled ❌" |

**WebSocket URL:**
```
ws://localhost:8000/ws/notifications/?token=<access_token>
```

> For production, replace `InMemoryChannelLayer` with `RedisChannelLayer`. Install `channels-redis` and configure your Redis URL in settings.

---

## 🧪 Test Accounts

After setup, use these to test:

| Role | Email | Password |
|---|---|---|
| Admin | admin@farm.com | admin123 |
| Farmer | Register via `/register` | Your choice |
| Buyer | Register via `/register` | Your choice |

---

## 🔐 Security Notes

- **JWT Strategy** — Short-lived access tokens (5 min) in memory. Long-lived refresh tokens (7 days) in HttpOnly cookies (not accessible by JavaScript).
- **Auto Refresh** — Axios interceptor silently refreshes the access token when it expires. Users stay logged in for 7 days without re-entering credentials.
- **Role Guards** — Every API endpoint and every frontend route checks the user's role. Wrong-role access results in 403 (API) or redirect (frontend).
- **Stock Protection** — Order placement uses a database atomic transaction. If stock is insufficient, the entire order rolls back.
- **Input Validation** — All inputs validated server-side via DRF serializers before any DB write.

---

## 📦 Production Checklist

Before deploying to production:

- [ ] Set `DEBUG=False` in `.env`
- [ ] Set a strong random `SECRET_KEY`
- [ ] Switch to PostgreSQL (`psycopg2-binary` already in requirements)
- [ ] Set up Cloudinary for image uploads
- [ ] Replace `InMemoryChannelLayer` with Redis (`channels-redis`)
- [ ] Configure `ALLOWED_HOSTS` with your domain
- [ ] Set up Gunicorn + Daphne + Nginx
- [ ] Enable HTTPS (required for secure cookies)
- [ ] Configure `SESSION_COOKIE_SECURE=True` and `CSRF_COOKIE_SECURE=True`

---

## 📄 License

This project was built as an educational project. Feel free to use it as a learning reference.

---

<div align="center">
  Built with ❤️ for Ugandan farmers · FarmConnect 2026
</div>
