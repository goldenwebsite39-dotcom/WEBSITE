# Complete WooCommerce Next.js App - Implementation Plan

## Context

The WooCommerce + Next.js ecommerce frontend is partially built with good foundations but has many missing critical features. The project needs to be "fixed" by implementing all missing functionality to make it a complete, production-ready ecommerce admin system.

**Current State:**
- ✅ WooCommerce API client with comprehensive methods
- ✅ Basic product listing & detail pages
- ✅ Shopping cart with Zustand
- ✅ Checkout flow
- ✅ Admin dashboard with KPIs
- ✅ UI component library (Button, Card, Badge, Input, LoadingSpinner)
- ✅ Dark mode support
- ✅ NextAuth client setup
- ✅ Cron job scripts (price-check, inventory-check, ai-pricing)

**Missing Critical Features:**
- ❌ NextAuth API route configuration
- ❌ Authentication/login pages
- ❌ Cron API endpoints (dashboard tries to call them)
- ❌ Admin pages: Products, Orders, Price Tracking, Analytics, Notifications, Bulk Upload, Settings
- ❌ Database tables: wc_price_history, wc_ai_suggestions, wc_notifications
- ❌ Notification services (Resend email, Twilio WhatsApp)
- ❌ OpenAI integration for AI pricing
- ❌ Account pages (profile, order history)
- ❌ Missing UI components (Table, Switch, Modal, Select variants)
- ❌ Middleware for admin route protection (optional since layout handles it)

## Implementation Strategy

### Phase 1: Foundation & Authentication (Day 1)

**Goal:** Set up authentication and core UI components

**Tasks:**

1. **Create NextAuth API Route**
   - File: `src/app/api/auth/[...nextauth]/route.ts`
   - Configure NextAuth with Credentials provider for WooCommerce API key auth OR simple email/password stored in env
   - Since WooCommerce already has users, simplest approach: use NextAuth with email/password against a local user DB OR use JWT from WooCommerce
   - Recommendation: Use simple email-based auth with ADMIN_EMAILS check - store allowed admin emails in env
   - Alternatively: implement OAuth with WooCommerce if they have user accounts
   - For simplicity: create a mock auth that accepts any email in ADMIN_EMAILS list as admin

2. **Create Login Page**
   - File: `src/app/(auth)/login/page.tsx`
   - Simple form with email (no password needed if email matches ADMIN_EMAILS)
   - Or use NextAuth's built-in signin page with custom styling
   - Redirect to /admin after successful auth

3. **Create Missing UI Components**
   - `src/components/ui/Table.tsx` (Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption)
   - `src/components/ui/Switch.tsx`
   - `src/components/ui/Modal.tsx` (for confirmations, forms)
   - `src/components/ui/Select.tsx` (already exists but extend with multi-select, search)
   - Ensure all are exported in `index.ts`

4. **Add Database Migration Script**
   - File: `scripts/migrate-tables.js`
   - Creates WordPress custom tables: wc_price_history, wc_ai_suggestions, wc_notifications
   - Use WP-CLI or direct MySQL connection
   - Or provide SQL file: `scripts/tables.sql`

---

### Phase 2: Cron API Endpoints (Day 1-2)

**Goal:** Create the API endpoints that the admin dashboard expects

**Tasks:**

1. **Create Cron API Routes**
   - `src/app/api/cron/price-check/route.ts` - POST endpoint
     - Validates CRON_SECRET
     - Calls WooCommerce to get products
     - Logs price check (would trigger scrapers - use placeholder)
     - Returns JSON summary
   - `src/app/api/cron/inventory-check/route.ts` - POST/GET endpoint
     - Validates CRON_SECRET
     - Fetches products, identifies low stock/out of stock
     - Sends email notifications via Resend
     - Returns JSON summary
   - `src/app/api/cron/ai-pricing/route.ts` - POST/GET endpoint
     - Validates CRON_SECRET
     - Fetches products, calls OpenAI for pricing suggestions
     - Stores suggestions in wc_ai_suggestions table
     - Optionally auto-applies high-confidence suggestions
     - Returns JSON summary

2. **Integrate Resend for Notifications**
   - Create `src/lib/notifications/email.ts` using Resend
   - Templates for: low stock alerts, price drop alerts, AI pricing suggestions
   - Use NOTIFICATION_EMAIL_FROM and ADMIN_EMAILS

3. **Integrate WhatsApp (Optional)**
   - Create `src/lib/notifications/whatsapp.ts` using Twilio
   - Templates for urgent alerts (out of stock, big price changes)

---

### Phase 3: Admin Pages - Core (Day 2-3)

**Goal:** Build essential admin management pages

**Tasks:**

