# Known Issues & Limitations

| ID | Issue | Impact | Plan |
|---|---|---|---|
| KI-01 | No real payment gateway; the checkout is a signed sandbox (disabled in production) | Cannot take money yet | Integrate Safepay/PayFast hosted checkout → existing `/api/payments/webhook` |
| KI-02 | Emails are not sent; password reset links are logged (and shown on screen in development only) | Users cannot reset passwords in production | Add SendGrid/SES in `forgot-password` |
| KI-04 | Shop subscription renewal is simulated; `Payment.bookingId` is required so subscriptions cannot be billed through `Payment` | No real subscription billing | Migration: nullable `bookingId` + `purpose` column |
| KI-05 | Review windows settle when bookings are viewed, not on a timer | A payout may stay "pending" until someone opens the booking | Add a scheduled job calling `settleExpiredReviewWindows()` |
| KI-06 | Rate limiting is in-memory | Limits reset on restart and are per instance | Redis-backed limiter for production |
| KI-07 | Uploaded images are stored on local disk | Not suitable for multi-instance hosting | S3/R2 driver behind `lib/storage.ts` |
| KI-08 | Reports are web pages with QR verification; no PDF download | Customers cannot attach a PDF | Generate PDFs from the report page |
| KI-09 | ~~Inquiries are one-way~~ Resolved: in-app Messages (28 Nov 2026). Old inquiries remain readable on the listing dashboard | — | — |
| KI-10 | `Shop.averageRating`/`totalReviews` for the 5 demo shops still hold seed values in the database (the UI ignores them) | None in the UI | Recalculate once real reviews exist, or with your approval |
| KI-11 | Shop verification documents are not uploaded through the UI (`ShopDocument` table unused) | Admins verify documents offline | Document upload step in shop registration |
| KI-12 | Demo listings have no photos | Cards show a neutral "No photos yet" state | Sellers upload real photos; no stock images are used |
| KI-13 | `jsonwebtoken`, `jose`, `next-auth`, `axios`, `react-hook-form` remain in `package.json` but are unused | Larger install | Remove in a dependency clean-up (left to avoid unrequested package removals) |
| KI-14 | Leftover databases `mobcheck_staging` and `mobcheck_rollback_check` | Disk space only | Drop when you no longer need them (not dropped without your approval) |
| KI-15 | The AI assistant and automatic chat-photo checks need an Anthropic API key. Without it the Help widget answers from the built-in FAQ and every chat photo waits for staff review | Slower photo delivery | Add `ANTHROPIC_API_KEY=...` to `apps/web/.env.local` yourself (never paste keys into chat) and restart |
| KI-16 | The WhatsApp button opens a chat with a pre-filled message; it does not auto-reply | Replies depend on staff | WhatsApp Business app "greeting/away messages", or the WhatsApp Business Platform API for a bot |
| KI-17 | Contact detection can be beaten by determined users (e.g. a number drawn in a photo, or split across many messages) | Some leakage | Photo review/AI checks, repeat-offender list in moderation; consider per-conversation sliding-window checks |
| KI-18 | "Pakistan's 1st Phone Inspection Marketplace" is a marketing claim | Advertising-standards risk if challenged | Keep evidence (launch date, market search) or soften to "Pakistan's phone inspection marketplace" |
| KI-19 | Saved phones live in the browser (`localStorage`), not the account | Not shared across devices | Add a `SavedListing` table (needs an approved migration) |
| KI-20 | Terms, Privacy and Refund pages are plain-language drafts written from how MobCheck works today; no company registration details are shown | Legal exposure if relied on as-is | Have a Pakistani lawyer review before public launch; add the registered company name/SECP number to the footer once available |
| KI-21 | Footer has no social media icons, payment-method logos or app-store badges | None | Add once official accounts exist, the payment gateway is live (KI-01) and apps are published |
