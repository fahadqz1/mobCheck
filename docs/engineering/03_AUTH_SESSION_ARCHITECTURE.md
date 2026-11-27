# Authentication & Session Architecture

## Root cause of BUG-D ("login data disappears between pages")

| Observation (reproduced with Playwright before the fix) | Cause |
|---|---|
| After login, opening `/marketplace` showed **Login / Register** again | Every page had its own hard-coded `<nav>`; none of them read any auth state |
| Only `/dashboard` "knew" the user | Login stored a JWT and the user object in `localStorage`; only the dashboard read it, client-side, after render |
| API calls from pages were anonymous | No page attached the token, and no cookie existed (`cookieNames: []`) |
| Logout could not end the session | A stateless 24h JWT cannot be revoked server-side |
| `/vendor/dashboard`, `/inspector/dashboard`, `/admin/dashboard` 404'd after login | Login redirected to routes that did not exist |

Storing a bearer token in `localStorage` also exposes it to any XSS payload.

## Design

```
Browser                         Next.js                                 PostgreSQL
───────                         ───────                                 ──────────
POST /api/auth/login  ───────▶  verify bcrypt hash, rate limit
                                token = 32 random bytes (base64url)
                                Session{ token: sha256(token), expiresAt: +7d, ip, ua } ──▶ INSERT
Set-Cookie: mc_session=token; HttpOnly; SameSite=Lax; Secure(prod); Path=/; Expires=+7d
                         ◀───────
GET /any-page (cookie)  ─────▶  getServerSideProps → getUserFromToken(sha256(cookie)) ──▶ SELECT session+user
                                expired? delete row → null; user not ACTIVE → null
                                props.user → _app → <AuthProvider initialUser>
POST /api/... (cookie)  ─────▶  requireUser(): Origin check → session → role check
POST /api/auth/logout   ─────▶  DELETE session row; Set-Cookie mc_session=; Max-Age=0
```

| Requirement | How it is met |
|---|---|
| Stay logged in across pages | Cookie is sent on every request; every layout renders the same `Header`, fed by `AuthProvider` |
| Refresh keeps the session | Server re-validates the cookie in `getServerSideProps`; no client storage involved |
| Profile data persists | Profile is read from the database on each protected page and updated via `PATCH /api/auth/me` |
| Logout invalidates | Session row deleted; replaying the old cookie fails (test AUTH-05) |
| Expired sessions redirect safely | Expired rows are deleted on read; pages redirect to `/auth/login?next=…&expired=1`; client API 401s trigger the same redirect |
| Unauthenticated users blocked | `requirePageAuth` / `requireUser` on every protected page and endpoint |
| Role separation | Roles passed to `requirePageAuth`/`requireUser`; booking actions also check the caller's relationship to the booking (customer, shop owner, assigned inspector, admin) |
| No tokens in localStorage | Only an httpOnly cookie; `localStorage` holds nothing auth-related (test AUTH-01). The only `localStorage` use is the inspector's checklist draft and a cross-tab "auth changed" ping |
| CSRF | `SameSite=Lax` plus rejection of cross-origin `Origin` on writes (test AUTH-12) |
| Brute force | 10 login attempts per IP+email per 15 min; sign-up and reset requests limited per IP (in-memory; use Redis with multiple instances) |
| Password changes | Changing a password signs out other devices; reset signs out all devices; reset tokens are single-use, hashed, 1-hour expiry |
| Suspension | Suspending a user or deactivating an inspector deletes their sessions immediately |

## Files

`lib/session.ts`, `lib/ssr-auth.ts`, `context/AuthContext.tsx`, `lib/client.ts`, `app/api/auth/*`, `pages/auth/*`.

No schema change was needed: the existing `Session` and `EmailToken` tables are used as designed.
