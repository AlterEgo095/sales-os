# SALES OS — Worklog

## Task 1: Create the complete Prisma schema for SALES OS
**Status:** ✅ Completed
**Date:** 2026-03-05

### What was done
- Wrote the complete Prisma schema at `prisma/schema.prisma` with all 16 models:
  - **Tenant** — multi-tenant root entity with slug, status, JSON settings
  - **User** — auth + role (super_admin/admin/manager/agent/cashier/viewer), tenant-scoped, unique email per tenant
  - **House** — physical sales location, manager assignment (User), unique code per tenant
  - **Agent** — sales agent profile linked to User + House, unique code per tenant, unique userId (1:1 with User)
  - **Customer** — client record, optional digital-client fields (clientAccountId, agentReferentId), order source
  - **Product** — catalog item per house, SKU, unit price, currency
  - **Order** — customer order with multi-step status (draft→formalized→confirmed→completed/cancelled), agent (apporteur) + seller (vendeur)
  - **OrderItem** — line items with quantity, unit price, discount, total
  - **OrderEvent** — status-change audit trail (created|formalized|confirmed|cancelled|converted|completed)
  - **Sale** — completed sale (1:1 with Order via unique orderId), payments + commissions
  - **Payment** — payment against a sale, multiple methods (cash|mobile_money|bank_transfer|card)
  - **Stock** — inventory per tenant+house+product (unique compound key), quantity + reserved
  - **StockMovement** — inventory log (in|out|adjust|reserve|release), linked to Stock via stockId
  - **Commission** — agent commission per sale, percentage or fixed, status workflow (calculated→validated→paid)
  - **Target** — sales targets by period (e.g. 2026-Q1), for agent or house, type (revenue|orders|units)
  - **AuditEvent** — system-wide audit log, JSON changes snapshot, IP tracking

### Key design decisions
- **SQLite-compatible**: No native enums; used `String` fields with inline comments documenting allowed values
- **Column mapping**: Used `@map("snake_case")` for DB columns while keeping JS camelCase
- **Table mapping**: Used `@@map("plural_snake")` for all tables (users, houses, agents, etc.)
- **Bidirectional relations**: All required back-relations added (User↔House as manager, User↔Sale as seller, House↔Order, Product↔StockMovement)
- **Agent.userId unique constraint**: Added `@@unique([userId])` to enforce 1:1 User↔Agent profile
- **Sale.orderId unique constraint**: Added `@@unique([orderId])` to enforce 1:1 Order↔Sale conversion
- **StockMovement.stockId**: Added FK to Stock for proper Prisma one-to-many relation (Stock.movements ↔ StockMovement.stock)

### DB push result
```
🚀  Your database is now in sync with your Prisma schema. Done in 17ms
✔ Generated Prisma Client (v6.19.2) to ./node_modules/@prisma/client in 308ms
```

### Files changed
- `prisma/schema.prisma` — complete rewrite (16 models, ~370 lines)

---

## Task 5: Build the core library layer
**Status:** ✅ Completed
**Date:** 2026-03-05

### What was done
Created the complete core library layer with 8 TypeScript modules + NextAuth route + module directory structure:

1. **`src/lib/db.ts`** — Prisma single-instance client with dev hot-reload guard (`globalForPrisma` pattern)
2. **`src/lib/auth.ts`** — NextAuth v4 config with Credentials provider, JWT strategy, tenant-aware session callbacks (role, tenantId, tenantSlug injected into token/session), custom `/login` sign-in page
3. **`src/app/api/auth/[...nextauth]/route.ts`** — NextAuth catch-all API route exporting GET + POST handlers
4. **`src/lib/rbac.ts`** — Full RBAC permission matrix (6 roles × 18 actions), `can()`/`cannot()` helper functions
5. **`src/lib/events.ts`** — Redis event bus (ioredis) with `publishEvent()`/`subscribeToEvents()`, structured `AppEvent` interface (CQRS-aligned), global singleton pattern for dev
6. **`src/lib/audit.ts`** — Audit logger writing to `AuditEvent` table via Prisma, JSON changes snapshot
7. **`src/lib/tenant.ts`** — Tenant-scoped query helper (`tenantScope(id)`) returning `findMany` for all 12 tenant-owned entities
8. **`src/lib/engines/order-engine.ts`** — Order business façade: Pricing (calculateOrderTotal), Allocation (allocateToHouse), Fulfillment (transitionOrderStatus with state machine + OrderEvent audit)
9. **`src/lib/engines/commission-engine.ts`** — Commission bounded context: calculateCommission (percentage-based from agent.commissionRate), validateCommission, payCommission with status workflow

