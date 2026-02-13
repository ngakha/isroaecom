# PRShark Ecommerce Engine

**Headless Ecommerce Engine Template** — მოდულური, გაფართოებადი ძრავი, რომელსაც ვებ-სააგენტო იყენებს ყოველი იკომერს პროექტისთვის. აღარ აწყობ ახალ ძრავს — Clone, Configure, Deploy.

Strapi.io-ს არქიტექტურული პრინციპებზე დაფუძნებული: Auto-routing, Module system, Plugin architecture, Lifecycle hooks.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+ |
| Backend Framework | Express.js |
| Database | PostgreSQL + Knex.js (Query Builder + Migrations) |
| Authentication | JWT (Access + Refresh Tokens) + bcrypt |
| Authorization | Role-Based Access Control (RBAC) |
| Validation | Joi |
| XSS Protection | xss library |
| HTTP Security | Helmet.js |
| File Upload | Multer + Sharp (image optimization) |
| Admin Panel | React 18 + React Router v6 |
| Styling | Tailwind CSS |
| State Management | Zustand |
| Charts | Recharts |
| API Client | Axios (with token refresh interceptor) |
| Dev Server | Vite |
| Process Manager | Nodemon (dev) |

---

## Project Structure

```
prshark-ecommerce-engine/
│
├── server/                              # Backend (Node.js + Express)
│   ├── src/
│   │   ├── core/                        # Engine Core
│   │   │   ├── app.js                   # Express bootstrap, middleware chain
│   │   │   ├── database.js              # PostgreSQL connection (Knex)
│   │   │   ├── router.js                # Auto-route discovery & registration
│   │   │   └── middleware/
│   │   │       ├── auth.js              # JWT verify, RBAC, ownership check, lockout
│   │   │       ├── security.js          # Helmet, CORS, rate limiting
│   │   │       ├── validate.js          # Joi validation + XSS sanitization
│   │   │       └── error-handler.js     # Global error handler + AppError class
│   │   │
│   │   ├── modules/                     # Business Modules
│   │   │   ├── auth/                    # Authentication & Authorization
│   │   │   ├── products/                # Products, Categories, Variants
│   │   │   ├── orders/                  # Orders, Status Pipeline, Stats
│   │   │   ├── cart/                    # Server-side Cart (guest + auth)
│   │   │   ├── customers/               # Customers, Addresses, Wishlist
│   │   │   ├── payments/                # Payment Providers (BOG, TBC, Stripe)
│   │   │   ├── shipping/                # Shipping Zones & Rate Calculation
│   │   │   ├── discounts/               # Coupons & Automatic Discounts
│   │   │   ├── media/                   # Media Library (upload, resize, thumbnails)
│   │   │   └── settings/                # Key-Value Store Settings
│   │   │
│   │   ├── plugins/                     # Plugin System
│   │   │   ├── plugin-manager.js        # Plugin loader & registry
│   │   │   └── hooks/
│   │   │       └── lifecycle.js         # Lifecycle hooks (before/after CRUD)
│   │   │
│   │   └── utils/
│   │       ├── pagination.js            # Pagination helper
│   │       └── slug.js                  # Unique slug generator
│   │
│   ├── config/
│   │   ├── default.js                   # App configuration (from .env)
│   │   ├── database.js                  # Knex database config
│   │   └── plugins.js                   # Plugin enable/disable config
│   │
│   ├── migrations/
│   │   └── 001_initial_schema.js        # Full database schema (20+ tables)
│   │
│   └── seeds/
│       └── 001_default_settings.js      # Default admin, settings, categories
│
├── admin/                               # React Admin Panel
│   ├── src/
│   │   ├── App.jsx                      # Route definitions + protected routes
│   │   ├── main.jsx                     # React entry point
│   │   ├── index.css                    # Tailwind + custom component classes
│   │   │
│   │   ├── components/
│   │   │   ├── AdminLayout.jsx          # Sidebar + topbar layout
│   │   │   └── ui/
│   │   │       ├── DataTable.jsx        # Reusable table with pagination
│   │   │       ├── StatusBadge.jsx      # Color-coded status badges
│   │   │       └── Modal.jsx            # Reusable modal component
│   │   │
│   │   ├── pages/
│   │   │   ├── Auth/LoginPage.jsx       # Admin login
│   │   │   ├── Dashboard/DashboardPage.jsx  # Stats, charts, recent orders
│   │   │   ├── Products/
│   │   │   │   ├── ProductsPage.jsx     # Product list with search/filter
│   │   │   │   ├── ProductFormPage.jsx  # Create/Edit product form
│   │   │   │   └── CategoriesPage.jsx   # Category tree management
│   │   │   ├── Orders/
│   │   │   │   ├── OrdersPage.jsx       # Orders list with status filter
│   │   │   │   └── OrderDetailPage.jsx  # Order detail + status pipeline
│   │   │   ├── Customers/CustomersPage.jsx   # Customer list + detail modal
│   │   │   ├── Discounts/DiscountsPage.jsx   # Discount CRUD with modal
│   │   │   ├── Media/MediaPage.jsx      # Media library grid + upload
│   │   │   └── Settings/SettingsPage.jsx     # Tabbed settings editor
│   │   │
│   │   ├── hooks/
│   │   │   └── useApi.js               # useApi + usePaginatedApi hooks
│   │   │
│   │   ├── services/
│   │   │   └── api.js                  # Axios instance + JWT refresh interceptor
│   │   │
│   │   └── store/
│   │       └── authStore.js            # Zustand auth store (login/logout)
│   │
│   ├── vite.config.js                   # Vite + API proxy config
│   ├── tailwind.config.js               # Tailwind theme config
│   └── postcss.config.js
│
├── .env.example                         # Environment template
├── .gitignore
└── package.json                         # Workspace root (server + admin)
```

