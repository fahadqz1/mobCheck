# Deployment Notes

## Required environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PAYMENT_WEBHOOK_SECRET` | HMAC secret shared with the payment gateway. **Required in production**: the webhook refuses to run without it |
| `UPLOAD_DIR` | Directory for uploaded images (default `apps/web/uploads`). Must be persistent storage; replace `lib/storage.ts` with an S3/R2 driver for multi-instance hosting |
| `NEXT_PUBLIC_APP_URL` | Public base URL |
| `ENABLE_SANDBOX_PAYMENTS` | Leave unset in production. Setting `true` re-enables the simulated checkout |

`JWT_SECRET` is no longer used.

## Steps

1. `npm install --legacy-peer-deps`
2. Take a database backup.
3. `npx prisma migrate deploy` from `packages/database` (applies `20261127000000_…`, additive).
4. Optional, after approval: `node packages/database/scripts/seed-checklists.mjs` (insert-only checklist items).
5. `npm run build -w @mobcheck/web` then `npm run start -w @mobcheck/web`.

## Before going live

- Connect a real payment gateway and point it at `POST /api/payments/webhook` with the `x-webhook-signature` HMAC header; keep the sandbox disabled.
- Configure an email provider and replace the console logging in `api/auth/forgot-password`.
- Run behind HTTPS (cookies are `Secure` in production).
- Move rate limiting to a shared store (Redis) if more than one instance runs.
- Schedule a job to settle expired review windows (currently settled lazily when bookings are viewed).
- Use managed PostgreSQL; the embedded server is for local development only.
