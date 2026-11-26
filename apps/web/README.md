# MobCheck Web Application

**Check Before You Buy** — Professional mobile phone inspection platform.

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 14+
- Git

### Installation

1. **Install dependencies:**
   ```bash
   cd apps/web
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Initialize database:**
   ```bash
   cd ../../packages/database
   npm install
   npm run db:migrate
   npm run db:seed
   cd ../../apps/web
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── pages/
│   ├── api/              # REST API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── listings/     # Phone listing endpoints
│   │   ├── shops/        # Shop management endpoints
│   │   ├── inspections/  # Inspection booking endpoints
│   │   ├── reviews/      # Review/rating endpoints
│   │   ├── payments/     # Payment endpoints
│   │   └── admin/        # Admin dashboard endpoints
│   ├── _app.tsx          # App wrapper
│   ├── _document.tsx     # Document wrapper
│   └── [page].tsx        # Page routes
│
├── components/           # React components
├── lib/                  # Utility functions
│   ├── auth.ts          # JWT authentication
│   ├── prisma.ts        # Prisma client
│   ├── validation.ts    # Input validation (Zod)
│   └── [utils].ts       # Other utilities
│
└── styles/              # Global styles
```

## API Documentation

### Authentication

**Register:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CUSTOMER"
}
```

**Login:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

Returns JWT token for use in subsequent requests:
```bash
Authorization: Bearer <token>
```

### Browse Phones (Public)

```bash
GET /api/listings?page=1&limit=10&city=Lahore&brand=Apple
```

### Browse Shops (Public)

```bash
GET /api/shops?page=1&limit=10&city=Lahore
```

### Create Phone Listing (Authenticated)

```bash
POST /api/listings
Authorization: Bearer <token>
Content-Type: application/json

{
  "brandId": "brand-uuid",
  "modelId": "model-uuid",
  "condition": "GOOD",
  "pricePkr": 50000,
  "ptaStatus": "APPROVED",
  "title": "iPhone 15 Pro - Excellent",
  "description": "...",
  "locationCity": "Lahore",
  "locationArea": "Gulberg",
  "sellerContactPreference": "WHATSAPP"
}
```

### Register Shop (Authenticated - SHOP_OWNER)

```bash
POST /api/shops/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Ahmed Mobile Shop",
  "email": "shop@example.com",
  "phone": "03001234567",
  "addressLine1": "Main Bazaar",
  "city": "Lahore",
  "area": "Gulberg"
}
```

### Book Inspection (Authenticated)

```bash
POST /api/inspections/book
Authorization: Bearer <token>
Content-Type: application/json

{
  "brandId": "brand-uuid",
  "modelId": "model-uuid",
  "deviceType": "IPHONE",
  "shopId": "shop-uuid",
  "inspectionDate": "2027-01-15T14:00:00Z"
}
```

### Create Payment (Authenticated)

```bash
POST /api/payments/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookingId": "booking-uuid"
}
```

### Submit Review (Authenticated)

```bash
POST /api/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookingId": "booking-uuid",
  "shopId": "shop-uuid",
  "overallRating": 5,
  "inspectionQuality": 5,
  "professionalism": 5,
  "timeliness": 5,
  "communication": 5,
  "reportAccuracy": 5,
  "reviewText": "Excellent service!"
}
```

### Admin Dashboard (OPS_ADMIN/SUPER_ADMIN)

```bash
GET /api/admin/dashboard
Authorization: Bearer <admin-token>
```

### Verify Shop (Admin Only)

```bash
POST /api/admin/shops/verify
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "shopId": "shop-uuid",
  "approve": true
}
```

## Database

The application uses PostgreSQL with Prisma ORM.

**Key Tables:**
- `users` — All user accounts (customers, shops, inspectors, admin)
- `phoneListing` — Customer phone listings
- `shops` — Mobile shop profiles
- `inspectionBooking` — Inspection bookings with status tracking
- `payment` — Payment transactions
- `review` — Customer reviews
- `payoutLedger` — Shop payout tracking

See `/docs/11_DATABASE.md` for complete schema.

## Available Scripts

```bash
# Development
npm run dev              # Start dev server

# Build & Production
npm run build            # Build for production
npm start                # Start production server

# Type & Lint
npm run type-check       # Check TypeScript errors
npm run lint             # Run ESLint

# Database
npm run db:generate      # Generate Prisma types
```

## Features Implemented

✅ **Authentication**
- User registration (Customer, Shop Owner, Inspector, Admin)
- Secure login with JWT
- Password hashing (bcrypt)

✅ **Marketplace**
- Browse phone brands and models
- Create free phone listings
- Search and filter listings
- Phone condition and PTA status tracking

✅ **Shop Management**
- Shop registration with 30-day free trial
- Rs. 1,200/month subscription (auto-renewable)
- Shop verification workflow (admin)
- Shop directory with verified shops

✅ **Inspection System**
- Book inspections (Rs. 1,000/inspection)
- Shop selection and date/time scheduling
- Payment processing with webhook verification
- Inspection status tracking

✅ **Reviews & Ratings**
- 1-5 star ratings with detailed feedback
- Shop rating aggregation
- Review display on shop profiles

✅ **Payments**
- Secure payment integration (Safepay/PayFast placeholder)
- Webhook processing for payment confirmation
- Payout ledger tracking
- 3-hour customer review window

✅ **Admin Dashboard**
- Shop verification workflow
- Business metrics and analytics
- Payment overview
- User and shop management

## Upcoming Features (Phase 3+)

⏳ **Inspection Checklists**
- Detailed iPhone inspection procedures
- Detailed Android inspection procedures
- Photo evidence capture and annotation

⏳ **PDF Report Generation**
- Professional inspection reports
- QR code for verification
- Public report verification page

⏳ **Inspector Dashboard**
- Assigned inspections
- Checklist completion
- Evidence photo upload

⏳ **Complaints & Shop Suspension**
- Customer complaint system
- Admin complaint review workflow
- Shop suspension/ban capabilities

⏳ **Mobile Apps**
- iOS app (React Native/native)
- Android app (React Native/native)

## Security Considerations

- **Passwords:** Hashed with bcrypt (10 rounds)
- **JWT:** Signed with HS256, 24-hour expiration
- **API:** All sensitive endpoints require authentication
- **HTTPS:** Required in production
- **IMEI:** Masked in reports and listings
- **Webhook Verification:** Signature verification required
- **Idempotency:** Payment idempotency keys prevent duplicates

## Deployment

### Environment Variables

Ensure all `.env.local` variables are set before deployment.

### Database Migrations

```bash
npm run db:migrate:deploy
```

### Build & Start

```bash
npm run build
npm start
```

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

**Port 3000 already in use:**
```bash
npm run dev -- -p 3001
```

**Database connection failed:**
- Check `DATABASE_URL` in `.env.local`
- Ensure PostgreSQL is running
- Verify database exists and is accessible

**JWT authentication errors:**
- Ensure `JWT_SECRET` is set in `.env.local`
- Check token is passed in `Authorization: Bearer <token>` header

## Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Make changes and commit: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/name`
4. Create pull request

See `/CONTRIBUTING.md` for guidelines.

## License

[To be determined]

## Support

For issues and questions, see `/docs` for comprehensive documentation.

---

**Current Status:** MVP Development Phase  
**Last Updated:** November 27, 2026  
**Repository:** MobCheck
