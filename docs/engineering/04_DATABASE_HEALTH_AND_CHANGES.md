# Database Health Report & Change Register

## Provider and topology

- PostgreSQL run locally through the `embedded-postgres` npm package (v19.0.0-beta.20, a pre-release; use a managed PostgreSQL in production), data in `packages/database/.pgdata`. Prisma 5.22.
- Databases on the local server: `mobcheck_dev` (application), `mobcheck_staging` (migration rehearsal clone), `mobcheck_test` (regression tests), `mobcheck_rollback_check` (rollback rehearsal clone; safe to delete when no longer needed, which this audit did not do because no `DROP DATABASE` is run without your approval).

## Inspection method

Read-only first: `scripts/db-report.mjs` (row counts per table), schema review, query review of every API route and page. Backups were taken before any change by stopping PostgreSQL cleanly and copying the data directory:

| Backup | Taken |
|---|---|
| `C:\Users\fahad\Desktop\MobCheck-db-backups\pgdata-20261127-042849` | before the audit |
| `C:\Users\fahad\Desktop\MobCheck-db-backups\pgdata-20261127-045850-pre-migration` | immediately before the approved migration |
| `C:\Users\fahad\Desktop\MobCheck-db-backups\pgdata-20261127-233605-pre-checklists` | before adding checklist items |

Restore: stop PostgreSQL, rename `packages/database/.pgdata`, copy a backup folder in its place, start `npm run db:start`.

## Records in `mobcheck_dev` (unchanged by this work)

| Table | Rows before | Rows after |
|---|---|---|
| User | 4 | 4 |
| Shop | 5 | 5 |
| PhoneListing | 6 | 6 |
| CustomerProfile / ShopOwnerProfile | 2 / 1 | 2 / 1 |
| Brand / Model | 4 / 3 | 4 / 3 |
| InspectionChecklist | 11 | 11 |
| PlatformSetting | 5 | 5 |
| Session | 0 | varies (login sessions) |
| _prisma_migrations | 1 | 2 |

## Findings

| ID | Finding | Severity | Resolution |
|---|---|---|---|
| DB-01 | Schema failed validation (≈15 relation errors: ambiguous `User` relations on `Complaint`, missing back-relations, both sides of `Payment`↔`Booking` declaring `fields`, non-unique one-to-one keys) so no migration could run | Critical | Fixed in commit `d4b459a` before this audit |
| DB-02 | `Shop.averageRating`/`totalReviews` hold values (e.g. 4.8 / 126) with **zero** rows in `Review` (introduced by the demo seed) | High (shows fabricated trust signals) | Not modified. The app now computes ratings from published `Review` rows (`lib/shop.ts#liveRatings`). The stale columns are only rewritten when a real review is added |
| DB-03 | No Android checklist rows; iPhone checklist covers only physical and display checks | High (Android inspections impossible) | Insert-only script `scripts/seed-checklists.mjs`, verified on `mobcheck_test`, then applied to `mobcheck_dev` after a backup (+51 rows) |
| DB-04 | `Payment.bookingId` is required, so shop subscription fees cannot be recorded as payments | Medium | Documented; subscription renewal is simulated in sandbox only. Needs a future migration making `bookingId` nullable and adding a `purpose` column |
| DB-05 | `InspectionBooking.paymentId` duplicates `Payment.bookingId` | Low | Kept for compatibility; relation defined from the `Payment` side only |
| DB-06 | Webhook handler wrote `body.event` (e.g. `payment.success`) into the `WebhookType` enum, which would throw | High | Fixed in code (mapped to `PAYMENT_SUCCESS`/`PAYMENT_FAILED`) |
| DB-07 | Complaints wrote an `AdminAction` row with the **customer** as `adminId` | Medium (corrupts audit log) | Fixed in code. Existing rows: none were affected (0 complaints) |
| DB-08 | Inspection submit compared `Inspector.id` with `User.id`, so results could never be saved | High | Fixed in code |
| DB-09 | Indexes cover the hot paths (listing status/brand, booking status/shop/customer, session token) | — | No change needed |

## Change register

| Change | Type | Approved | Applied to | Verification | Rollback |
|---|---|---|---|---|---|
| `20261127000000_listing_details_shop_branding_reports_notifications`: nullable `PhoneListing.batteryHealth`, `repairHistory`; `Shop.logoUrl`, `coverUrl`, `galleryUrls` (default `{}`); new `ListingReport`, `Notification` tables and two enums | Additive only | Yes (owner, 27 Nov 2026) | staging → dev → test | Row counts identical before/after on staging and dev | `docs/database/rollback-20261127000000.sql`, rehearsed on `mobcheck_rollback_check` |
| Insert standard checklist items (`seed-checklists.mjs`) | Insert-only reference data | Yes (owner delegated the decision, 27 Nov 2026) | test → dev | dev: 11 → 62 rows (31 iPhone, 31 Android); users/shops/listings unchanged; re-run inserts 0 | Restore backup `pgdata-20261127-233605-pre-checklists`, or delete checklist rows created on 27 Nov 2026 that have no inspection results |

No `DROP`, `TRUNCATE`, reset or destructive command was run against `mobcheck_dev`. Data written during regression tests went only to `mobcheck_test`.
