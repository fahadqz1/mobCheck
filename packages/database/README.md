# @mobcheck/database

Database schema, migrations, and utilities for MobCheck.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure database

Create `.env.local` in the root with:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/mobcheck_dev
```

### 3. Run migrations

```bash
npm run db:migrate
```

This will:
- Create all database tables
- Set up indexes and constraints
- Apply any pending migrations

### 4. Seed development data

```bash
npm run db:seed
```

This seeds:
- Phone brands and models
- Platform settings
- Inspection checklists

## Available Commands

```bash
# Generate Prisma client (auto-runs on schema changes)
npm run db:generate

# Create and apply migrations
npm run db:migrate

# Apply existing migrations (CI/CD)
npm run db:migrate:deploy

# Reset database (deletes all data!)
npm run db:reset

# Open visual database browser
npm run db:studio

# Validate schema
npm run db:validate
```

## Schema Overview

The Prisma schema includes:

- **Authentication:** Users, sessions, email tokens
- **Marketplace:** Brands, models, listings, photos, inquiries
- **Shops:** Shop profiles, subscriptions, services, documents
- **Inspectors:** Inspector profiles, availability
- **Inspections:** Bookings, checklists, results, evidence, reports
- **Payments:** Payments, refunds, payout ledger
- **Community:** Reviews, complaints, shop bans
- **Admin:** Audit logs, webhook logs, settings

## Type Generation

Prisma automatically generates TypeScript types in `node_modules/@prisma/client`.

Import types in your code:

```typescript
import { User, InspectionBooking } from '@prisma/client';
```

## Migrations

Migrations are auto-generated from schema changes:

```bash
npm run db:migrate
```

This creates a migration file in `migrations/` with the SQL changes.

For CI/CD:

```bash
npm run db:migrate:deploy
```

## Documentation

See `/docs/11_DATABASE.md` for complete database design documentation.
