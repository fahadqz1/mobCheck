# MobCheck — Current Application Architecture

_Last updated: 27 Nov 2026 · branch `feature/ux-overhaul-auth-fixes`_

## Overview

MobCheck is a Next.js 14 monorepo app (pages router for UI, app router for JSON APIs) backed by PostgreSQL through Prisma.

```
MobCheck/
├── apps/web/                      Next.js application
│   ├── src/pages/                 UI routes (server-rendered with getServerSideProps)
│   │   ├── index, marketplace, verify, 404, 500
│   │   ├── auth/                  login, register, forgot-password, reset-password
│   │   ├── listings/              [id] detail, new
│   │   ├── shops/                 index directory, [slug] profile
│   │   ├── bookings/new           booking form
│   │   ├── checkout/[paymentId]   sandbox checkout
│   │   ├── reports/[reportNumber] public report verification
│   │   ├── dashboard/             overview (role aware), profile, bookings, listings
│   │   ├── vendor/                shop, services, inspectors, bookings, reviews, subscription
│   │   ├── inspector/             assigned inspections, inspection workspace
│   │   └── admin/                 shops, listings, bookings, complaints, users, payments
│   ├── src/app/api/               JSON route handlers (see API map below)
│   ├── src/components/            ui/ (design system), layout/, listings/, shops/, bookings/, media/, admin/, vendor/
│   ├── src/context/AuthContext    client auth state shared by every page
│   ├── src/lib/                   session, ssr-auth, bookings state machine, payments, storage, validation, format
│   └── tests/e2e/                 Playwright regression suite
├── packages/database/
│   ├── prisma/schema.prisma       33 models
│   ├── prisma/migrations/         init + 20261127000000 additive migration
│   └── scripts/                   local-db, db-report, clone-db, run-sql, seed-checklists
└── docs/                          business docs + docs/engineering (this folder)
```

## Request flow

1. **Pages** run `getServerSideProps`. Protected pages call `requirePageAuth(ctx, roles)` which reads the `mc_session` cookie, validates it against the `Session` table and either redirects (`/auth/login?next=…`, `/dashboard?denied=1`) or returns the user plus page data. The user is passed to `_app` and seeded into `AuthProvider`, so the header never flashes a logged-out state.
2. **Client mutations** call same-origin JSON APIs through `lib/client.ts` (`api()`); the browser sends the httpOnly cookie automatically. A 401 dispatches a `session-expired` event that redirects to login.
3. **API handlers** call `requireUser(request, roles)` → user or a 401/403 response. Input is validated with Zod (`parseBody`) and field errors are returned as `{ error, fields }`.

## Domain modules

| Module | File | Responsibility |
|---|---|---|
| Sessions | `lib/session.ts` | Random 256-bit tokens, SHA-256 at rest, cookie helpers, role guard, cross-origin write rejection |
| Booking state machine | `lib/bookings.ts` | `transition()` (optimistic status guard), refunds, report generation, completion, payout ledger, lazy review-window settlement |
| Payments | `lib/payments.ts` | HMAC-SHA256 webhook signing/verification, idempotent event handling via `WebhookLog.gatewayEventId` |
| Storage | `lib/storage.ts` | Local-disk driver, magic-byte image validation, path-traversal-safe keys; served via `/api/files/[...key]` with access checks |
| Scheduling | `lib/schedule.ts` | Slot validation in Pakistan time (UTC+5): lead time, 30-day horizon, shop hours, holidays, inspector days |
| Notifications | `lib/notify.ts` | In-app notifications (never fail the parent action) |

## Booking lifecycle

```
AWAITING_PAYMENT ──pay──▶ AWAITING_SHOP_CONFIRMATION ──accept──▶ BOOKING_ACCEPTED ──assign──▶ INSPECTOR_ASSIGNED
      │cancel                    │cancel/decline → REFUND_PENDING ──mark_refunded──▶ REFUNDED
      ▼                          ▼
  CANCELLED            INSPECTOR_ASSIGNED ──start──▶ INSPECTION_IN_PROGRESS ──submit──▶ INSPECTION_SUBMITTED
                                                                                   │generate_report
                                                                                   ▼
            COMPLETED ◀──confirm / window expiry── REPORT_DELIVERED ──dispute──▶ DISPUTE_RAISED
                ▲                                                                   │ release / refund (admin)
                └───────────────────────────────────────────────────────────────────┘
```

Every transition goes through `POST /api/bookings/[id]/actions`, which checks the caller's party (customer, shop, inspector, admin) and uses `updateMany … where status in (...)` so two concurrent actions cannot both succeed.

## API map

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/{login,register,logout,password,forgot-password,reset-password}`, `GET/PATCH /api/auth/me` |
| Listings | `GET/POST /api/listings`, `PATCH /api/listings/[id]`, `POST /api/listings/[id]/photos`, `PATCH/DELETE /api/listings/[id]/photos/[photoId]`, `POST /api/listings/[id]/inquiries`, `POST /api/listings/[id]/report` |
| Shops | `GET /api/shops`, `GET /api/brands`, `POST /api/complaints` |
| Vendor | `POST/PATCH /api/vendor/shop`, `POST/DELETE /api/vendor/shop/images`, `POST /api/vendor/services`, `PATCH/DELETE /api/vendor/services/[id]`, `POST /api/vendor/inspectors`, `PATCH /api/vendor/inspectors/[id]`, `POST /api/vendor/subscription` |
| Bookings | `POST /api/bookings`, `POST /api/bookings/[id]/actions`, `POST/DELETE /api/bookings/[id]/evidence` |
| Payments | `POST /api/payments/webhook` (signed), `POST /api/payments/sandbox/[paymentId]` (disabled in production) |
| Reports | `GET /api/reports/verify/[reportNumber]`, `GET /api/inspections/checklists/{iphone,android}` |
| Admin | `POST /api/admin/shops/[id]`, `PATCH /api/admin/{complaints,users,listing-reports}/[id]` |
| Misc | `GET/POST /api/notifications`, `GET /api/files/[...key]` |

## Environments

| Environment | URL | Database |
|---|---|---|
| Local dev | http://localhost:3000 | `mobcheck_dev` (embedded PostgreSQL, `packages/database/.pgdata`) |
| Regression tests | http://localhost:3100 | `mobcheck_test` (clone; tests refuse any other DB) |
| Migration staging | — | `mobcheck_staging` (clone used to rehearse migrations) |
