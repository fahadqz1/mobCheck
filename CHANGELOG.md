# Changelog

## [Unreleased] — branch `feature/liquid-glass-theme` (28 Nov 2026)

### Added — safe messaging, help and trust
- **MobCheck Messages**: in-app chat between buyers and sellers (from a listing), customers and shops (from a shop profile) and customers and shops about a booking. Unread badge in the header, inbox and thread view on desktop and mobile.
- **Contact sharing is blocked.** Phone numbers (including spaced, dotted, Urdu/Arabic digits and digits written as words in English or Roman Urdu), email addresses and outside chat links (WhatsApp, Telegram, wa.me…) are refused by the server. The sender sees a warning while typing and a "Not sent" bubble; the other person never receives it. IMEI numbers are still allowed.
- **Chat photos**: only photos of a phone, its box or accessories. With an AI key they are checked automatically; without one they wait for staff review at **Admin → Chat moderation** (approve/reject, blocked attempts, repeat offenders).
- **Watermark on every phone photo**: listing photos, chat photos and inspection evidence are resized to at most 1600px, stripped of EXIF/GPS data and stamped with a MobCheck mark.
- **Help on every page**: a floating Help assistant (instant answers from the help content; AI answers when `ANTHROPIC_API_KEY` is set) with a one-tap **WhatsApp +92 317 4351383** button that pre-fills the question and page. New Help centre page (`/help`).
- **PTA Status** link in the header chip row (desktop/tablet) and the mobile menu. Opens the official PTA DIRBS site (https://dirbs.pta.gov.pk/) in a new tab; no PTA logo, no API, scraping or IMEI submission, and a tooltip states MobCheck is not affiliated with PTA.
- **Header tabs redesigned** after comparing phone marketplaces (PriceOye, Swappa, Back Market): a **Phones** menu groups Brands, Budget (under Rs 50,000 … above Rs 2 lakh) and Condition, with an inspection call-to-action; the rest of the row is plain-text tabs (no more mix of tabs with and without icons). Mobile menu shows the same groups.
- **One search at a time on the home page**: the header search is hidden while the hero search is on screen and slides in after you scroll past it (space is reserved, so nothing jumps). Other pages are unchanged.
- **New footer** on every page except Messages and Checkout (now also on dashboards and sign-in pages): trust strip, About / Help / Services / For shops columns, WhatsApp support, legal links and a PTA non-affiliation notice.
- **New pages**: About MobCheck, Terms of use, Privacy policy, Refunds and cancellations. Help centre questions can be linked directly (e.g. `/help#safety`).
- **Saved phones**: heart button on listing cards, `/saved` page (stored on this device).

### Changed
- Home badge now reads "Pakistan's 1st Phone Inspection Marketplace".
- Listing cards: condition grade colour chip, PTA label, save button, larger price, hover arrow. Shop cards: glass rating pill, service and inspection-count chips, "View shop" arrow.
- Seller, shop and customer phone numbers and emails are no longer shown on listing, shop or booking pages; everyone talks through Messages. The listing form's "contact preference" became a privacy note.
- Toasts are centred so they don't sit under the Help button.

### Fixed
- Listing cards could trigger a hydration error when their "N minutes ago" label ticked over between server render and page load.
- Typing a new chat message while the previous one was still sending could wipe the new text.

### Changed
- New visual theme: ink and lime palette with pastel category tiles, Bricolage Grotesque display type, pill buttons and chips, larger radii, warm off-white background.
- "Liquid glass" surfaces (frosted, blurred panels with a highlight edge and a pointer-following sheen) on the header, hero report card, promise cards and image badges, with solid fallbacks for reduced transparency.
- Header: announcement strip, sticky glass bar with pill search, category chip row (brands, PTA approved, shops, sell, verify), richer mobile sheet.
- Home page rebuilt: lime hero with search, sample-report glass card, brand carousel with live listing counts, promo panels, "Fresh on MobCheck" with sliding liquid tabs that filter live data, promise strip, how-it-works, shop and review carousels, shop CTA.
- Listing and shop cards: inset photo tiles, "Inspection available" glass badge, display-font prices, hover lift; shops without a cover get a pastel tile.
- Marketplace quick brand chips; dashboard navigation as ink pills.

### Fixed
- Secondary text raised from slate-500 to slate-600 for WCAG AA contrast on the new background; step numbers darkened.
- Missing favicon (404) replaced with an SVG icon.

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
