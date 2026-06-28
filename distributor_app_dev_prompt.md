# B2B Distributor Ordering System — Complete Development Specification

> \*\*Platform:\*\* Android (Flutter), Web Admin Panel  
> \*\*Scale:\*\* \~350 retailers, thousands of products, concurrent ordering

\---

## 1\. PROJECT SUMMARY

Build a B2B mobile ordering platform for a distributor company with \~350 retailers. The system has three user roles: **Admin**, **Retailer**, and **Salesman**. Retailers log in to browse products at their tier-specific pricing, place orders, and track dues. Salesmen can log in and place orders on behalf of any retailer assigned to them. A web-based Admin Panel allows head-office staff to manage all entities, approve credit-limit-exceeded orders, and view performance dashboards.

**No payment gateway is integrated.** Retailers select a payment arrangement (COD / Due 7 Days / Due 15 Days) and money is collected offline. The app tracks dues and balances only.

> \*\*UI Branding Note:\*\* Reference images for the desired UI look and feel will be provided separately. Implement the UI to match those reference images as closely as possible.

\---

## 2\. TECH STACK

|Layer|Technology|
|-|-|
|Mobile App|Flutter (Android first, iOS-ready)|
|Backend|Node.js (Express) or Laravel (PHP)|
|Database|PostgreSQL or MySQL|
|Authentication|JWT + OTP via **MSG91** SMS gateway|
|Push Notifications|Firebase Cloud Messaging (FCM)|
|File Storage|**AWS S3 + CloudFront CDN** (product images)|
|Admin Panel|React.js (web)|
|API|RESTful API (JSON)|
|Hosting|**AWS** (EC2 or Elastic Beanstalk, RDS, S3, CloudFront)|

\---

## 3\. USER ROLES

### 3.1 Admin (Super Admin)

* Web admin panel access only
* Full control: retailers, salesmen, products, orders, dues, credit approvals, reports
* Can set and adjust credit limits per retailer
* Can set monthly targets per salesman
* Can approve orders that exceed a retailer's credit limit

### 3.2 Retailer

* Mobile app access only
* Browses products at their tier pricing, places orders, views dues and order history
* Can manage their own delivery addresses
* Cannot see other retailers' data
* Cannot see which salesman (if any) placed an order on their behalf — they simply see all their orders regardless of who placed them

### 3.3 Salesman

* Mobile app access (same app, different role experience)
* Logs in with their own credentials
* Can browse the assigned retailer list and select a retailer to place an order on their behalf
* Can view all orders and dues for their assigned retailers
* Cannot access retailers assigned to other salesmen
* Cannot modify products, pricing, or any admin-level data

\---

## 4\. DATABASE SCHEMA

### `admin\_users`

```
id, name, email, password\_hash, role (ENUM: super\_admin), is\_active, created\_at
```

### `salesmen`

```
id, name, mobile\_number, email, password\_hash, otp, otp\_expires\_at,
fcm\_token, is\_active, created\_at, updated\_at
```

### `salesman\_targets`

```
id, salesman\_id (FK), month (DATE — first day of month),
target\_orders (INT), target\_revenue (DECIMAL), target\_dues\_collected (DECIMAL),
created\_at, updated\_at
```

### `retailers`

```
id, name, mobile\_number, email, password\_hash, otp, otp\_expires\_at,
category (ENUM: T1, T2, T3),
assigned\_salesman\_id (FK → salesmen.id, nullable),
credit\_limit (DECIMAL, default 0),
current\_outstanding (DECIMAL, default 0),  -- running total of unpaid dues
fcm\_token, is\_active, created\_at, updated\_at
```

### `retailer\_addresses`

```
id, retailer\_id (FK), label (e.g. "Main Shop", "Warehouse"),
address\_line1, address\_line2, city, state, pincode,
is\_default, created\_at, updated\_at
```

### `product\_categories`

```
id, name, image\_url, sort\_order, is\_active
```

### `products`

