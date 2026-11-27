# Test Cases & Regression Report

**Run:** 27 Nov 2026 · Playwright 1.65 · Google Chrome · test server `localhost:3100` on database `mobcheck_test` · `npx playwright test`
**Result: 46 tests: 43 passed, 0 failed, 3 skipped** (LAYOUT-03 is phone-only and is skipped by design on desktop, laptop and tablet). `tsc --noEmit`: 0 errors.

Device profiles: desktop 1440×900, laptop 1280×720, tablet iPad (gen 7) 810×1080, mobile Pixel 7 412×915.

## Customer journey

| ID | Steps | Expected | Result |
|---|---|---|---|
| AUTH-01 | Register a customer | Redirect to dashboard; `mc_session` cookie httpOnly + SameSite=Lax; no token in localStorage | Pass |
| J-02 | Search "S24 Ultra", filter city, reload, open listing, use thumbnails, next, full screen (←, Esc), check WhatsApp link and similar phones | Filters in URL survive refresh; gallery counter updates; viewer opens/closes; WhatsApp link uses seller's number | Pass |
| J-03 | Contact seller, report listing; seller opens manage page | Message stored and visible to seller; report accepted | Pass |
| J-07 | Book on a Sunday (shop closed) then a Monday; pay via checkout | Closed-day error shown; booking created, Rs 1,000 paid, status "Awaiting shop" | Pass |
| J-10 | Open report from notification bell; confirm; leave 5-star review | Report shows "Overall: Fair" and inspector notes; booking completed; review shown on shop page; count = 1 | Pass |
| J-11 | Verify report by number (invalid then valid, lowercase); open unknown number | Validation message; authentic report with QR; buyer name absent; 404 for unknown | Pass |
| J-12 | Raise a dispute on a delivered report | "Dispute under review" | Pass |
| J-13 | Shop declines a paid booking | Refund record created | Pass |
| J-14 | File complaint from a booking | Complaint submitted | Pass |
| AUTH-03 | Update/refresh profile page | Profile values persist after reload | Pass |

## Seller and shop owner (vendor) journey

| ID | Steps | Expected | Result |
|---|---|---|---|
| J-01 | Create listing with 3 photos, battery 91%, repair history, WhatsApp contact | Listing live with exact title, price, battery and repair text; 3 photos stored | Pass |
| J-04 | Register as shop owner, register shop with Sunday holiday | Pending banner; public profile returns 404 until verified | Pass |
| J-06 | Upload logo, add service, add inspector; view public profile | Logo shown; service listed; temporary password shown once in `xxxxxx-0000` format; profile shows verified badge and 1 active inspector | Pass |
| J-08 | Open booking, see customer contact, accept, assign inspector | Status moves to "Inspector assigned" | Pass |
| J-13 | Decline with reason | Toast and refund | Pass |
| LAYOUT-04 | Open all vendor pages on every device | 200, heading visible, no horizontal scroll | Pass (4 devices) |

## Inspector journey

| ID | Steps | Expected | Result |
|---|---|---|---|
| J-09 | Log in with temporary password; start; fill 31 checklist items (one "Needs attention" with note); submit disabled until photos added; upload 2 annotated photos; refresh; submit; generate report | Draft survives refresh; submission saved; report generated with assessment FAIR | Pass |

## Admin journey

| ID | Steps | Expected | Result |
|---|---|---|---|
| J-05 | Verify pending shop | Status Verified | Pass |
| J-12 | Resolve dispute with refund; mark refund paid | Booking Refunded; payment status REFUNDED | Pass |
| J-14 | Resolve complaint with warning | Complaint updated | Pass |
| J-15 | Remove reported listing; suspend seller; seller login blocked; reactivate | Listing 404 publicly; "This account is not active"; reactivated | Pass |
| J-16 | Dashboard and refunded payments; admin opening a vendor page | Revenue tile; refunded payment row; vendor page denied | Pass |

## Authentication regression

| ID | Case | Result |
|---|---|---|
| AUTH-01 | Register → secure cookie, nothing in localStorage | Pass |
| AUTH-02 | Login then navigate home → marketplace → listing detail → shops → shop profile → bookings → profile → dashboard; header shows the user on every page | Pass |
| AUTH-03 | Login then refresh | Pass |
| AUTH-04 | Open protected URL directly → login → returned to that URL | Pass |
| AUTH-05 | Logout → session row deleted → protected URLs redirect → replaying the old cookie fails | Pass |
| AUTH-06 | Switch accounts (customer → shop owner) | Pass |
| AUTH-07 | Expired session → redirect with "Your session has ended" | Pass |
| AUTH-08 | Forged cookie → anonymous | Pass |
| AUTH-09 | Customer opening admin/vendor/inspector pages → denied; admin API → 403 | Pass |
| AUTH-10 | Wrong password and empty registration show messages | Pass |
| AUTH-11 | Forgot password → reset → log in with new password | Pass |
| AUTH-12 | Cross-origin write → 403 | Pass |

## Responsive and header tests

| ID | Case | Desktop | Laptop | Tablet | Mobile |
|---|---|---|---|---|---|
| LAYOUT-01 | Log in/Sign up (or menu button) have identical position and size on 8 public pages; header height 65px; no horizontal scroll | Pass | Pass | Pass | Pass |
| LAYOUT-02 | Signed-in header control identical on 4 pages and after refresh | Pass | Pass | Pass | Pass |
| LAYOUT-03 | Mobile menu opens, shows auth links, navigates, closes | Skipped | Skipped | Skipped | Pass |
| LAYOUT-04 | 20 dashboard pages across customer, vendor and admin load without horizontal scroll | Pass | Pass | Pass | Pass |

## Accessibility

| ID | Case | Result |
|---|---|---|
| A11Y-01 | axe-core WCAG 2.0/2.1 A + AA on 8 public and 3 signed-in pages: no serious or critical violations | Pass (after fixing BUG-T, BUG-U) |
| A11Y-02 | Skip link is first focus; login and account menu usable with keyboard only (Enter/Esc) | Pass |

## Failures found and fixed during testing

| Test | Failure | Cause | Fix |
|---|---|---|---|
| J-02 | Thumbnail buttons not found by role | `role="listitem"` on buttons (BUG-R) | Semantic list |
| J-09 | Checklist draft empty after refresh | Effect ordering (BUG-S) | Save after load |
| A11Y-01 | Contrast and label-name violations | BUG-T, BUG-U | Colour and naming changes |
| AUTH-01 | Timeout on first request | Dev server cold compile | Longer navigation timeout in helpers (test-only) |
| AUTH-09, LAYOUT-01/02 (tablet), J-02/J-04/J-09 | Test assumptions (HTTP method, tablet breakpoint, leftover data, label asterisk, duplicate text) | Test code | Test code corrected; app unchanged |