---

## Core Engine Architecture

### Auto-Router (Strapi-inspired)

სერვერი ავტომატურად აღმოაჩენს ყველა მოდულს `server/src/modules/` დირექტორიაში. თუ მოდულს აქვს `{name}.routes.js` ფაილი, ის ავტომატურად რეგისტრირდება `/api/{name}` პრეფიქსით.

```
modules/products/products.routes.js  →  /api/products/*
modules/orders/orders.routes.js      →  /api/orders/*
modules/auth/auth.routes.js          →  /api/auth/*
```

ახალი მოდულის დამატებისთვის უბრალოდ შექმენი ფოლდერი `modules/` ში — სერვერი ავტომატურად ჩატვირთავს.

### Module Standard Structure

ყველა მოდული იცავს ერთ სტანდარტს:

```
modules/{name}/
├── {name}.service.js       # Business logic (DB queries, validation)
├── {name}.controller.js    # HTTP request/response handling
├── {name}.routes.js        # Express Router (exported, auto-registered)
└── {name}.validation.js    # Joi schemas (optional)
```

### Plugin System

Plugin-ები კონფიგურირდება `config/plugins.js`-ში. თითოეული პროექტისთვის ჩართე/გამორთე საჭირო პროვაიდერები:

```js
// config/plugins.js
payments: {
  providers: {
    bog:    { enabled: true, ... },   // Bank of Georgia
    tbc:    { enabled: false, ... },  // TBC Bank
    stripe: { enabled: false, ... },  // Stripe
  }
}
```

### Lifecycle Hooks

მოდელის დონეზე შეგიძლია hook-ების დამატება:

```js
const hooks = new LifecycleHooks('products');
hooks.register('beforeCreate', async (data) => {
  // Custom logic before product creation
});
hooks.register('afterUpdate', async (result) => {
  // Send notification, update cache, etc.
});
```

---

## Security Architecture

### 6-Layer Security Model