1. **Products Management** (`/admin/products`)
   - `src/app/admin/products/page.tsx`
   - Full product listing with search, filters (category, stock status)
   - Inline editing: price, stock quantity, status
   - Bulk actions: update prices, stock, delete
   - Pagination
   - Use WooCommerce API: getProducts, updateProduct, batchUpdate
   - Integration with wc_price_history for price change logging

2. **Orders Management** (`/admin/orders`)
   - `src/app/admin/orders/page.tsx`
   - Order listing with filters (status, date, customer)
   - Order detail view (modal or separate page)
   - Update order status (pending → processing → completed)
   - View customer info, line items, shipping
   - Print invoice functionality (optional)
   - Use WooCommerce API: getOrders, getOrder, updateOrder

3. **Bulk Upload** (`/admin/upload`)
   - `src/app/admin/upload/page.tsx`
   - CSV upload form
   - Parse and validate CSV
   - Batch create/update products via WooCommerce API
   - Show import preview and results

---

### Phase 4: Admin Pages - Advanced (Day 3-4)

**Goal:** Price tracking, analytics, notifications, settings

**Tasks:**

1. **Price Tracking** (`/admin/price-tracking`)
   - `src/app/admin/price-tracking/page.tsx`
   - View competitor prices scraped (use placeholder data if scrapers not implemented)
   - Price history chart per product (line chart showing our price vs competitors over time)
   - Alerts management: view triggered alerts, dismiss, configure thresholds
   - Manual competitor price check button
   - Use wc_price_history table

2. **Analytics** (`/admin/analytics`)
   - `src/app/admin/analytics/page.tsx`
   - Revenue chart (line chart - daily/weekly/monthly)
   - Top selling products (bar chart or table)
   - Sales by category (pie chart)
   - Use WooCommerce reports API: getSalesReport, getTopSellersReport
   - Use recharts or chart.js for visualizations

3. **Notifications Center** (`/admin/notifications`)
   - `src/app/admin/notifications/page.tsx`
   - List all notifications from wc_notifications table
   - Filter by status (pending, sent, failed)
   - Retry failed notifications
   - Mark as read
   - Manual send test email

4. **Settings** (`/admin/settings`)
   - `src/app/admin/settings/page.tsx`
   - Configure admin emails
   - Cron settings (intervals)
   - Competitor website URLs
   - Alert thresholds (price drop %, low stock threshold)
   - Save to .env or database (wp_options table via custom endpoint)
   - Simpler: create API endpoint to update environment variables in a config file

---

### Phase 5: Account & User Pages (Day 4)

**Goal:** Customer-facing account pages

**Tasks:**

1. **Account Layout** (`src/app/account/layout.tsx`)
   - Protected route (requires authentication)
   - Sidebar with: Order History, Profile, Addresses, Wishlist

2. **Order History** (`/account/orders`)
   - Fetch customer's orders via WooCommerce API
   - Display order status, total, date
   - View order details

3. **Profile** (`/account/profile`)
   - Edit user info (name, email)
   - Update via WooCommerce customer API

4. **Addresses** (`/account/addresses`)
   - View/edit billing and shipping addresses

---

### Phase 6: Polish & Integration (Day 5)

**Goal:** Wire everything together, add error handling, testing

**Tasks:**

1. **Implement OpenAI AI Pricing**
   - Complete the integration in `src/app/api/cron/ai-pricing/route.ts`
   - Use OpenAI API (already have code in script - port to API route)
   - Store suggestions in database
   - Create admin UI to review/approve suggestions

2. **Competitor Scrapers** (Placeholder → Real)
   - Create `src/lib/scrapers/` with individual scrapers for each competitor
   - Implement Puppeteer/Playwright or use external APIs (Keepa, PriceAPI)
   - Respect robots.txt, rate limit
   - Store scraped prices in `wc_price_history`

3. **Database Layer**
   - Create `src/lib/db/` with database connection to WordPress
   - Use direct MySQL connection or custom REST API endpoints in WordPress
   - Alternatively: create a WordPress plugin with custom REST endpoints
   - Implement tables: wc_price_history, wc_ai_suggestions, wc_notifications

4. **Error Handling & Validation**
   - Add proper error boundaries
   - Form validation with Zod
   - API error handling (toast notifications)
   - Retry logic for failed API calls

5. **Optimization**
   - Add caching (SWR for product listings)
   - Image optimization (already enabled in next.config.js)
   - Lazy loading for admin pages
   - Bundle size analysis

6. **Environment Configuration**
   - Complete `.env.local.example` with all needed variables
   - Database credentials if using direct MySQL

---

### Phase 7: Deployment Ready (Day 5-6)