### Module directories created
- `src/modules/platform/.gitkeep`
- `src/modules/business/.gitkeep`
- `src/modules/intelligence/.gitkeep`

### RBAC Matrix Summary
| Action | super_admin | admin | manager | agent | cashier | viewer |
|--------|:-----------:|:-----:|:-------:|:-----:|:-------:|:------:|
| manage_tenants | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| manage_users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| create_orders | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| validate_orders | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| record_payments | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| access_audit | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### Order State Machine
```
draft → formalized → confirmed → completed
  ↓        ↓           ↓
cancelled cancelled  cancelled
```

### Files changed
- `src/lib/db.ts` — rewritten (removed query logging, clean singleton)
- `src/lib/auth.ts` — new
- `src/lib/rbac.ts` — new
- `src/lib/events.ts` — new
- `src/lib/audit.ts` — new
- `src/lib/tenant.ts` — new
- `src/lib/engines/order-engine.ts` — new
- `src/lib/engines/commission-engine.ts` — new
- `src/app/api/auth/[...nextauth]/route.ts` — new
- `src/modules/platform/.gitkeep` — new
- `src/modules/business/.gitkeep` — new
- `src/modules/intelligence/.gitkeep` — new

---

## Task 7: Build the main SALES OS dashboard UI
**Status:** ✅ Completed
**Date:** 2026-03-05

### What was done
Built the complete frontend dashboard UI with login page, main dashboard, stats API, and database seed:

