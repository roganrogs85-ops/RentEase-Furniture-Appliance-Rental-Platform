# Rentease

Production-style furniture and appliance rental platform with a responsive HTML/CSS/JavaScript frontend and a Node.js REST backend. The backend serves the website, stores data in `data/db.json`, and exposes APIs for products, users, orders, rentals, maintenance, and admin analytics.

## Product Summary

Rentease helps urban renters avoid high upfront purchase costs and relocation friction by offering affordable monthly rentals for furniture, appliances, and bundled home setups.

## Objectives

- Provide flexible monthly rental plans with tenure choices.
- Simplify access to beds, sofas, tables, refrigerators, washing machines, TVs, and bundles.
- Support delivery scheduling, pickup, maintenance, rental extension, and rental history.
- Give admins and vendors a clear view of inventory, delivery schedules, claims, utilization, and maintenance.
- Encourage sustainable consumption by reducing unnecessary ownership.

## In Scope

- Responsive web-based platform.
- Product catalog for furniture, appliances, and bundles.
- Product detail views with rent, deposit, city, availability, and tenure.
- Cart and checkout with delivery city, date, and location.
- Active rental management with extension and pickup requests.
- Maintenance support request flow.
- Admin dashboard for inventory, schedules, claims, and reporting.
- Backend persistence in `data/db.json`, with browser storage fallback for cart and offline/demo use.

## Out of Scope

- Native mobile apps.
- Cross-border rentals.
- Advanced AI pricing.
- Second-hand resale marketplace.
- Real payment gateway and password-based authentication. The current backend supports registration/profile persistence and is payment-ready.

## Key Features

- User registration profile modal.
- Catalog filtering and search.
- Add to cart and checkout.
- Delivery scheduling.
- Active rentals and rental status updates.
- Maintenance ticket creation.
- Admin inventory and service dashboard.
- Exportable operations report.
- REST API backend with JSON persistence.
- Mobile-first responsive layout.

## Data Model

### Product

- `id`
- `name`
- `category`
- `type`
- `rent`
- `deposit`
- `tenures`
- `city`
- `stock`
- `rented`
- `status`
- `image`
- `description`

### Rental

- `id`
- `productId`
- `tenure`
- `city`
- `deliveryDate`
- `address`
- `status`

### Support Ticket

- `id`
- `product`
- `status`
- `eta`
- `notes`

## Backend

The project includes a dependency-free Node.js backend in `server.js`.

### Current API Routes

- `GET /api/health`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/auth/register`
- `GET /api/rentals`
- `POST /api/orders`
- `PATCH /api/rentals/:id`
- `GET /api/maintenance`
- `POST /api/maintenance`
- `GET /api/admin/analytics`

### Current Backend Storage

- `data/db.json` stores users, products, orders, rentals, and maintenance tickets.
- Product inventory is updated when orders are created.
- Rental status is updated when users request extension or pickup.
- Analytics are calculated from the stored data.

## Future Production Plan

Suggested production stack for a larger deployment:

- Frontend: React or Next.js with Tailwind CSS.
- Backend: Node.js with Express.js.
- Database: PostgreSQL for transactional inventory and orders, or MongoDB for document-oriented rental records.
- Auth: JWT sessions with refresh token rotation or managed auth.
- Payments: Razorpay, Stripe, or equivalent provider.
- Deployment: Vercel or Netlify for frontend, AWS or Render/Fly.io for API, managed PostgreSQL.

## Non-Functional Requirements

- Performance: static assets and lightweight JavaScript target sub-3-second load on normal connections.
- Security: form validation, payment-ready checkout design, no sensitive data committed. Production requires HTTPS, server validation, encrypted passwords, CSRF protection where relevant, and secure payment provider integration.
- Reliability: inventory and rental records are represented as structured data; production should move JSON storage to a transactional database.
- Usability: responsive layout, accessible labels, keyboard escape for overlays, clear states.
- Scalability: city-aware data model supports multi-city expansion.

## KPIs Represented

- Active rentals.
- Monthly recurring revenue.
- Product utilization.
- Maintenance request resolution time.
- Claims and support queue visibility.

## Run Locally

Run the backend and website together:

```bash
npm start
```

Then visit `http://localhost:4173`.

You can also open `index.html` directly, but backend persistence and API routes require `npm start`.

## Deployment

Deploy as a Node.js app when using the backend. The start command is `npm start`, and the app listens on `process.env.PORT` or `4173`.