```
id, name, sku, brand, category\_id (FK), description,
price\_t1, price\_t2, price\_t3,
stock\_quantity, low\_stock\_threshold,
images (JSON array of S3 URLs), is\_active, is\_featured,
hsn\_code (nullable), gst\_rate (nullable),
created\_at, updated\_at
```

### `orders`

```
id, retailer\_id (FK),
placed\_by\_role (ENUM: retailer, salesman),
placed\_by\_id (INT),             -- retailer.id or salesman.id depending on role
order\_number (auto-generated),
delivery\_address\_snapshot (JSON),
total\_product\_amount (DECIMAL),
payment\_type (ENUM: cod, due\_7, due\_15),
surcharge\_amount (DECIMAL),
final\_amount (DECIMAL),
status (ENUM: pending, pending\_approval, confirmed, packed, shipped, delivered, cancelled),
credit\_approval\_status (ENUM: not\_required, pending, approved, rejected),
credit\_approval\_note (TEXT, nullable),
due\_date (DATE, nullable),
is\_overdue (BOOLEAN, default false),
warehouse\_id (nullable),
placed\_at, updated\_at
```

> `pending\_approval` is a special status used when an order exceeds the retailer's credit limit and is awaiting admin approval.

### `order\_items`

```
id, order\_id (FK), product\_id (FK),
product\_name (snapshot), sku (snapshot),
unit\_price (snapshot), quantity, subtotal
```

### `due\_payments`

```
id, order\_id (FK), retailer\_id (FK),
principal\_amount, surcharge\_amount, total\_due,
due\_date, paid\_amount, balance\_due,
status (ENUM: active, overdue, paid),
created\_at, updated\_at
```

### `due\_payment\_transactions`

```
id, due\_payment\_id (FK), amount\_received, recorded\_by\_admin\_id (FK),
note (TEXT, nullable), recorded\_at
```

### `payment\_configs`

```
id, payment\_type, label,
flat\_charge (DECIMAL, nullable),
percentage\_rate (DECIMAL, nullable),
is\_active, updated\_at
```

> Seed: COD = ₹50 flat, Due 7 Days = 1%, Due 15 Days = 2%

### `notifications`

```
id, recipient\_role (ENUM: retailer, salesman),
recipient\_id, title, body,
type (ENUM: order\_placed, order\_confirmed, order\_status\_update,
           due\_reminder, overdue\_alert, credit\_approval\_required,
           credit\_approved, credit\_rejected),
is\_read, sent\_at
```

\---

## 5\. PAYMENT MODEL

**No payment gateway. The app does not process real money.**

Retailers (or salesmen on their behalf) select a payment arrangement at checkout:

|Option|Meaning|Surcharge|
|-|-|-|
|COD|Cash paid on delivery|+ ₹50 flat (configurable)|
|Due 7 Days|Balance settled within 7 days|+ 1% of order total (configurable)|
|Due 15 Days|Balance settled within 15 days|+ 2% of order total (configurable)|

A note is shown at checkout: *"No online payment required. Amount will be collected offline."*

All surcharge rates are configurable by admin in real time via the Payment Config screen.

\---

## 6\. CREDIT SYSTEM

### 6.1 How It Works

* Each retailer has a `credit\_limit` set by admin (e.g. ₹50,000).
* `current\_outstanding` tracks the total unpaid due balance across all active/overdue dues.
* **Available credit = credit\_limit − current\_outstanding**

### 6.2 Order Placement Rules

When a retailer (or salesman) submits an order:

**Step 1 — Credit Check:**

```
if (final\_amount <= available\_credit):
    proceed normally → order status = "pending"
else:
    flag order → order status = "pending\_approval"
    credit\_approval\_status = "pending"
    notify admin immediately
```

**Step 2 — Admin Action (for pending\_approval orders):**

* Admin reviews the order and retailer's credit history in the admin panel
* Admin can **Approve** (order moves to "pending" and flows normally) or **Reject** (order cancelled, retailer/salesman notified)
* Admin can optionally add a note (e.g. reason for rejection)

**Step 3 — Outstanding Balance Updates:**