**Tasks:**

1. **Vercel Configuration**
   - `vercel.json` with environment variables, cron jobs
   - Cron schedule: price-check every 6h, inventory-check daily 9am, ai-pricing daily 10am

2. **Security Hardening**
   - Rate limiting on API routes
   - Input sanitization
   - CORS configuration
   - Hide sensitive data from logs

3. **Documentation**
   - Update README with complete setup instructions
   - Document database schema
   - Document API endpoints
   - Deployment guide

4. **Testing**
   - Run development server: `npm run dev`
   - Test all admin pages
   - Test checkout flow
   - Test cron jobs manually
   - Verify email/WhatsApp notifications

---

## File Creation Summary

### New Files to Create:

**Authentication:**
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/(auth)/login/page.tsx`
- (Optional: `src/app/(auth)/register/page.tsx`)

**UI Components:**
- `src/components/ui/Table.tsx`
- `src/components/ui/Switch.tsx`
- `src/components/ui/Modal.tsx`

**Cron API:**
- `src/app/api/cron/price-check/route.ts`
- `src/app/api/cron/inventory-check/route.ts`
- `src/app/api/cron/ai-pricing/route.ts`

**Notifications:**
- `src/lib/notifications/email.ts`
- `src/lib/notifications/whatsapp.ts`

**Admin Pages:**
- `src/app/admin/products/page.tsx`
- `src/app/admin/orders/page.tsx`
- `src/app/admin/price-tracking/page.tsx`
- `src/app/admin/analytics/page.tsx`
- `src/app/admin/notifications/page.tsx`
- `src/app/admin/upload/page.tsx`
- `src/app/admin/settings/page.tsx`

**Account Pages:**
- `src/app/account/layout.tsx`
- `src/app/account/orders/page.tsx`
- `src/app/account/profile/page.tsx`
- `src/app/account/addresses/page.tsx`

**Database:**
- `scripts/migrate-tables.js`
- `scripts/tables.sql`

**Scrapers:**
- `src/lib/scrapers/index.ts`
- `src/lib/scrapers/competitor1.ts`
- `src/lib/scrapers/competitor2.ts`

**Config:**
- `vercel.json` (if deploying to Vercel)

---

## Verification Steps

1. **Authentication**
   - Visit `/admin` → should redirect to login
   - Login with admin email → should access dashboard
   - Non-admin email → "Access Denied"

2. **Cron Endpoints**
   - Visit `/api/cron/price-check?secret=xxx` (POST) → should return JSON summary
   - Same for inventory-check and ai-pricing
   - Dashboard "Check Prices" button should work

3. **Admin Pages**
   - navigate to `/admin/products` → see product table with edit functionality
   - `/admin/orders` → see orders with status badges
   - `/admin/price-tracking` → see price history charts
   - `/admin/analytics` → see revenue and top sellers charts
   - `/admin/notifications` → see notification list
   - `/admin/upload` → CSV upload form
   - `/admin/settings` → config form

4. **Email Notifications**
   - Trigger low stock → admin@example.com receives email

5. **AI Pricing**
   - Run ai-pricing cron → suggestions stored in database

6. **Account Pages**
   - Login as customer (create test account)
   - Visit `/account` → see sidebar with order history
   - View orders → see past purchases

7. **Checkout**
   - Add product to cart, proceed to checkout
   - Complete order → see success message, admin receives order

---

## Risk Mitigation

- **WooCommerce API limits:** Implement pagination, rate limiting, caching
- **OpenAI costs:** Limit daily product analysis, set confidence thresholds, use cheaper model (gpt-3.5-turbo) for initial analysis
- **Scraping legal issues:** Use official APIs only (Keepa for Amazon), add robots.txt check, rate limit aggressively
- **Security:** Never expose consumer secret on client-side (already using environment variables correctly), validate CRON_SECRET, protect admin routes
- **Database access:** Use custom WordPress plugin for secure table access instead of direct MySQL from Next.js

---

## Dependencies to Install

Already in package.json? Verify:
- recharts or chart.js ✓ (both present)
- openai ✓
- resend ✓
- twilio ✓
- axios ✓
- next-auth ✓
- zustand ✓
- lucide-react ✓
- date-fns ✓

May need:
- papaparse (for CSV upload)
- puppeteer or playwright (for scraping - but heavy)
- cheerio (for simple HTML parsing)
- mysql2 (if direct DB access)

---

## Notes

- The WooCommerce client already has all needed methods (getProducts, getOrders, updateStock, etc.)
- Admin layout already has auth check and sidebar navigation defined
- Cron scripts already have placeholder logic - just need to wire into API routes
- Database tables schema provided in README - just need to create migration
