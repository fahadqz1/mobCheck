# MobCheck — Mobile Phone Marketplace & Professional Inspection Platform

**Check Before You Buy.**

MobCheck is a trusted Pakistan-based platform to discover mobile phones, find verified mobile shops, book professional phone inspections, and make informed buying decisions.

## Project Status

🚀 **MVP Development Phase** — Initial architecture and requirements in progress.

## What is MobCheck?

MobCheck operates as a hybrid marketplace and professional inspection network for the Pakistani mobile phone market, initially launching in Lahore.

### Three Core Sides

1. **Customers & Individual Sellers** — Browse phones, create listings, book inspections, receive professional reports
2. **Mobile Shops & Service Providers** — Register shops, offer services, receive verified inspection bookings, manage subscriptions
3. **MobCheck Operations** — Admin dashboard, compliance, vendor verification, payout management

## Key Features

### For Customers
- Free phone listings (Apple/Android categories)
- Search and filter by brand, price, condition, PTA status
- Professional inspection booking (Rs. 1,000/inspection)
- PDF inspection reports with QR verification
- Shop ratings and reviews
- 3-hour review window before final payout

### For Shops
- Free first 30 days, then Rs. 1,200/month subscription
- Service listing and pricing
- Inspection booking management
- Performance analytics
- Customer communication
- Subscription management

### For Inspectors
- Separate iPhone and Android checklists
- Photo evidence capture with annotations
- Professional PDF report generation
- Booking status tracking

### For Admin
- Vendor verification workflow
- Compliance and audit logging
- Financial dashboard (revenue, payouts, disputes)
- Shop suspension and complaints management
- Platform configuration

## Technology Stack

- **Frontend:** Next.js, React, TypeScript
- **Backend:** Node.js (Next.js API routes or separate backend)
- **Database:** PostgreSQL with Prisma ORM
- **Storage:** Object storage for inspection evidence
- **Testing:** Playwright (E2E), Jest (Unit)
- **CI/CD:** GitHub Actions
- **Payment:** Integration with Pakistan-compatible gateway (Safepay/PayFast)
- **Report Generation:** PDF and QR code libraries

## Project Structure

```
MobCheck/
├── docs/                    # Complete documentation
│   ├── BRD.md              # Business Requirements Document
│   ├── PRD.md              # Product Requirements Document
│   ├── ARCHITECTURE.md     # System architecture
│   ├── DATABASE.md         # Database design and ERD
│   ├── API.md              # API documentation
│   ├── SECURITY.md         # Security and privacy requirements
│   └── ...
├── apps/
│   ├── web/                # Next.js frontend & API routes
│   └── ...
├── packages/               # Shared utilities
│   ├── ui/                 # UI components
│   ├── types/              # TypeScript types
│   └── ...
├── database/
│   ├── schema.prisma       # Prisma schema
│   ├── migrations/         # Database migrations
│   └── seed.ts            # Seed data
├── tests/
│   ├── e2e/               # End-to-end tests
│   └── unit/              # Unit tests
├── public/
│   └── assets/            # Brand assets, logos, etc.
└── infrastructure/        # Deployment configs
```

## Development Phases

1. **Phase 1:** Repository setup and discovery ✓
2. **Phase 2:** Business analysis (BRD, PRD, personas)
3. **Phase 3:** Architecture and design (database, API, UI)
4. **Phase 4:** MVP development (core features)
5. **Phase 5:** QA and security testing
6. **Phase 6:** Staging deployment
7. **Phase 7:** Lahore business launch preparation

## Quick Start (Development)

```bash
# Clone repository
git clone <repo-url>
cd MobCheck

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local

# Run migrations
npm run db:migrate

# Start development server
npm run dev
```

## Documentation

See `/docs` for complete documentation including:
- Business Requirements Document
- Product Requirements Document
- Database design and ERD
- API specifications
- Security architecture
- QA test cases
- Deployment guide
- Lahore business plan

## Key Business Rules

### Pricing (Configurable)
- **Customer inspection fee:** Rs. 1,000
- **Shop subscription:** Rs. 1,200/month (after 30-day free trial)
- **Free-tier listings:** Unlimited for individual customers

### Inspection Workflow
1. Customer or shop books inspection
2. Payment processed through gateway
3. Inspector completes checklist (iPhone/Android specific)
4. Photo evidence uploaded with annotations
5. PDF report generated with QR verification
6. Report emailed to customer
7. **3-hour customer review/dispute window**
8. Shop payout processed after window or dispute resolution

### Shop Subscription
- First 30 days: **Free**
- Auto-renewed: Rs. 1,200/month
- Clear expiry notifications
- Subscription restrictions clearly documented
- No automatic data deletion on expiry

## Important Notes

### Security & Compliance
- All transactions logged and auditable
- Webhook signature verification required
- Idempotent payment processing (no duplicate charges)
- IMEI masked in public reports
- Full access control by role
- PTA/DIRBS verification workflow documented (requires research)

### Payment Architecture
- Research Pakistan-compatible payment providers
- Build delayed settlement for 3-hour review window
- Implement auditable payout ledger
- Do NOT claim escrow without legal structure

### Data Privacy
- No plaintext storage of credentials
- Sensitive inspection evidence access controlled
- Customer PII protected
- Audit trail for all data access

## MVP Definition of Done

The MVP is launch-ready when:
- ✅ Full customer journey working (listing → inspection → report)
- ✅ Shop registration with subscription working
- ✅ Payment with 3-hour review workflow functioning
- ✅ PDF reports with QR verification generated
- ✅ Admin dashboard operational
- ✅ Security tests passing
- ✅ Automated tests executed with results
- ✅ Documentation matches actual product
- ✅ Staging deployment working

## Contributing

This is an MVP development project. All contributions must:
- Follow TypeScript strict mode
- Include tests for new features
- Update documentation
- Pass security review
- Maintain role-based access control

## License

[To be determined based on ownership and business requirements]

## Contact

For questions about MobCheck development, contact the product team.

---

**Last Updated:** November 27, 2026  
**Status:** Early Development  
**Current Phase:** Foundation & Requirements