* When a due is created: `current\_outstanding += total\_due`
* When a payment is recorded against a due: `current\_outstanding -= amount\_received`
* When an order is cancelled before due creation: no change

### 6.3 Credit Limit Display

* Retailer app shows on Dashboard and Checkout: "Credit Available: ₹X,XXX"
* Salesman app shows per retailer: credit limit, outstanding, available credit
* Admin panel shows full credit picture per retailer

\---

## 7\. API ENDPOINTS

### Auth (Retailers \& Salesmen share endpoint, role detected from DB)

```
POST /api/auth/send-otp
POST /api/auth/verify-otp        — Returns JWT with role field
POST /api/auth/login-password
POST /api/auth/logout
```

### Retailer (JWT role = retailer)

```
GET  /api/retailer/profile
PUT  /api/retailer/profile
GET  /api/retailer/dashboard     — Pending orders, due amount, available credit, featured products
GET  /api/retailer/credit        — Credit limit, outstanding, available credit
```

### Salesman (JWT role = salesman)

```
GET  /api/salesman/profile
GET  /api/salesman/dashboard     — Performance summary for current month
GET  /api/salesman/retailers     — List of assigned retailers with credit summary
GET  /api/salesman/retailers/:id — Retailer detail (orders, dues, credit)
```

### Retailer Addresses

```
GET    /api/retailer/addresses
POST   /api/retailer/addresses
PUT    /api/retailer/addresses/:id
DELETE /api/retailer/addresses/:id
PATCH  /api/retailer/addresses/:id/default
```

> Salesmen can also access addresses for their assigned retailers:
> `GET /api/salesman/retailers/:id/addresses`

### Products (accessible by both retailer and salesman JWT)

```
GET  /api/products               — Tier price auto-applied from JWT retailer context
GET  /api/products/:id
GET  /api/products/categories
GET  /api/products/search?q=
```