1. **`src/app/login/page.tsx`** — Professional login page with:
   - Centered card on dark gradient background (#0a0f1a → #111827)
   - SALES OS logo/title with blue accent
   - Email + Password fields using shadcn Input
   - Login button with loading state
   - NextAuth signIn("credentials") integration
   - Error display ("Identifiants invalides")
   - On success: redirect to "/"
   - 'use client' directive

2. **`src/app/page.tsx`** — Main dashboard page with:
   - Sticky header: SALES OS logo + MVP V1 badge + "Tableau de bord" label
   - 4 stat cards row: Revenus totaux, Commandes, Clients, Agents actifs (with colored icons)
   - Recent Orders panel (2/3 width): lists orders with ID, customer name, amount, status badge
   - Quick Actions card (1/3 width): Nouvelle commande, Nouveau client, Nouveau produit, Enregistrer paiement
   - Modules card: Commandes, Clients, Produits, Objectifs, Analytics with counts
   - Loading skeleton states (pulse animation)
   - Empty state with icon
   - Footer: "SALES OS — MVP V1 — Architecture Implementation-Ready"
   - Fetches from /api/stats
   - Dark theme throughout (#0a0f1a, #111827, #1f2937)

3. **`src/app/api/stats/route.ts`** — Stats API endpoint:
   - Returns: totalOrders, totalSales, totalRevenue, totalCustomers, totalAgents, totalProducts, recentOrders
   - Revenue calculated from confirmed+completed orders aggregate
   - Recent orders include customer firstName/lastName
   - Error handling with empty fallback

4. **`prisma/seed.ts`** — Database seed script:
   - Creates tenant: "SALES OS Demo" (slug: demo)
   - Creates 3 users: admin, manager, agent (with plain-text passwords for dev)
   - Creates house: "Maison Kinshasa" (KIN-001)
   - Creates agent: AG-001 with 5% commission rate
   - Creates 3 customers: Jean Kabongo, Grace Mbuyi, David Nsimba
   - Creates 3 products: Pack Starter ($50), Pack Premium ($120), Service Consulting ($200)
   - Initializes stock: 100 units per product
   - Creates 2 sample orders (confirmed $170 + draft $200) with order items
   - Creates target: 2026-Q1 revenue $10,000 ($370 achieved)

5. **`package.json`** — Added `db:seed` script: `bunx tsx prisma/seed.ts`

6. **`src/app/layout.tsx`** — Updated metadata for SALES OS branding

### Seed result
```
🌱 Seeding SALES OS...
✅ Tenant created: demo
✅ Admin user created
✅ House created: KIN-001
✅ Agent created
✅ Customers created: 3
✅ Products created: 3
✅ Stock initialized
✅ Sample orders created
✅ Target created
🎉 Seeding complete!
```

### Login credentials
- Admin: admin@salesos.com / admin123
- Manager: manager@salesos.com / manager123
- Agent: agent@salesos.com / agent123

### Design system
- Background: #0a0f1a (deep navy)
- Surface: #111827 (gray-900)
- Border: #1f2937 (gray-800)
- Input border: #374151 (gray-700)
- Accent: blue-500/blue-600
- Status colors: gray (draft), yellow (formalized), blue (confirmed), green (completed), red (cancelled)

### Files changed
- `src/app/login/page.tsx` — new
- `src/app/page.tsx` — rewritten (full dashboard)
- `src/app/api/stats/route.ts` — new
- `prisma/seed.ts` — new
- `package.json` — added db:seed script
- `src/app/layout.tsx` — updated metadata

---

## Task 6: Build API routes for all SALES OS modules
**Status:** ✅ Completed
**Date:** 2026-03-05

### What was done
Created 23 Next.js App Router API route files covering all SALES OS modules with full CRUD operations. Each route follows the Next.js 16 pattern with `export async function GET/POST/PUT/DELETE` and uses `import { db } from '@/lib/db'` for database access.

### Platform Routes (8 files)
1. **`/api/tenants/route.ts`** — GET: list all tenants; POST: create tenant { name, slug }
2. **`/api/tenants/[id]/route.ts`** — GET, PUT, DELETE by id
3. **`/api/users/route.ts`** — GET: list users (?tenantId=); POST: create user
4. **`/api/users/[id]/route.ts`** — GET, PUT, DELETE by id
5. **`/api/houses/route.ts`** — GET: list houses (?tenantId=); POST: create house
6. **`/api/houses/[id]/route.ts`** — GET, PUT, DELETE by id
7. **`/api/agents/route.ts`** — GET: list agents (?tenantId=, ?houseId=); POST: create agent
8. **`/api/agents/[id]/route.ts`** — GET, PUT, DELETE by id

### Business Routes (13 files)
9. **`/api/customers/route.ts`** — GET: list customers (?tenantId=, ?houseId=); POST: create customer
10. **`/api/customers/[id]/route.ts`** — GET, PUT, DELETE by id
11. **`/api/products/route.ts`** — GET: list products (?tenantId=, ?houseId=); POST: create product
12. **`/api/products/[id]/route.ts`** — GET, PUT, DELETE by id
13. **`/api/orders/route.ts`** — GET: list orders (?tenantId=, ?status=) with include { customer, items }; POST: create order with items in transaction + OrderEvent "created"
14. **`/api/orders/[id]/route.ts`** — GET with include { customer, items, events }; PUT: if status changes, delegates to `transitionOrderStatus()`; DELETE: cancels order via order engine
15. **`/api/sales/route.ts`** — GET: list sales (?tenantId=); POST: create sale
16. **`/api/sales/[id]/route.ts`** — GET, PUT, DELETE by id
17. **`/api/payments/route.ts`** — GET: list payments (?tenantId=, ?saleId=); POST: create payment
18. **`/api/payments/[id]/route.ts`** — GET, PUT only
19. **`/api/stock/route.ts`** — GET: list stock (?tenantId=, ?houseId=) with include { product, house }; POST: upsert stock entry via compound unique key
20. **`/api/commissions/route.ts`** — GET: list commissions (?tenantId=, ?agentId=); POST: calculate commission via commission engine (`calculateCommission()`)
21. **`/api/targets/route.ts`** — GET: list targets (?tenantId=); POST: create target
22. **`/api/targets/[id]/route.ts`** — GET, PUT, DELETE by id

### Stats/Dashboard Route (1 file)
23. **`/api/stats/route.ts`** — GET: dashboard stats (?tenantId= required):
  - totalOrders, totalSales, totalRevenue (aggregate), totalCustomers, totalAgents, totalProducts
  - recentOrders (last 5 with customer + items)
  - topProducts (top 5 by order count via groupBy + product detail lookup)
  - All queries run in parallel via `Promise.all()` for performance

### Key patterns used
- **Next.js 16 params as Promise**: All `[id]` routes use `{ params }: { params: Promise<{ id: string }> }` and `await params` first
- **Consistent error handling**: All routes wrapped in try/catch returning `{ error: "Internal Server Error" }` with status 500
- **404 handling**: All `[id]` GET routes return 404 when item not found
- **Input validation**: POST routes validate required fields and return 400 on missing data
- **Order engine integration**: Orders [id] PUT uses `transitionOrderStatus()` for status changes (returns 409 on invalid transitions); DELETE cancels via engine
- **Commission engine integration**: Commissions POST delegates to `calculateCommission()` from the commission engine
- **Stock upsert**: Stock POST uses `db.stock.upsert()` with the compound unique key `tenantId_houseId_productId`
- **Transactional order creation**: Orders POST uses `db.$transaction()` to create order + items + event atomically

### TypeScript verification
- All 23 route files compile cleanly with zero errors in `src/app/api/**`

### Files changed
- `src/app/api/tenants/route.ts` — new
- `src/app/api/tenants/[id]/route.ts` — new
- `src/app/api/users/route.ts` — new
- `src/app/api/users/[id]/route.ts` — new
- `src/app/api/houses/route.ts` — new
- `src/app/api/houses/[id]/route.ts` — new
- `src/app/api/agents/route.ts` — new
- `src/app/api/agents/[id]/route.ts` — new
- `src/app/api/customers/route.ts` — new
- `src/app/api/customers/[id]/route.ts` — new
- `src/app/api/products/route.ts` — new
- `src/app/api/products/[id]/route.ts` — new
- `src/app/api/orders/route.ts` — new
- `src/app/api/orders/[id]/route.ts` — new
- `src/app/api/sales/route.ts` — new
- `src/app/api/sales/[id]/route.ts` — new
- `src/app/api/payments/route.ts` — new
- `src/app/api/payments/[id]/route.ts` — new
- `src/app/api/stock/route.ts` — new
- `src/app/api/commissions/route.ts` — new
- `src/app/api/targets/route.ts` — new
- `src/app/api/targets/[id]/route.ts` — new
- `src/app/api/stats/route.ts` — rewritten (enhanced with topProducts + parallel queries)

---
Task ID: V1
Agent: main
Task: SALES OS V1 — Core Fonctionnel Implementation

Work Log:
- Created navigation store (Zustand) at `src/store/navigation.ts` with ViewId type and setActiveView
- Built App Sidebar component using shadcn/ui Sidebar with dark navy theme at `src/components/layout/app-sidebar.tsx`
- Built DashboardView with live stats, recent orders, quick actions, and module shortcuts
- Built CustomersView with full CRUD (list, create, edit, delete), search, source/status badges
- Built ProductsView with full CRUD, search, category/status badges, price formatting
- Built OrdersView with create, status workflow (draft→formalized→confirmed→completed/cancelled), detail dialog
- Built AgentsView with CRUD, user/house selects, commission rate display
- Built PaymentsView with create, status management, method badges, stats cards
- Built StockView with inventory table, availability color coding, stock adjustment dialog
- Built SettingsView with platform status overview (IMPLEMENTE/PREPARE/DIFFERE)
- Rewrote page.tsx as App Shell with SidebarProvider + conditional view rendering
- Fixed tenants API to include houses relation for proper tenant/houseId resolution
- Fixed default exports in dashboard-view and orders-view to named exports
- All views verified with Agent Browser (navigation, CRUD operations, responsive)
- Customer creation flow tested end-to-end (Alice Mutombo created successfully)
- Lint passes clean, no console errors, mobile responsive verified

Stage Summary:
- V1 Core Fonctionnel is COMPLETE
- All 8 module views implemented: Dashboard, Customers, Products, Orders, Agents, Payments, Stock, Settings
- Full navigation with sidebar (9 views)
- CRUD operations functional for all business entities
- Order status workflow implemented (draft→formalized→confirmed→completed/cancelled)
- Dark navy theme consistent across all views
- Mobile responsive with collapsible sidebar
