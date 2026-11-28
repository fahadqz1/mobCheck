# Security Testing & Performance Report

## Security controls verified

| Control | Implementation | Verified by |
|---|---|---|
| Session tokens not readable by scripts | httpOnly, SameSite=Lax cookie; Secure in production; nothing in `localStorage` | AUTH-01 |
| Tokens useless if the DB leaks | Only SHA-256 of the session token stored | Code review, AUTH-05 |
| Server-side logout / revocation | Session row deleted; old cookie replay rejected | AUTH-05 |
| Expiry | 7-day sessions; expired rows deleted on read; redirect with explanation | AUTH-07 |
| Forged cookies | Unknown tokens → anonymous | AUTH-08 |
| Authorisation | Role checks on every protected page and endpoint; booking actions also check the caller's relationship to the booking | AUTH-09, J-08, J-09, J-16 |
| CSRF | SameSite=Lax + cross-origin `Origin` rejected on writes | AUTH-12 |
| Brute force | Login 10/15 min per IP+email; sign-up 20/h per IP; reset 5/15 min per IP; inquiries 20/h; complaints 5/day | Code review |
| Account enumeration | Forgot-password returns the same message for unknown emails; login uses one generic error | AUTH-10, code review |
| Passwords | bcrypt cost 12; min 8 chars with a letter and a digit; change signs out other devices; reset single-use, hashed, 1-hour expiry, signs out all devices | AUTH-11 |
| Input validation | Zod on every write endpoint with per-field errors | AUTH-10, J-07 |
| File uploads | Type decided by magic bytes (JPEG/PNG/WebP only), 8 MB limit, random file names, path-traversal-safe key regex, `nosniff` | J-01, J-06, J-09 |
| Private evidence | `/api/files/evidence/*` only for the booking's customer, shop owner, inspector and admins | Code review |
| Personal data exposure | No user or shop phone number or email is shown on any page; people talk through MobCheck Messages, where numbers, emails and outside chat links are blocked server-side. Public report omits IMEI, photos and buyer | J-02, J-08, J-11, FEAT-02, FEAT-05 |
| Photo privacy | Uploaded photos are re-encoded with EXIF/GPS removed and watermarked; chat photos visible only to participants (pending ones only to the sender and staff) | FEAT-03, FEAT-04 |
| Webhooks | HMAC-SHA256 over the raw body, constant-time comparison, secret mandatory in production, idempotent by event id | J-07, J-12 |
| Concurrency | Booking transitions use conditional `updateMany` so double clicks or racing users cannot apply two transitions | Code review |
| Headers | `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`; `X-Powered-By` removed | Code review |
| Third parties | Report QR codes generated locally (previously sent to an external QR API) | J-11 |
| Open image proxy | Removed `images.remotePatterns: '**'` from `next.config.js` | Code review |

Residual risks are listed in [Known issues](10_KNOWN_ISSUES.md) (in-memory rate limits, local file storage, no email verification of new accounts).

## Performance

Median of 5 warm requests on the local machine against the **production build** (`next build` + `next start`), and against the development server for comparison.

| Route | Production | Development | HTML/JSON size |
|---|---|---|---|
| `/` | 97 ms | 89 ms | 39.6 KB |
| `/marketplace` | 35 ms | 167 ms | 29.4 KB |
| `/marketplace?city=Lahore&sort=price_asc` | 27 ms | 57 ms | 25.5 KB |
| `/listings/[id]` | 42 ms | 108 ms | 23.0 KB |
| `/shops` | 32 ms | 238 ms | 23.4 KB |
| `/shops/hafeez-mobile-hub` | 46 ms | 258 ms | 18.0 KB |
| `/verify` | 8 ms | 39 ms | 7.9 KB |
| `GET /api/listings?city=Lahore` | 12 ms | 52 ms | 1.2 KB |
| `GET /api/shops` | 11 ms | 39 ms | 1.5 KB |
| `GET /api/brands` | 10 ms | 51 ms | 1.2 KB |
| `GET /api/auth/me` | 4 ms | 124 ms | < 0.1 KB |

Production build: all 79 routes compile; first-load JavaScript per page is 96–115 kB (92.5 kB shared framework). Production-only checks passed: session cookie is `Secure; HttpOnly; SameSite=lax`, the sandbox payment endpoint returns 404, `X-Powered-By` is absent.

Optimisations applied:

- Pages are server-rendered with only the fields they display (no `select *` of user records; listing cards load one photo).
- Images go through `next/image` (WebP, responsive `sizes`, lazy loading below the fold, immutable caching for listing and shop photos).
- Self-hosted variable font (no render-blocking request to Google Fonts).
- Filter changes navigate server-side with skeleton placeholders instead of re-fetching client-side.
- Shop ratings computed with one `groupBy` per page rather than per card.
- Existing indexes cover listing status/brand, booking status/shop/customer/inspector and session token lookups.

Further work: run `next build` and Lighthouse against production; move uploads to a CDN; cache brand lists.