```
┌─────────────────────────────────────────────────┐
│  Layer 1: Helmet.js — HTTP Security Headers     │
│  Content-Security-Policy, X-Frame-Options,      │
│  Strict-Transport-Security, X-Content-Type      │
├─────────────────────────────────────────────────┤
│  Layer 2: CORS — Origin Whitelist               │
│  Only configured origins can access the API     │
├─────────────────────────────────────────────────┤
│  Layer 3: Rate Limiting                         │
│  General: 100 req / 15 min                      │
│  Login: 5 req / 15 min (per IP + email)         │
├─────────────────────────────────────────────────┤
│  Layer 4: Input Protection                      │
│  Joi schema validation on every endpoint        │
│  XSS sanitization on all string inputs          │
│  SQL injection prevented by Knex.js params      │
├─────────────────────────────────────────────────┤
│  Layer 5: Authentication                        │
│  JWT Access Token (15 min expiry)               │
│  JWT Refresh Token (7 day expiry, rotation)     │
│  bcrypt password hashing (12 rounds)            │
│  Account lockout (5 fails → 30 min lock)        │
├─────────────────────────────────────────────────┤
│  Layer 6: Authorization (RBAC)                  │
│  super_admin → Full access                      │
│  shop_manager → Products, Orders, Customers     │
│  content_editor → Products, Media only          │
│  customer → Own data only (ownership check)     │
└─────────────────────────────────────────────────┘
```

### JWT Token Flow

```
1. Login → Server issues Access Token (15m) + Refresh Token (7d)
2. API Request → Access Token in Authorization: Bearer header
3. Token Expired → Client auto-sends Refresh Token
4. Server validates Refresh → Issues new Access + Refresh pair
5. Old Refresh Token revoked (one-time use)
6. Logout → Refresh Token revoked server-side
```

### Account Lockout

```
Failed Login #1-4 → Counter incremented
Failed Login #5   → Account locked for 30 minutes
Successful Login  → Counter reset to 0
```

---

## Business Modules

### 1. Auth Module (`/api/auth`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/admin/login` | POST | No | Admin login (rate limited + lockout) |
| `/api/auth/admin/register` | POST | Admin | Create new admin user |
| `/api/auth/customer/register` | POST | No | Customer registration |
| `/api/auth/customer/login` | POST | No | Customer login (rate limited) |
| `/api/auth/refresh` | POST | No | Refresh access token |
| `/api/auth/logout` | POST | No | Revoke refresh token |
| `/api/auth/change-password` | POST | Yes | Change password (any role) |
| `/api/auth/me` | GET | Yes | Get current user info |

### 2. Products Module (`/api/products`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/products` | GET | No | List products (search, filter, paginate) |
| `/api/products/:id` | GET | No | Get product by ID |
| `/api/products/slug/:slug` | GET | No | Get product by slug |
| `/api/products` | POST | Admin | Create product |
| `/api/products/:id` | PUT | Admin | Update product |
| `/api/products/:id` | DELETE | Manager | Soft delete product |
| `/api/products/:id/variants` | POST | Admin | Add variant |
| `/api/products/:id/variants/:variantId` | PUT | Admin | Update variant |
| `/api/products/:id/variants/:variantId` | DELETE | Manager | Delete variant |
| `/api/products/categories` | GET | No | List categories (tree) |
| `/api/products/categories` | POST | Admin | Create category |
| `/api/products/categories/:id` | PUT | Admin | Update category |
| `/api/products/categories/:id` | DELETE | Manager | Delete category |

**Product Features:**
- Draft / Published / Archived სტატუსი
- Nested კატეგორიები (parent/child tree)
- ვარიანტები (ზომა, ფერი) — ცალკე SKU, ფასი, მარაგი
- დინამიური ატრიბუტები (JSON)
- SEO ველები (meta title, description, auto-slug)
- Inventory tracking (stock quantity, low stock alert)
- Soft delete (is_deleted flag, არა ფიზიკური წაშლა)