> For salesman, price tier is determined by the retailer they are currently ordering for (passed as `?retailer\_id=` query param, validated against salesman's assigned list).

### Orders

```
POST /api/orders                      — Place order (retailer or salesman)
GET  /api/orders                      — Retailer: own orders. Salesman: orders for assigned retailers
GET  /api/orders/:id
PUT  /api/orders/:id/cancel           — Cancel if status = pending or pending\_approval
```

### Due Payments

```
GET  /api/dues                        — Retailer: own dues. Salesman: dues for assigned retailers
GET  /api/dues/summary
```

### Notifications

```
GET  /api/notifications
PUT  /api/notifications/:id/read
PUT  /api/notifications/read-all
```

\---

### Admin API Endpoints

```
POST /api/admin/auth/login

# Salesmen
GET/POST       /api/admin/salesmen
GET/PUT/DELETE /api/admin/salesmen/:id
GET/PUT        /api/admin/salesmen/:id/targets       — Set monthly targets
GET            /api/admin/salesmen/:id/performance   — Performance data

# Retailers
GET/POST       /api/admin/retailers
GET/PUT/DELETE /api/admin/retailers/:id
PATCH          /api/admin/retailers/:id/credit-limit
GET            /api/admin/retailers/:id/credit-summary

# Products
GET/POST       /api/admin/products
GET/PUT/DELETE /api/admin/products/:id
POST           /api/admin/products/:id/images
PATCH          /api/admin/products/:id/stock

# Orders
GET            /api/admin/orders
GET            /api/admin/orders/:id
PATCH          /api/admin/orders/:id/status
POST           /api/admin/orders/:id/approve-credit   — Approve credit-exceeded order
POST           /api/admin/orders/:id/reject-credit    — Reject credit-exceeded order
GET            /api/admin/orders/:id/invoice

# Due Management
GET            /api/admin/dues
POST           /api/admin/dues/:id/record-payment

# Payment Config
GET/PUT        /api/admin/payment-config

# Reports \& Dashboard
GET            /api/admin/dashboard
GET            /api/admin/reports/sales
GET            /api/admin/reports/retailers
GET            /api/admin/reports/products
GET            /api/admin/reports/outstanding
GET            /api/admin/reports/salesman-performance
```

\---

## 8\. BUSINESS LOGIC (Critical Rules)

### 8.1 Tier Pricing

* Backend reads `category` from JWT (retailer) or resolves from the target retailer record (salesman).
* API returns a single `price` field — never exposes all three tiers to the mobile app.

### 8.2 Stock Validation (No Negative Stock)

1. For each order item: check `stock\_quantity >= quantity`
2. If any item fails: reject entire order with per-item error
3. On success: deduct stock inside a DB transaction
4. Race condition guard: `UPDATE products SET stock\_quantity = stock\_quantity - ? WHERE id = ? AND stock\_quantity >= ?` — check rows affected = 1, else rollback

### 8.3 Stock Status Labels

* `quantity == 0` → Out of Stock
* `0 < quantity <= low\_stock\_threshold` → Low Stock
* `quantity > low\_stock\_threshold` → In Stock

### 8.4 Surcharge Calculation (server-side only)

```
COD:          final = product\_total + flat\_charge
Due 7 Days:   final = product\_total + (product\_total × rate\_7 / 100)
Due 15 Days:  final = product\_total + (product\_total × rate\_15 / 100)
```

### 8.5 Credit Check on Order Placement

```
available\_credit = retailer.credit\_limit - retailer.current\_outstanding
if order.final\_amount <= available\_credit:
    order.status = 'pending'
    order.credit\_approval\_status = 'not\_required'
else:
    order.status = 'pending\_approval'
    order.credit\_approval\_status = 'pending'
    → notify admin via FCM/in-panel alert
```

### 8.6 Outstanding Balance Management

* Due created → `retailers.current\_outstanding += due.total\_due`
* Payment recorded → `retailers.current\_outstanding -= amount\_received`
* Order cancelled (before due creation) → no change
* These updates must happen inside the same DB transaction as the due/payment record

### 8.7 Due Entry \& Overdue Detection

* Due created when order with `due\_7` or `due\_15` is confirmed (not on placement, on confirmation)
* `due\_date = confirmed\_at + 7 or 15 days`
* Daily cron (AWS EventBridge + Lambda): mark dues overdue, send FCM reminder 2 days before due date

### 8.8 Order Number Generation

Format: `ORD-YYYYMMDD-XXXX` (e.g. `ORD-20250622-0034`) — auto-incremented per day

### 8.9 Salesman Order Attribution

* `orders.placed\_by\_role` and `orders.placed\_by\_id` record who placed the order
* Both the salesman and the retailer can see the order
* The retailer sees it as their own order (no salesman attribution shown in retailer UI)
* The salesman sees it tagged as "Placed by you" in their order list

\---

## 9\. MOBILE APP — SCREENS \& FLOWS

### 9.1 Shared Auth Flow

* Splash → validate JWT (check role) → route to correct dashboard
* Login Screen: mobile number + toggle OTP/Password
* On verify: JWT contains `role` (retailer / salesman) → app renders appropriate navigation

\---

### RETAILER FLOWS

### 9.2 Retailer Bottom Navigation

```
Home  |  Products  |  Orders  |  Dues  |  Profile
```

### 9.3 Retailer Dashboard

* Welcome + tier badge
* Credit card: **Available Credit / Credit Limit** (e.g. ₹32,000 / ₹50,000) with a progress bar
* Pending Orders count, Total Outstanding Due
* Product categories quick-scroll
* Featured products section

### 9.4 Product Listing \& Detail

* Category filter, search, stock status badge
* Tier-specific price displayed
* Add to cart (max qty = stock)

### 9.5 Cart \& Checkout

* Cart: quantity controls, subtotal
* Checkout Step 1: select/add delivery address
* Checkout Step 2: select payment arrangement (COD / Due 7 / Due 15)

  * Live surcharge breakdown
  * **Credit check display:** "Available Credit: ₹X" — if order exceeds credit, show warning banner: *"This order exceeds your credit limit and will be sent for admin approval before processing."*
* Checkout Step 3: review + Place Order
* Success screen: order number + status (Pending or Pending Approval)

### 9.6 Order History \& Detail

* List with status chips (Pending / Pending Approval / Confirmed / Packed / Shipped / Delivered / Cancelled)
* Detail: items, address, payment arrangement, surcharge, final amount, status timeline
* Cancel button (only if status = pending or pending\_approval)
* "Pending Approval" orders show explanation: *"This order is awaiting admin credit approval."*

### 9.7 Dues Screen

* Total Outstanding summary card
* Tabs: Active / Overdue / Paid
* Overdue rows in red

### 9.8 Profile

* Name, mobile, tier badge, credit limit display
* Manage Addresses
* Change Password, Notifications toggle, Logout

\---

### SALESMAN FLOWS

### 9.9 Salesman Bottom Navigation

```
Home  |  My Retailers  |  Orders  |  Dues  |  Profile
```

### 9.10 Salesman Dashboard (Performance)

Displays current month data with comparison to monthly targets:

|Metric|Shows|
|-|-|
|Orders Placed|Count placed vs target|
|Revenue Generated|₹ value vs target|
|Dues Collected|₹ collected from retailers this month vs target|
|Target Achievement|% progress bar for each metric|

* Month selector to view past months
* Quick-access: "Place New Order" (prompts retailer selection)

### 9.11 My Retailers Screen

* List of assigned retailers with:

  * Name, tier badge, city
  * Outstanding due amount
  * Available credit (credit limit − outstanding)
  * Quick "Place Order" button per retailer
* Search / filter by tier or city

### 9.12 Retailer Detail (Salesman View)

* Retailer info: name, mobile, address, tier
* Credit summary: limit / outstanding / available
* Recent orders for this retailer
* Active/overdue dues for this retailer
* "Place Order for this Retailer" CTA

### 9.13 Place Order on Behalf of Retailer

* Salesman selects a retailer from their list
* Product listing loads with that retailer's tier pricing
* Cart, checkout (address from retailer's saved addresses), payment arrangement all work identically to retailer flow
* Credit check runs against the selected retailer's credit
* Order is tagged: `placed\_by\_role = salesman`, `placed\_by\_id = salesman.id`
* Confirmation shows order number; both salesman and retailer receive FCM notification

### 9.14 Salesman Orders Screen

* All orders placed for any of their assigned retailers
* Filter by retailer, status, date range
* Each order shows retailer name and "Placed by you" tag

### 9.15 Salesman Dues Screen

* Dues across all assigned retailers
* Filter by retailer
* Summary card: total outstanding across all assigned retailers

### 9.16 Salesman Profile

* Name, mobile, employee details
* Change password, logout

\---

## 10\. ADMIN PANEL — MODULES

### 10.1 Dashboard

**Retailer Performance Section:**

* Top 10 retailers by order value (current month)
* Retailers with highest outstanding dues
* Inactive retailers (no order in 30/60/90 days — selectable)
* New retailers added this month

**Salesman Performance Section:**

* Table of all salesmen with current month metrics:

  * Orders placed / target, Revenue / target, Dues collected / target
  * % achievement for each, colour-coded (green ≥ 100%, amber 70–99%, red < 70%)
* Click any salesman row → Salesman Performance Detail page

**KPI Cards:**

* Today's orders, today's order value
* Pending credit approval count (with alert badge)
* Total active dues, total overdue dues

### 10.2 Credit Approval Queue

* Dedicated section / alert banner for orders with `status = pending\_approval`
* Shows: retailer name, order value, credit limit, outstanding, amount over limit
* Approve / Reject buttons with optional note field
* Approved → order moves to Pending, retailer + salesman notified
* Rejected → order cancelled, retailer + salesman notified with reason

### 10.3 Salesman Management

* Table: name, mobile, assigned retailer count, this month's performance summary
* Add / Edit / Deactivate salesman
* Assign retailers to salesman
* Set monthly targets per salesman (orders, revenue, dues collected)
* View full performance history by month

### 10.4 Retailer Management

* Table: name, mobile, tier, assigned salesman, credit limit, outstanding, available credit, status
* Add / Edit / Deactivate
* Set/adjust credit limit
* Assign/change salesman
* View addresses, order history, dues inline

### 10.5 Product Management

* Add/Edit/Deactivate products, multi-image upload (S3)
* Manual stock adjustment with reason log
* Toggle `is\_featured`

### 10.6 Order Management

* Filter by status (including `pending\_approval`), date, retailer, salesman, payment type
* Status updates (Confirmed → Packed → Shipped → Delivered)
* PDF invoice generation
* Orders placed by salesman are tagged with salesman name

### 10.7 Due Management

* Tabs: Active / Overdue / Paid
* Record payment (partial or full) → updates `current\_outstanding` on retailer
* Full payment transaction history per due

### 10.8 Payment Config

* COD flat charge, Due 7 Days %, Due 15 Days % — all editable, effective immediately

### 10.9 Reports

* **Sales Report:** Revenue by date, tier, product category, salesman
* **Retailer Report:** Top buyers, inactive retailers, credit utilisation
* **Salesman Performance Report:** Month-by-month targets vs actuals per salesman
* **Product Report:** Best sellers, slow movers, stock levels
* **Outstanding Report:** Unpaid dues with aging (0–7d / 8–15d / 15d+)
* Export all to CSV / Excel

\---

## 11\. PUSH NOTIFICATIONS (FCM)

|Trigger|Recipient(s)|Message|
|-|-|-|
|Order placed (normal)|Retailer|"Order #ORD-XXX placed successfully."|
|Order placed by salesman|Retailer|"An order #ORD-XXX has been placed for your account."|
|Order placed by salesman|Salesman|"Order #ORD-XXX placed for \[Retailer Name]."|
|Order pending credit approval|Retailer|"Order #ORD-XXX is awaiting credit approval."|
|Order pending credit approval|Salesman (if placed by salesman)|"Order #ORD-XXX for \[Retailer] awaiting credit approval."|
|Credit approved|Retailer + Salesman|"Order #ORD-XXX has been approved and is now processing."|
|Credit rejected|Retailer + Salesman|"Order #ORD-XXX was not approved. Reason: \[note]."|
|Order status update|Retailer|"Your order #ORD-XXX is now \[status]."|
|Due reminder (2 days before)|Retailer|"Payment of ₹X for order #ORD-XXX is due in 2 days."|
|Overdue alert|Retailer|"Payment of ₹X for order #ORD-XXX is overdue."|

\---

## 12\. SECURITY REQUIREMENTS

* JWT payload: `{ user\_id, role (retailer/salesman), category (for retailer), exp }`
* All routes validate JWT and enforce role-based access server-side
* Salesman routes validate that requested retailer is in their assigned list
* Retailer routes filter all queries by `retailer\_id` from JWT
* Passwords: bcrypt, cost factor ≥ 12
* OTP: MSG91, 5-minute expiry, single-use
* Rate limit OTP: max 3 requests per mobile per 10 minutes
* Admin panel: completely separate auth system
* HTTPS everywhere (AWS ACM)
* S3 images served via CloudFront only

\---

## 13\. AWS INFRASTRUCTURE

|Service|Purpose|
|-|-|
|EC2 / Elastic Beanstalk|Backend API|
|RDS (PostgreSQL/MySQL)|Primary database|
|S3|Product image storage|
|CloudFront|CDN for images + admin panel|
|ACM|SSL/TLS certificates|
|EventBridge + Lambda|Daily cron: overdue detection, due reminders|
|CloudWatch|Logs and monitoring|
|SES (optional)|Admin email alerts|
|Parameter Store (SSM)|Secrets: DB creds, JWT secret, MSG91 key, FCM key|

\---

## 14\. FLUTTER APP ARCHITECTURE

```
lib/
├── main.dart
├── app/
│   ├── app.dart              — MaterialApp, GoRouter, theme
│   └── routes.dart           — Role-aware routing (retailer/salesman flows)
├── core/
│   ├── api/                  — Dio client, auth interceptor
│   ├── auth/                 — JWT storage, role detection
│   ├── models/               — Product, Order, Due, Retailer, Salesman,
│   │                           Address, Notification, CreditSummary, Performance
│   └── utils/                — Currency (₹), date helpers, validators
├── features/
│   ├── auth/                 — Login, OTP, forgot password
│   ├── retailer/
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   ├── dues/
│   │   ├── addresses/
│   │   └── profile/
│   └── salesman/
│       ├── dashboard/        — Performance dashboard
│       ├── retailers/        — Assigned retailer list + detail
│       ├── place\_order/      — Retailer selection → product → cart → checkout
│       ├── orders/           — Orders across assigned retailers
│       ├── dues/             — Dues across assigned retailers
│       └── profile/
└── shared/
    ├── widgets/              — ProductCard, StatusChip, CreditBar, PerformanceCard,
    │                           SurchargeBreakdown, AddressCard, LoadingButton
    └── theme/                — Colors, typography — match branding reference images
```

**State Management:** Riverpod (preferred) or BLoC — one consistent choice throughout  
**HTTP:** Dio with JWT interceptor (401 → clear token → redirect to login)  
**Secure Storage:** `flutter\_secure\_storage` for JWT  
**Navigation:** GoRouter with role-based redirect guards  
**Images:** `cached\_network\_image` (CloudFront URLs)

\---

## 15\. PERFORMANCE REQUIREMENTS

* Pagination on all list endpoints: `?page=1\&limit=20`
* DB indexes: `orders.retailer\_id`, `orders.status`, `orders.placed\_by\_id`, `products.category\_id`, `due\_payments.due\_date`, `due\_payments.status`, `retailers.assigned\_salesman\_id`
* Images via CloudFront CDN only
* Android 8.0+ (API 26+)
* Cold-start < 2 seconds on mid-range Android
* API response < 500ms (warm server, list endpoints)

\---

## 16\. FUTURE-PROOFING

|Feature|Preparation|
|-|-|
|GST Billing|`products.hsn\_code`, `products.gst\_rate` already in schema|
|Barcode Scanning|SKU is unique; only scanner UI needed|
|Multi-Warehouse|`orders.warehouse\_id` nullable FK already in schema|
|Delivery Tracking|Add nullable `tracking\_url`, `tracking\_provider` on orders|
|Accounting Integration|Webhook events on order confirmation and payment recording|
|iOS App|Flutter codebase is already cross-platform|

\---

## 17\. DELIVERABLES CHECKLIST

* \[ ] Flutter Android APK (release-signed)
* \[ ] Backend API on AWS (EC2/Elastic Beanstalk + RDS)
* \[ ] React Admin Panel on AWS (S3 + CloudFront)
* \[ ] DB migrations + seed script
* \[ ] MSG91 OTP integration working
* \[ ] FCM push notifications working (retailer + salesman)
* \[ ] AWS S3 image upload from admin panel
* \[ ] API documentation (Postman collection or Swagger)
* \[ ] README: setup, env variables, deployment steps
* \[ ] Source code in Git with clear folder structure

\---

## 18\. SEED DATA

**Payment Configs:**

* COD: ₹50 flat
* Due 7 Days: 1%
* Due 15 Days: 2%

**Test Retailers:**

* Retailer A — T1 — mobile: 9000000001 — credit limit: ₹50,000
* Retailer B — T2 — mobile: 9000000002 — credit limit: ₹30,000
* Retailer C — T3 — mobile: 9000000003 — credit limit: ₹20,000

**Test Salesman:**

* Salesman 1 — mobile: 9000000010 — assigned to Retailer A and B
* Salesman 1 targets (current month): 20 orders / ₹1,00,000 revenue / ₹50,000 dues collected

**Test Admin:**

* Email: admin@company.com / Password: Admin@123 (force change on first login)

\---

*End of Specification*

