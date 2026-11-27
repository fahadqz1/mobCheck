# Changelog

## [Unreleased] — branch `feature/ux-overhaul-auth-fixes` (27 Nov 2026)

### Fixed
- **Sessions no longer disappear between pages.** Replaced the `localStorage` JWT with server-side sessions in an httpOnly cookie; every page validates the session on the server and shares the user through one provider. Logout revokes the session (BUG-D).
- **Header and auth buttons are identical on every page**, with a mobile menu (BUG-A).
- Inspection submission, webhook processing, evidence upload, review rules, complaint audit logging, report QR codes and report numbering (BUG-G … BUG-Q).
- Accessibility: gallery button semantics, text contrast, account menu name (BUG-R, BUG-T, BUG-U).
- Ratings now come from real reviews instead of stored counters (BUG-M).

### Added
- Phone listing detail page with gallery and full-screen viewer, contact seller, WhatsApp, report listing, similar phones (BUG-B).
- Shop profile page with branding, services, reviews, availability and complaints (BUG-C).
- Marketplace search, filters, sort and pagination; sell-a-phone flow with photo upload; listing management.
- Shop registration and management: branding, services, inspectors, bookings, reviews, subscription.
- Full inspection lifecycle: booking with slot validation, sandbox checkout through a signed webhook, accept/decline/assign, checklist with photo evidence, report generation, confirm/dispute, refunds, reviews.
- Admin console: shops, listings and reports, bookings and disputes, complaints, users, payments.
- Public report verification with QR code, in-app notifications, profile and password management, forgot/reset password, 404/500 pages.
- Design system (tokens + shared components) and redesigned home page.
- Playwright regression suite (authentication, full lifecycle, responsive layout, accessibility).

### Database
- Additive migration `20261127000000` (listing battery/repair fields, shop branding, listing reports, notifications), applied with approval after backup and staging rehearsal. Rollback script in `docs/database/`.
- Insert-only checklist script (pending approval for the dev database).

### Removed
- Unused legacy endpoints superseded by the booking state machine (`inspections/book|complete|generate-report|inspector-dashboard`, `payments/create`, `upload/evidence`, `disputes`, `reviews`, old admin endpoints) and `lib/auth.ts` (JWT).