### 3. Orders Module (`/api/orders`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/orders` | GET | Manager | List all orders |
| `/api/orders/stats` | GET | Manager | Dashboard statistics |
| `/api/orders/:id` | GET | Manager | Order detail |
| `/api/orders` | POST | No | Create order (from checkout) |
| `/api/orders/:id/status` | PATCH | Manager | Update order status |

**Order Status Pipeline:**
```
pending → confirmed → processing → shipped → delivered → completed
   ↓          ↓           ↓
cancelled  cancelled   cancelled        delivered → refund_requested → refunded
```

**Features:**
- ავტომატური order number გენერაცია (ORD-240214-00001)
- სტატუს ისტორია & timeline
- მარაგის ავტომატური შემცირება შეკვეთისას
- მარაგის აღდგენა გაუქმებისას
- Dashboard stats (total orders, revenue, today's stats)

### 4. Cart Module (`/api/cart`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/cart` | GET | Optional | Get cart |
| `/api/cart/items` | POST | Optional | Add item to cart |
| `/api/cart/items/:itemId` | PUT | Optional | Update quantity |
| `/api/cart/items/:itemId` | DELETE | Optional | Remove item |
| `/api/cart` | DELETE | Optional | Clear cart |
| `/api/cart/merge` | POST | Required | Merge guest cart after login |

**Features:**
- Server-side cart (not localStorage)
- Guest cart (via `x-session-id` header) + authenticated cart
- Cart merge — guest cart items transfer to customer cart after login
- Real-time stock validation
- Cart expiration (7 days for guest carts)
- Auto-cleanup of expired carts

### 5. Customers Module (`/api/customers`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/customers` | GET | Manager | List customers |
| `/api/customers/:id` | GET | Manager | Customer detail + stats |
| `/api/customers/:id` | PUT | Manager | Update customer |
| `/api/customers/me/addresses` | GET/POST | Customer | Manage own addresses |
| `/api/customers/me/addresses/:id` | PUT/DELETE | Customer | Update/delete address |
| `/api/customers/me/wishlist` | GET/POST | Customer | Manage wishlist |
| `/api/customers/me/wishlist/:productId` | DELETE | Customer | Remove from wishlist |

**Features:**
- მისამართების წიგნი (multiple addresses, default address)
- Wishlist
- შეკვეთის ისტორია & total spent
- Admin: მომხმარებლის პროფილი + სტატისტიკა

### 6. Payments Module (`/api/payments`) — Plugin Architecture

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/payments/checkout` | POST | No | Initiate payment |
| `/api/payments/webhook/:provider` | POST | No | Payment webhook |
| `/api/payments/methods` | GET | No | List available methods |

**Provider Adapter Pattern:**
```
PaymentProviderBase (interface)
├── BOGProvider     — Bank of Georgia
├── TBCProvider     — TBC Bank
└── StripeProvider  — Stripe
```

თითოეული provider იმპლემენტაციას აკეთებს: `initiate()`, `verify()`, `handleWebhook()`

Enable/disable `config/plugins.js`-ში — კოდის ცვლილება არ სჭირდება.

### 7. Shipping Module (`/api/shipping`) — Plugin Architecture

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/shipping/rates` | POST | No | Calculate shipping rates |
| `/api/shipping/zones` | GET/POST | Manager | Manage shipping zones |
| `/api/shipping/zones/:id` | PUT/DELETE | Manager | Update/delete zone |

**Shipping Methods:**
- **Flat Rate** — ფიქსირებული ტარიფი ზონის მიხედვით
- **Weight-Based** — წონაზე დაფუძნებული (per kg)
- **Free Shipping** — უფასო მიწოდება მინიმალური თანხიდან

### 8. Discounts Module (`/api/discounts`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/discounts/apply` | POST | No | Validate & apply coupon |
| `/api/discounts` | GET/POST | Manager | List/Create discounts |
| `/api/discounts/:id` | GET/PUT/DELETE | Manager | CRUD |

**Features:**
- **Percentage** ფასდაკლება (e.g. 20%)
- **Fixed amount** ფასდაკლება (e.g. 10 GEL)
- **Free shipping** კუპონი
- მინიმალური შეკვეთის თანხა
- მაქსიმალური ფასდაკლების ლიმიტი
- Usage limit (total + per customer)
- ვადა (starts_at / ends_at)
- ავტომატური ფასდაკლებები (is_automatic flag)

### 9. Media Module (`/api/media`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/media` | GET | Admin | List media files |
| `/api/media` | POST | Admin | Upload files (max 10) |
| `/api/media/:id` | GET | Admin | Get file info |
| `/api/media/:id` | DELETE | Manager | Delete file |

**Features:**
- Multiple file upload (up to 10 files)
- Image optimization via Sharp (resize to max 2000px, JPEG 85%)
- Auto-thumbnail generation (300x300)
- File type validation (configurable whitelist)
- Max file size limit (configurable, default 10MB)
- Folder organization

### 10. Settings Module (`/api/settings`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/settings` | GET | Manager | Get all settings |
| `/api/settings/:group` | GET | Manager | Get settings by group |
| `/api/settings` | PUT | Manager | Update settings batch |

**Setting Groups:**
- **store** — Store name, currency, language, contact info
- **tax** — Tax rate, included in price
- **orders** — Email notifications, low stock alerts
- **checkout** — Guest checkout, minimum order amount

---

## Admin Panel

React-based admin panel with full CRUD for all modules.

### Pages

| Page | Features |
|------|----------|
| **Login** | Email/password login, JWT auth |
| **Dashboard** | Total orders, revenue, today's stats, order status chart (Recharts), recent orders |
| **Products** | DataTable with search/filter, status badges, create/edit form with categories, pricing, inventory, SEO |
| **Categories** | Tree view with nested categories, inline create/edit/delete |
| **Orders** | DataTable with status filter, detail page with status pipeline actions, order timeline |
| **Customers** | DataTable with search, detail modal with order count & total spent |
| **Discounts** | DataTable + modal CRUD, percentage/fixed/free shipping types |
| **Media** | Grid gallery, drag & drop upload, delete with confirmation |
| **Settings** | Tabbed interface (Store, Tax, Orders, Checkout), auto-save |

### Reusable Components

- `AdminLayout` — Sidebar navigation + responsive topbar
- `DataTable` — Sortable table with pagination
- `StatusBadge` — Color-coded status pills
- `Modal` — Reusable modal dialog

### API Integration

- **Axios interceptor** — auto-attaches JWT token to every request
- **Token refresh** — automatically refreshes expired tokens (transparent to user)
- **useApi hook** — single endpoint fetch with loading/error state
- **usePaginatedApi hook** — paginated list with filters

---

## Database Schema

20+ tables with proper indexing, foreign keys, and cascading deletes.

### Entity Relationship Overview

```
admin_users ──┐
              ├── refresh_tokens
customers ────┘
   │
   ├── customer_addresses
   ├── wishlists ──── products
   ├── carts ──── cart_items ──── products/variants
   └── orders
        ├── order_items ──── products/variants
        ├── order_addresses
        └── order_status_history

products
   ├── product_categories ──── categories (self-referencing parent_id)
   ├── product_variants
   ├── product_attributes
   └── product_images ──── media

discounts
shipping_zones
settings (key-value)
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm 9+

### Installation

```bash
# 1. Clone
git clone https://github.com/ngakha/prshark-ecommerce-engine.git
cd prshark-ecommerce-engine

# 2. Environment
cp .env.example .env
# Edit .env — set DB_PASSWORD, JWT secrets

# 3. Create database
createdb prshark_ecommerce
# or: psql -U postgres -c "CREATE DATABASE prshark_ecommerce;"

# 4. Install dependencies
npm install

# 5. Run migrations
npm run migrate

# 6. Seed default data
npm run seed

# 7. Start development
npm run dev
```

### Access

| Service | URL |
|---------|-----|
| API Server | http://localhost:5000 |
| Admin Panel | http://localhost:5173 |
| Health Check | http://localhost:5000/api/health |

### Default Admin

```
Email:    admin@prshark.com
Password: admin123
```

> **Important:** Change the default admin password in production!

---

## Per-Project Customization

ვებ-სააგენტოს workflow ყოველი ახალი პროექტისთვის:

### Step 1: Clone Template
```bash
git clone https://github.com/ngakha/prshark-ecommerce-engine.git my-client-store
cd my-client-store
rm -rf .git && git init
```

### Step 2: Configure Environment
```bash
cp .env.example .env
# Set: DB credentials, JWT secrets, SMTP, payment keys
```

### Step 3: Enable Payment Providers
Edit `server/config/plugins.js`:
```js
payments: {
  providers: {
    bog: { enabled: true, ... },  // Enable BOG for this project
  }
}
```

### Step 4: Customize Settings
Edit `server/seeds/001_default_settings.js`:
- Store name, currency, language
- Tax rate
- Shipping zones & rates

### Step 5: Connect Frontend Storefront
Build a Next.js / Nuxt.js / Mobile app that consumes the REST API.

### Step 6: Deploy
```bash
npm run build        # Build admin panel
npm run start        # Start production server
```

---

## API Response Format

### Success
```json
{
  "data": { ... }
}
```

### Paginated List
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 150,
    "totalPages": 6
  }
}
```

### Error
```json
{
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "email is required" }
  ]
}
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both server + admin in development |
| `npm run dev:server` | Start only backend (with nodemon) |
| `npm run dev:admin` | Start only admin panel (Vite) |
| `npm run build` | Build admin panel for production |
| `npm run start` | Start production server |
| `npm run migrate` | Run database migrations |
| `npm run migrate:rollback` | Rollback last migration |
| `npm run seed` | Seed default data |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | development | Environment mode |
| `PORT` | 5000 | Server port |
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_NAME` | prshark_ecommerce | Database name |
| `DB_USER` | postgres | Database user |
| `DB_PASSWORD` | — | Database password |
| `JWT_SECRET` | — | Access token signing key |
| `JWT_REFRESH_SECRET` | — | Refresh token signing key |
| `JWT_EXPIRES_IN` | 15m | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | 7d | Refresh token lifetime |
| `CORS_ORIGINS` | localhost:5173 | Allowed CORS origins (comma-separated) |
| `RATE_LIMIT_MAX` | 100 | Max requests per window |
| `LOGIN_RATE_LIMIT_MAX` | 5 | Max login attempts per window |
| `BCRYPT_ROUNDS` | 12 | Password hashing rounds |
| `ACCOUNT_LOCKOUT_ATTEMPTS` | 5 | Failed logins before lockout |
| `ACCOUNT_LOCKOUT_DURATION_MIN` | 30 | Lockout duration in minutes |
| `UPLOAD_DIR` | ./uploads | File upload directory |
| `MAX_FILE_SIZE_MB` | 10 | Max upload file size |
| `ALLOWED_FILE_TYPES` | image/jpeg,... | Allowed MIME types |
| `DEFAULT_CURRENCY` | GEL | Store currency |
| `DEFAULT_LANGUAGE` | ka | Store language |

---

## Adding a New Module

1. Create folder: `server/src/modules/mymodule/`
2. Create files following the standard structure:
   ```
   mymodule.service.js
   mymodule.controller.js
   mymodule.routes.js        # Must export Express Router
   mymodule.validation.js    # Optional
   ```
3. Restart server — Auto-Router registers `/api/mymodule` automatically
4. Add migration if needed: `npm run migrate:make -- mymodule_table`

---

## License

PRShark Internal Template — Private Use Only.

Built by [PRShark](https://prshark.online)
