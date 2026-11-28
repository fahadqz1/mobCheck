# MobCheck

**Check before you buy.** A Pakistan-focused marketplace for used phones with professional, verifiable inspections at verified mobile shops.

## What works today

| Role | Features |
|---|---|
| Buyers & sellers | Browse and filter phones (search, city, brand, condition, PTA, price, sort), listing detail with photo gallery, chat with the seller in MobCheck Messages (phone numbers and emails blocked), report listing, save phones, sell a phone with watermarked photos, manage listings |
| Customers | Book an inspection at a verified shop, pay (sandbox checkout), track progress, read the report with photo evidence, confirm or dispute within the review window, review the shop, file complaints, notifications |
| Shop owners | Register shop (verified by MobCheck), logo/cover/gallery, services and prices, inspectors (with their own logins), accept/decline bookings, assign inspectors, payouts per booking, reviews, subscription |
| Inspectors | Assigned bookings, start inspection, iPhone/Android checklist, annotated photo evidence, submit, generate report |
| Admins | Platform overview, verify/reject/suspend/reinstate shops, moderate reported listings, resolve disputes and refunds, complaints, suspend users, payments and payouts |
| Public | Verify any report by number at `/verify` (QR code on every report); Help assistant and WhatsApp support on every page; PTA Status link to the official DIRBS site |

Not yet connected: a real payment gateway (a signed sandbox stands in), email delivery (reset links are logged in development), PDF export of reports. See [Known issues](docs/engineering/10_KNOWN_ISSUES.md).

## Run it locally

Requirements: Node.js 18+ (tested on 26). No PostgreSQL install needed.

```powershell
cd C:\Users\fahad\Desktop\MobCheck
npm install --legacy-peer-deps
node node_modules/@embedded-postgres/windows-x64/scripts/hydrate-symlinks.js
```

Create `packages/database/.env` and `apps/web/.env.local`, both containing:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/mobcheck_dev
```

Then, in two terminals:

```powershell
npm run db:start     # terminal 1: database (keep open)
npm run web          # terminal 2: http://localhost:3000
```

First time only: `npm run db:setup` (migrations + demo data).

Demo accounts (password `Password123`): `admin@mobcheck.pk`, `shop@mobcheck.pk`, `customer@mobcheck.pk`.

## Optional: AI features

Add `ANTHROPIC_API_KEY=...` to `apps/web/.env.local` yourself and restart. This turns on AI answers in the Help widget and automatic checks of chat photos. Without it, Help answers from the built-in FAQ and chat photos wait for staff review at Admin → Chat moderation.

## Tests

The regression suite uses a separate database so it never touches your data.

```powershell
# one-time: copy your dev DB to mobcheck_test (the web server must be stopped)
cd packages/database; $env:DATABASE_URL="postgresql://postgres:password@localhost:5432/mobcheck_dev"; node scripts/clone-db.mjs mobcheck_dev mobcheck_test; node scripts/seed-checklists.mjs

# test server on port 3100
cd apps/web; $env:DATABASE_URL="postgresql://postgres:password@localhost:5432/mobcheck_test"; $env:NEXT_DIST_DIR=".next-test"; $env:UPLOAD_DIR="uploads-test"; npx next dev -p 3100

# in another terminal
cd apps/web; npx playwright test
```

## Documentation

- Engineering: [architecture](docs/engineering/01_ARCHITECTURE.md) · [audit & bug register](docs/engineering/02_AUDIT_AND_BUG_REGISTER.md) · [auth & sessions](docs/engineering/03_AUTH_SESSION_ARCHITECTURE.md) · [database health & changes](docs/engineering/04_DATABASE_HEALTH_AND_CHANGES.md) · [design system](docs/engineering/05_DESIGN_SYSTEM.md) · [page specs](docs/engineering/06_PAGE_SPECS.md) · [test cases & results](docs/engineering/07_TEST_REPORT.md) · [security & performance](docs/engineering/08_SECURITY_PERFORMANCE.md) · [deployment](docs/engineering/09_DEPLOYMENT_NOTES.md) · [known issues](docs/engineering/10_KNOWN_ISSUES.md)
- Business: [BRD](docs/01_BRD.md) · [PRD](docs/02_PRD.md) · [database design](docs/11_DATABASE.md)
- [Changelog](CHANGELOG.md)

## Stack

Next.js 14 (TypeScript, Tailwind CSS), PostgreSQL + Prisma, Zod, Playwright + axe-core.
