# Database Design & Entity-Relationship Diagram

**MobCheck — Mobile Phone Marketplace & Professional Inspection Platform**

**Document Version:** 1.0  
**Last Updated:** November 27, 2026  
**Status:** Database Design Phase

---

## 1. Database Overview

### Technology Stack
- **Database:** PostgreSQL 14+
- **ORM:** Prisma 5.x
- **Migrations:** Prisma Migrate (auto-generated from schema)
- **Seed Data:** TypeScript seed script

### Design Principles

1. **Data Integrity:** Foreign keys, constraints, unique indexes
2. **Auditability:** Timestamps (createdAt, updatedAt), audit trails
3. **Security:** No plaintext passwords, masked sensitive data, role-based access
4. **Performance:** Strategic indexing, denormalization where needed
5. **Scalability:** Prepared for growth, proper relationships

### Database Size Estimate (Year 1)

| Entity | Estimated Records | Notes |
|--------|------------------|-------|
| Users | 5,000+ | Customers + shops + inspectors |
| Listings | 2,000+ | Customer phone listings |
| Shops | 50-100 | Registered mobile shops |
| Inspections | 1,000+ | Bookings + completed |
| Inspection Results | 15,000+ | Individual checklist items |
| Photos | 50,000+ | Evidence photos (stored externally) |
| Reviews | 500+ | Customer reviews of shops |
| Transactions | 2,000+ | Payment records |

---

## 2. Entity-Relationship Diagram (ERD)

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOBCHECK DATABASE                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   AUTHENTICATION │
├──────────────────┤
│ users            │
│ sessions         │
│ email_tokens     │
└──────────────────┘
         │
    ┌────┴────────────────────────────────────────┐
    │                                             │
┌───▼──────────────┐                 ┌───────────▼──────┐
│   MARKETPLACE    │                 │   SHOP MGMT      │
├──────────────────┤                 ├──────────────────┤
│ listings         │                 │ shops            │
│ listing_photos   │                 │ shop_services    │
│ listing_inquiries│                 │ shop_documents   │
│ brands           │                 │ shop_subscriptions
│ models           │                 │ inspectors       │
└──────────────────┘                 └────────┬─────────┘
                                               │
                                    ┌──────────▼─────────┐
                                    │  INSPECTION SYSTEM │
                                    ├────────────────────┤
                                    │ inspection_bookings│
                                    │ inspection_results │
                                    │ inspection_evidence│
                                    │ inspection_reports │
                                    └────────┬───────────┘
                                             │
         ┌───────────────┬───────────────────┼───────────────────┬──────────────┐
         │               │                   │                   │              │
    ┌────▼────┐  ┌──────▼─────┐  ┌───────────▼───────┐  ┌───────▼──────┐ ┌───▼────────┐
    │ PAYMENTS │  │ COMMUNITY  │  │  ADMIN/OPERATIONS │  │  COMPLIANCE  │ │  LOGGING   │
    ├─────────┤  ├────────────┤  ├───────────────────┤  ├──────────────┤ ├────────────┤
    │payments  │  │reviews     │  │admin_users        │  │complaints    │ │audit_logs  │
    │refunds   │  │ratings     │  │admin_actions      │  │disputes      │ │error_logs  │
    │webhook_logs  │shop_reports   │platform_settings  │  │shop_bans     │ │webhooks    │
    │payout_ledger │               │config_audit       │  │              │ │            │
    └──────────┘  └────────────┘  └───────────────────┘  └──────────────┘ └────────────┘
```

---

## 3. Core Entity Definitions

### 3.1 AUTHENTICATION & USERS

#### users
Stores all user accounts across all roles.

```sql
users {
  id: UUID (PK)
  email: STRING (UNIQUE, NOT NULL)
  password_hash: STRING (NOT NULL, bcrypt)
  first_name: STRING
  last_name: STRING
  phone: STRING
  avatar_url: STRING
  
  -- Role assignment
  role: ENUM (CUSTOMER, SELLER, SHOP_OWNER, INSPECTOR, SUPPORT, OPS_ADMIN, SUPER_ADMIN)
  status: ENUM (ACTIVE, INACTIVE, SUSPENDED, DELETED)
  
  -- Email verification
  email_verified: BOOLEAN (DEFAULT false)
  email_verified_at: TIMESTAMP
  
  -- Relationships to role-specific tables
  customer_profile: → customer_profiles (optional)
  shop_owner_profile: → shop_owner_profiles (optional)
  inspector_profile: → inspectors (optional)
  
  -- Audit
  created_at: TIMESTAMP (NOT NULL)
  updated_at: TIMESTAMP (NOT NULL)
  last_login: TIMESTAMP
  deleted_at: TIMESTAMP (soft delete)
}

Indexes:
  - UNIQUE(email)
  - INDEX(role, status)
  - INDEX(created_at)
```

#### customer_profiles
Profile data for customers.

```sql
customer_profiles {
  id: UUID (PK)
  user_id: UUID (FK → users, NOT NULL, UNIQUE)
  
  -- Profile
  display_name: STRING
  bio: STRING
  preferred_contact: ENUM (EMAIL, WHATSAPP, PLATFORM, PHONE)
  
  -- Address
  city: STRING (e.g., "Lahore")
  area: STRING (e.g., "Gulberg")
  address_line1: STRING
  address_line2: STRING
  zip_code: STRING
  
  -- Statistics
  total_listings: INTEGER (DEFAULT 0)
  total_inspections: INTEGER (DEFAULT 0)
  average_rating: DECIMAL(2,1)
  
  -- Preferences
  notifications_email: BOOLEAN (DEFAULT true)
  notifications_whatsapp: BOOLEAN (DEFAULT false)
  
  created_at: TIMESTAMP (NOT NULL)
  updated_at: TIMESTAMP (NOT NULL)
}

Indexes:
  - UNIQUE(user_id)
  - INDEX(city, area)
```

#### sessions
Manages user sessions (optional if using JWT only).

```sql
sessions {
  id: UUID (PK)
  user_id: UUID (FK → users, NOT NULL)
  
  token: STRING (NOT NULL, UNIQUE)
  expires_at: TIMESTAMP (NOT NULL)
  
  -- Security
  ip_address: STRING
  user_agent: STRING
  
  created_at: TIMESTAMP (NOT NULL)
  
  INDEX(user_id, expires_at)
  INDEX(token)
}
```

#### email_tokens
For password resets, email verification.

```sql
email_tokens {
  id: UUID (PK)
  user_id: UUID (FK → users, NOT NULL)
  
  token: STRING (NOT NULL, UNIQUE)
  type: ENUM (VERIFY_EMAIL, RESET_PASSWORD)
  expires_at: TIMESTAMP (NOT NULL)
  used_at: TIMESTAMP
  
  created_at: TIMESTAMP (NOT NULL)
  
  INDEX(user_id, type, expires_at)
  INDEX(token)
}
```

---

### 3.2 MARKETPLACE

#### brands
Phone brands (Apple, Samsung, OnePlus, etc.).

```sql
brands {
  id: UUID (PK)
  name: STRING (UNIQUE, NOT NULL) -- "Apple", "Samsung", etc.
  slug: STRING (UNIQUE, NOT NULL) -- "apple", "samsung"
  logo_url: STRING
  country_of_origin: STRING
  
  created_at: TIMESTAMP (NOT NULL)
  updated_at: TIMESTAMP (NOT NULL)
  
  INDEX(slug)
}
```

#### models
Phone models for each brand.

```sql
models {
  id: UUID (PK)
  brand_id: UUID (FK → brands, NOT NULL)
  
  name: STRING (NOT NULL) -- "iPhone 15 Pro", "Galaxy S24"
  slug: STRING (NOT NULL)
  release_year: INTEGER
  
  -- Specifications
  base_storage_gb: INTEGER
  base_ram_gb: INTEGER
  storage_options: STRING[] -- ["128", "256", "512", "1000"]
  colors: STRING[]
  
  -- Classification
  category: ENUM (FLAGSHIP, MID_RANGE, BUDGET)
  os: ENUM (IOS, ANDROID)
  
  created_at: TIMESTAMP (NOT NULL)
  updated_at: TIMESTAMP (NOT NULL)
  
  INDEX(brand_id, slug)
}
```

#### listings
Customer phone listings.

```sql
listings {
  id: UUID (PK)
  
  -- Seller
  user_id: UUID (FK → users, NOT NULL) -- Customer/seller
  shop_id: UUID (FK → shops, optional) -- Can be from shop
  
  -- Device details
  brand_id: UUID (FK → brands, NOT NULL)
  model_id: UUID (FK → models, NOT NULL)
  storage_gb: INTEGER
  ram_gb: INTEGER
  color: STRING
  
  -- Condition & pricing
  condition: ENUM (BRAND_NEW, LIKE_NEW, EXCELLENT, GOOD, FAIR, FOR_PARTS)
  price_pkr: DECIMAL(10,2)
  
  -- Device status
  pta_status: ENUM (APPROVED, NON_PTA, UNKNOWN, BLOCKED, NOT_VERIFIED)
  imei_last_4: STRING (last 4 digits only, masked)
  imei_verified: BOOLEAN (DEFAULT false)
  
  -- Accessories
  has_box: BOOLEAN
  has_charger: BOOLEAN
  has_accessories: STRING[]
  warranty_info: STRING
  
  -- Listing info
  title: STRING (NOT NULL)
  description: TEXT
  location_city: STRING
  location_area: STRING
  
  -- Contact
  seller_contact_preference: ENUM (WHATSAPP, EMAIL, PLATFORM, PHONE)
  
  -- Status
  status: ENUM (ACTIVE, SOLD, REMOVED, DRAFT)
  listed_at: TIMESTAMP
  
  -- Statistics
  view_count: INTEGER (DEFAULT 0)
  inquiry_count: INTEGER (DEFAULT 0)
  
  created_at: TIMESTAMP (NOT NULL)
  updated_at: TIMESTAMP (NOT NULL)
  
  INDEX(user_id, status)
  INDEX(brand_id, model_id)
  INDEX(pta_status)
  INDEX(location_city, location_area)
}
```

#### listing_photos
Photo evidence for listings.

```sql
listing_photos {
  id: UUID (PK)
  listing_id: UUID (FK → listings, NOT NULL)
  
  -- File storage
  storage_key: STRING (NOT NULL) -- S3/Storage path
  storage_url: STRING (signed URL, temp)
  mime_type: STRING (image/jpeg, etc.)
  file_size_bytes: INTEGER
  
  -- Metadata
  upload_sequence: INTEGER -- Order of photos
  is_primary: BOOLEAN (DEFAULT false)
  
  created_at: TIMESTAMP (NOT NULL)
  
  INDEX(listing_id, upload_sequence)
}
```

#### listing_inquiries
When customers inquire about listings.

```sql
listing_inquiries {
  id: UUID (PK)
  listing_id: UUID (FK → listings, NOT NULL)
  customer_id: UUID (FK → users, NOT NULL)
  
  message: TEXT
  status: ENUM (OPEN, RESPONDED, CLOSED)
  
  created_at: TIMESTAMP (NOT NULL)
  updated_at: TIMESTAMP (NOT NULL)
  
  INDEX(listing_id, status)
  INDEX(customer_id)
}
```

---

### 3.3 SHOPS & VENDORS

#### shop_owner_profiles
Profile for shop owners.

```sql
shop_owner_profiles {
  id: UUID (PK)
  user_id: UUID (FK → users, NOT NULL, UNIQUE)
  
  cnic: STRING (masked)
  phone_verified: BOOLEAN (DEFAULT false)
  phone_verified_at: TIMESTAMP
  
  created_at: TIMESTAMP (NOT NULL)
  updated_at: TIMESTAMP (NOT NULL)
}
```

#### shops
Mobile shop business profiles.

```sql
shops {
  id: UUID (PK)
  owner_id: UUID (FK → users, NOT NULL) -- Shop owner user
  
  -- Business info
  name: STRING (NOT NULL)
  display_name: STRING
  slug: STRING (UNIQUE)
  description: TEXT
  
  -- Address
  city: STRING (NOT NULL)
  area: STRING (NOT NULL)
  address_line1: STRING (NOT NULL)
  address_line2: STRING
  zip_code: STRING
  latitude: DECIMAL(10,8)
  longitude: DECIMAL(11,8)
  
  -- Contact
  phone: STRING (NOT NULL)
  whatsapp: STRING
  email: STRING (NOT NULL)
  
  -- Operations
  opening_hour: TIME (e.g., "09:00")
  closing_hour: TIME (e.g., "21:00")
  weekly_holidays: STRING[] -- ["Sunday", "Monday"]
  
  -- Verification
  status: ENUM (PENDING, VERIFIED, REJECTED, SUSPENDED, BLOCKED)
  verified_at: TIMESTAMP
  verified_by: UUID (FK → users)
  
  -- Documents
  business_license_url: STRING (storage URL)
  owner_id_url: STRING (storage URL)
  
  -- Subscription
  trial_starts_at: TIMESTAMP (NOT NULL, on registration)
  trial_ends_at: TIMESTAMP (30 days from start)
  
  -- Statistics
  total_inspections: INTEGER (DEFAULT 0)
  completed_inspections: INTEGER (DEFAULT 0)
  cancelled_inspections: INTEGER (DEFAULT 0)
  average_rating: DECIMAL(2,1)
  total_reviews: INTEGER (DEFAULT 0)
  
  created_at: TIMESTAMP (NOT NULL)
  updated_at: TIMESTAMP (NOT NULL)
  
  INDEX(owner_id)
  INDEX(slug)
  INDEX(city, area, status)
  INDEX(status)
}
```

#### shop_subscriptions
Track shop subscription lifecycle.

```sql
shop_subscriptions {
  id: UUID (PK)
  shop_id: UUID (FK → shops, NOT NULL)
  
  -- Subscription lifecycle
  status: ENUM (ACTIVE, TRIAL, EXPIRED, CANCELLED)
  current_period_start: TIMESTAMP
  current_period_end: TIMESTAMP
  
  -- Pricing
  price_pkr: DECIMAL(8,2)
  
  -- Auto-renewal
  auto_renew: BOOLEAN (DEFAULT true)
  
  -- Last payment
  last_payment_date: TIMESTAMP
  last_payment_id: UUID (FK → payments)
  
  created_at: TIMESTAMP (NOT NULL)
  updated_at: TIMESTAMP (NOT NULL)
  
  INDEX(shop_id, status)
  INDEX(current_period_end) -- For expiry notifications
}
```

#### shop_services
Services offered by shops.

```sql
shop_services {
  id: UUID (PK)
  shop_id: UUID (FK → shops, NOT NULL)
  
  name: STRING (NOT NULL) -- "Device Inspection", "Repair", etc.
  description: TEXT
  price_pkr: DECIMAL(8,2)
  
  status: ENUM (ACTIVE, INACTIVE)
  
  created_at: TIMESTAMP (NOT NULL)
  updated_at: TIMESTAMP (NOT NULL)
  
  INDEX(shop_id, status)
}
```

#### shop_documents
Uploaded verification documents.

```sql
shop_documents {
  id: UUID (PK)
  shop_id: UUID (FK → shops, NOT NULL)
  
  document_type: ENUM (BUSINESS_LICENSE, OWNER_ID, OTHER)
  storage_url: STRING (NOT NULL)
  status: ENUM (PENDING, APPROVED, REJECTED)
  rejected_reason: TEXT
  
  created_at: TIMESTAMP (NOT NULL)
  updated_at: TIMESTAMP (NOT NULL)
  
  INDEX(shop_id, status)
}
```

---

### 3.4 INSPECTORS

#### inspectors
Inspector profiles and assignments.

```sql
inspectors {
  id: UUID (PK)
  user_id: UUID (FK → users, NOT NULL, UNIQUE)
  shop_id: UUID (FK → shops, NOT NULL) -- Which shop they work for
  
  -- Verification
  status: ENUM (ACTIVE, INACTIVE, SUSPENDED)
  verified: BOOLEAN (DEFAULT false)
  verified_at: TIMESTAMP
  verified_by: UUID (FK → users)
  
  -- Performance
  total_inspections: INTEGER (DEFAULT 0)
  completed_inspections: INTEGER (DEFAULT 0)
  average_rating: DECIMAL(2,1)
  
  -- Availability
  available_monday: BOOLEAN
  available_tuesday: BOOLEAN
  available_wednesday: BOOLEAN
  available_thursday: BOOLEAN
  available_friday: BOOLEAN
  available_saturday: BOOLEAN
  available_sunday: BOOLEAN
  
  start_time: TIME
  end_time: TIME
  
  created_at: TIMESTAMP (NOT NULL)
  updated_at: TIMESTAMP (NOT NULL)
  
  INDEX(shop_id, status)
  INDEX(user_id)
}
```

---

### 3.5 INSPECTION BOOKINGS & RESULTS

#### inspection_bookings
Core inspection booking records.

```sql
inspection_bookings {
  id: UUID (PK)
  
  -- Parties
  customer_id: UUID (FK → users, NOT NULL)
  shop_id: UUID (FK → shops, NOT NULL)
  inspector_id: UUID (FK → inspectors, optional)
  
  -- Device being inspected
  brand_id: UUID (FK → brands, NOT NULL)
  model_id: UUID (FK → models, NOT NULL)
  device_storage_gb: INTEGER
  device_color: STRING
  
  -- Device status before inspection
  pta_status: ENUM (APPROVED, NON_PTA, UNKNOWN, BLOCKED)
  
  -- Booking details
  device_type: ENUM (IPHONE, ANDROID) -- Which checklist to use
  inspection_date: DATE
  inspection_time: TIME
  location_latitude: DECIMAL(10,8) -- Inspection location
  location_longitude: DECIMAL(11,8)
  
  -- Status flow
  status: ENUM (
    AWAITING_PAYMENT,
    PAYMENT_CONFIRMED,
    AWAITING_SHOP_CONFIRMATION,
    BOOKING_ACCEPTED,
    INSPECTOR_ASSIGNED,
    INSPECTION_IN_PROGRESS,
    INSPECTION_SUBMITTED,
    REPORT_UNDER_REVIEW,
    REPORT_DELIVERED,
    REVIEW_WINDOW_OPEN,
    COMPLETED,
    CANCELLED,
    REFUND_PENDING,
    REFUNDED,
    DISPUTE_RAISED
  )
  
  -- Financial
  inspection_fee_pkr: DECIMAL(8,2)
  payment_id: UUID (FK → payments, optional)
  
  -- Review window
  report_delivered_at: TIMESTAMP
  review_window_expires_at: TIMESTAMP
  customer_confirmed_at: TIMESTAMP
  
  -- Dispute
  dispute_reason: TEXT
  dispute_raised_at: TIMESTAMP
  dispute_resolved_at: TIMESTAMP
  dispute_resolution: TEXT
  
  created_at: TIMESTAMP (NOT NULL)
  updated_at: TIMESTAMP (NOT NULL)
  
  INDEX(customer_id, status)
  INDEX(shop_id, status)
  INDEX(inspector_id)
  INDEX(status)
  INDEX(review_window_expires_at)
}
```

#### inspection_checklists
Master checklist templates for iPhone/Android.

```sql
inspection_checklists {
  id: UUID (PK)
  
  device_type: ENUM (IPHONE, ANDROID) -- Which checklist
  category: STRING -- "Physical Condition", "Display", etc.
  category_sequence: INTEGER -- Order of categories
  
  check_name: STRING (NOT NULL)
  check_sequence: INTEGER -- Order within category
  description: TEXT
  test_instructions: TEXT
  
  -- Configuration
  status: ENUM (ACTIVE, ARCHIVED)
  
  created_at: TIMESTAMP (NOT NULL)
  updated_at: TIMESTAMP (NOT NULL)
  
  INDEX(device_type, category, category_sequence)
}
```

#### inspection_results
Individual check results for each inspection.

```sql
inspection_results {
  id: UUID (PK)
  booking_id: UUID (FK → inspection_bookings, NOT NULL)
  checklist_id: UUID (FK → inspection_checklists, NOT NULL)
  
  -- Result
  result: ENUM (PASS, FAIL, NEEDS_ATTENTION, NOT_TESTED, NOT_VERIFIABLE, NOT_APPLICABLE)
  inspector_notes: TEXT
  
  -- Evidence
  evidence_photo_id: UUID (FK → inspection_evidence, optional)
  
  -- Timing
  tested_at: TIMESTAMP
  
  created_at: TIMESTAMP (NOT NULL)
  updated_at: TIMESTAMP (NOT NULL)
  
  INDEX(booking_id)
}
```

#### inspection_evidence
Photo evidence from inspections.

```sql
inspection_evidence {
  id: UUID (PK)
  booking_id: UUID (FK → inspection_bookings, NOT NULL)
  
  -- File storage
  storage_key: STRING (NOT NULL) -- S3/Storage path
  storage_url: STRING (temp signed URL)
  mime_type: STRING
  file_size_bytes: INTEGER
  
  -- Annotations
  annotation_type: ENUM (SCREEN_CRACK, FRAME_DENT, CAMERA_DAMAGE, CHARGING_PORT, 
                         BACK_GLASS_CRACK, BUTTON_ISSUE, DISPLAY_LINE, OTHER)
  annotation_text: STRING
  annotation_coordinates: JSON -- {x, y, width, height}
  
  -- Metadata
  photo_sequence: INTEGER -- Order
  taken_at: TIMESTAMP
  
  created_at: TIMESTAMP (NOT NULL)
  
  INDEX(booking_id, photo_sequence)
}
```

#### inspection_reports
Generated PDF reports.

```sql
inspection_reports {
  id: UUID (PK)
  booking_id: UUID (FK → inspection_bookings, NOT NULL, UNIQUE)
  
  -- Report identity
  report_number: STRING (UNIQUE) -- "MBC-2026-11-001"
  qr_code_id: STRING (UNIQUE)
  
  -- Overall assessment
  overall_assessment: ENUM (EXCELLENT, GOOD, FAIR, NEEDS_ATTENTION, CRITICAL_ISSUES)
  assessment_summary: TEXT
  
  -- File storage
  pdf_storage_key: STRING (NOT NULL)
  pdf_storage_url: STRING (temp signed URL)
  
  -- Verification
  is_verified: BOOLEAN (DEFAULT true)
  verification_requested_at: TIMESTAMP
  verification_completed_at: TIMESTAMP
  
  -- Report versioning
  version: INTEGER (DEFAULT 1)
  supersedes_report_id: UUID (FK → inspection_reports, optional)
  
  created_at: TIMESTAMP (NOT NULL)
  updated_at: TIMESTAMP (NOT NULL)
  
  INDEX(booking_id)
  INDEX(report_number)
  INDEX(qr_code_id)
}
```

---

### 3.6 PAYMENTS & PAYOUTS

#### payments
Customer payments for inspections.

```sql
payments {
  id: UUID (PK)
  
  -- Customer & booking
  customer_id: UUID (FK → users, NOT NULL)
  booking_id: UUID (FK → inspection_bookings, NOT NULL, UNIQUE)
  
  -- Amount
  amount_pkr: DECIMAL(8,2) (NOT NULL)
  gateway_fee_pkr: DECIMAL(8,2) (DEFAULT 0)
  net_amount_pkr: DECIMAL(8,2) -- After fees
  
  -- Payment gateway
  gateway: STRING (e.g., "safepay", "payfast")
  gateway_transaction_id: STRING (UNIQUE)
  gateway_reference: STRING
  
  -- Status
  status: ENUM (PENDING, PROCESSING, SUCCESS, FAILED, CANCELLED, REFUNDED)
  
  -- Webhook
  webhook_received_at: TIMESTAMP
  webhook_verified: BOOLEAN (DEFAULT false)
  webhook_signature_verified: BOOLEAN (DEFAULT false)
  
  -- Idempotency
  idempotency_key: STRING (UNIQUE)
  
  created_at: TIMESTAMP (NOT NULL)
  updated_at: TIMESTAMP (NOT NULL)
  processed_at: TIMESTAMP
  
  INDEX(customer_id, status)
  INDEX(booking_id)
  INDEX(gateway_transaction_id)
  INDEX(idempotency_key)
}
```

#### refunds
Payment refunds and reversals.

```sql
refunds {
  id: UUID (PK)
  payment_id: UUID (FK → payments, NOT NULL)
  booking_id: UUID (FK → inspection_bookings, NOT NULL)
  
  amount_pkr: DECIMAL(8,2) (NOT NULL)
  reason: TEXT (NOT NULL)
  
  -- Gateway
  gateway_refund_id: STRING (UNIQUE)
  
  -- Status
  status: ENUM (PENDING, APPROVED, PROCESSING, SUCCESS, FAILED)
  
  -- Approval
  requested_by: UUID (FK → users)
  approved_by: UUID (FK → users)
  approved_at: TIMESTAMP
  
  created_at: TIMESTAMP (NOT NULL)
  updated_at: TIMESTAMP (NOT NULL)
  
  INDEX(payment_id)
  INDEX(booking_id, status)
}
```

#### payout_ledger
Tracks shop payouts and eligibility.

```sql
payout_ledger {
  id: UUID (PK)
  
  -- Shop payment
  shop_id: UUID (FK → shops, NOT NULL)
  booking_id: UUID (FK → inspection_bookings, NOT NULL, UNIQUE)
  
  -- Amounts
  gross_inspection_fee_pkr: DECIMAL(8,2)
  gateway_fee_pkr: DECIMAL(8,2)
  mobcheck_margin_pkr: DECIMAL(8,2)
  shop_payout_pkr: DECIMAL(8,2)
  
  -- Eligibility
  payment_confirmed: BOOLEAN (DEFAULT false)
  payment_confirmed_at: TIMESTAMP
  
  report_delivered: BOOLEAN (DEFAULT false)
  report_delivered_at: TIMESTAMP
  
  review_window_expires_at: TIMESTAMP
  customer_confirmed: BOOLEAN (DEFAULT false)
  customer_confirmed_at: TIMESTAMP
  
  dispute_active: BOOLEAN (DEFAULT false)
  dispute_resolved: BOOLEAN (DEFAULT false)
  dispute_resolved_at: TIMESTAMP
  
  payout_eligible: BOOLEAN (DEFAULT false)
  payout_eligible_at: TIMESTAMP
  
  -- Payout status
  payout_status: ENUM (PENDING, SCHEDULED, PROCESSING, COMPLETED, FAILED)
  payout_date: DATE
  payout_reference: STRING
  
  created_at: TIMESTAMP (NOT NULL)
  updated_at: TIMESTAMP (NOT NULL)
  
  INDEX(shop_id, payout_status)
  INDEX(payout_eligible_at)
  INDEX(payout_date)
}
```

---

### 3.7 COMMUNITY & FEEDBACK

#### reviews
Customer reviews of shops.

```sql
reviews {
  id: UUID (PK)
  
  -- Parties
  shop_id: UUID (FK → shops, NOT NULL)
  booking_id: UUID (FK → inspection_bookings, NOT NULL, UNIQUE)
  customer_id: UUID (FK → users, NOT NULL)
  
  -- Ratings
  overall_rating: INTEGER (1-5, NOT NULL)
  inspection_quality: INTEGER (1-5)
  professionalism: INTEGER (1-5)
  timeliness: INTEGER (1-5)
  communication: INTEGER (1-5)
  report_accuracy: INTEGER (1-5)
  
  -- Feedback
  review_text: TEXT
  would_recommend: BOOLEAN
  
  -- Status
  status: ENUM (PUBLISHED, FLAGGED, REMOVED)
  
  created_at: TIMESTAMP (NOT NULL)
  updated_at: TIMESTAMP (NOT NULL)
  
  INDEX(shop_id, status)
  INDEX(customer_id)
  INDEX(booking_id)
}
```

#### complaints
Customer complaints about shops.

```sql
complaints {
  id: UUID (PK)
  
  shop_id: UUID (FK → shops, NOT NULL)
  customer_id: UUID (FK → users, NOT NULL)
  booking_id: UUID (FK → inspection_bookings, optional)
  
  category: ENUM (FRAUDULENT, MISLEADING_INFO, POOR_QUALITY, INCORRECT_REPORT, 
                  PAYMENT_ISSUE, FAKE_REVIEWS, HARASSMENT, CANCELLATION, OTHER)
  
  description: TEXT (NOT NULL)
  evidence_urls: STRING[]
  
  -- Status & resolution
  status: ENUM (SUBMITTED, UNDER_REVIEW, RESOLVED, DISMISSED)
  resolution: TEXT
  
  -- Admin actions
  reviewed_by: UUID (FK → users)
  reviewed_at: TIMESTAMP
  
  -- Action taken
  action_taken: ENUM (WARNING, TEMPORARY_SUSPENSION, PERMANENT_BAN, NONE)
  action_taken_at: TIMESTAMP
  
  created_at: TIMESTAMP (NOT NULL)
  updated_at: TIMESTAMP (NOT NULL)
  
  INDEX(shop_id, status)
  INDEX(customer_id, status)
  INDEX(status)
}
```

#### shop_bans
Suspension and ban records.

```sql
shop_bans {
  id: UUID (PK)
  shop_id: UUID (FK → shops, NOT NULL)
  
  ban_type: ENUM (TEMPORARY_SUSPENSION, PERMANENT_BAN)
  reason: TEXT (NOT NULL)
  
  banned_by: UUID (FK → users, NOT NULL)
  banned_at: TIMESTAMP (NOT NULL)
  
  -- For temporary suspensions
  suspended_until: TIMESTAMP
  
  -- Appeal
  appeal_submitted: BOOLEAN (DEFAULT false)
  appeal_text: TEXT
  appeal_submitted_at: TIMESTAMP
  appeal_reviewed_at: TIMESTAMP
  appeal_decision: TEXT
  
  created_at: TIMESTAMP (NOT NULL)
  updated_at: TIMESTAMP (NOT NULL)
  
  INDEX(shop_id, ban_type)
}
```

---

### 3.8 ADMIN & LOGGING

#### admin_actions
Audit trail for admin operations.

```sql
admin_actions {
  id: UUID (PK)
  
  admin_id: UUID (FK → users, NOT NULL)
  action_type: ENUM (SHOP_VERIFY, SHOP_SUSPEND, SHOP_BAN, PAYMENT_REFUND, 
                     DISPUTE_RESOLVE, CONFIG_UPDATE, USER_SUSPEND, OTHER)
  
  entity_type: STRING (e.g., "shop", "booking", "review")
  entity_id: UUID
  
  description: TEXT
  changes: JSON -- What changed
  
  created_at: TIMESTAMP (NOT NULL)
  
  INDEX(admin_id, created_at)
  INDEX(action_type)
}
```

#### webhook_logs
Payment gateway webhook logs.

```sql
webhook_logs {
  id: UUID (PK)
  
  webhook_type: ENUM (PAYMENT_SUCCESS, PAYMENT_FAILED, REFUND_SUCCESS, OTHER)
  gateway: STRING (e.g., "safepay")
  
  gateway_event_id: STRING (UNIQUE)
  payload: JSON (full webhook payload)
  
  signature: STRING
  signature_verified: BOOLEAN
  
  processed: BOOLEAN (DEFAULT false)
  processed_at: TIMESTAMP
  processing_error: TEXT
  
  created_at: TIMESTAMP (NOT NULL)
  
  INDEX(gateway_event_id)
  INDEX(webhook_type, processed)
}
```

#### error_logs
Application error logging.

```sql
error_logs {
  id: UUID (PK)
  
  error_type: STRING
  error_message: TEXT
  stack_trace: TEXT
  
  user_id: UUID (FK → users, optional)
  request_id: STRING
  
  severity: ENUM (INFO, WARNING, ERROR, CRITICAL)
  
  resolved: BOOLEAN (DEFAULT false)
  resolved_at: TIMESTAMP
  
  created_at: TIMESTAMP (NOT NULL)
  
  INDEX(severity, created_at)
  INDEX(error_type)
}
```

#### platform_settings
System configuration.

```sql
platform_settings {
  id: UUID (PK)
  
  setting_key: STRING (UNIQUE, NOT NULL) -- e.g., "inspection_fee_pkr"
  setting_value: STRING (NOT NULL) -- Can be JSON
  setting_type: ENUM (STRING, INTEGER, BOOLEAN, JSON)
  
  description: TEXT
  
  updated_by: UUID (FK → users)
  updated_at: TIMESTAMP (NOT NULL)
  
  created_at: TIMESTAMP (NOT NULL)
  
  INDEX(setting_key)
}
```

---

## 4. Database Constraints & Relationships

### Key Constraints

**Referential Integrity:**
- All foreign keys have ON DELETE RESTRICT or ON DELETE CASCADE as appropriate
- Payment records cannot be deleted if linked to bookings
- User deletion cascades to profiles but preserves audit logs

**Unique Constraints:**
- One user per email
- One session per token
- One profile per user (for each role)
- One subscription per shop
- One report per booking

**Not Null Constraints:**
- Critical fields (user_id, booking_id, amount, payment status)
- Timestamps (created_at, updated_at)

**Check Constraints:**
- Prices >= 0
- Ratings between 1-5
- Coordinates within valid ranges

---

## 5. Indexing Strategy

### High-Priority Indexes (Query Performance)

```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_status ON users(role, status);

-- Shop filtering
CREATE INDEX idx_shops_city_area ON shops(city, area, status);
CREATE INDEX idx_shops_status ON shops(status);

-- Listing search
CREATE INDEX idx_listings_brand_model ON listings(brand_id, model_id);
CREATE INDEX idx_listings_location ON listings(location_city, location_area);
CREATE INDEX idx_listings_pta_status ON listings(pta_status);

-- Booking status tracking
CREATE INDEX idx_bookings_customer_status ON inspection_bookings(customer_id, status);
CREATE INDEX idx_bookings_shop_status ON inspection_bookings(shop_id, status);
CREATE INDEX idx_bookings_review_window ON inspection_bookings(review_window_expires_at);

-- Payment processing
CREATE INDEX idx_payments_customer_status ON payments(customer_id, status);
CREATE INDEX idx_payments_gateway_tx ON payments(gateway_transaction_id);

-- Payout eligibility
CREATE INDEX idx_payout_eligible ON payout_ledger(payout_eligible, payout_status);

-- Subscription expiry
CREATE INDEX idx_subscriptions_expiry ON shop_subscriptions(current_period_end);
```

---

## 6. Data Retention & Archiving

### Retention Policy

| Data | Retention | Archival |
|------|-----------|----------|
| User Accounts | Indefinite (soft delete) | Archive after 2 years inactive |
| Payment Records | 7 years (legal requirement) | Archive after 3 years |
| Inspection Reports | Indefinite | None (permanent record) |
| Photos/Evidence | 3 years | Archive to cold storage |
| Logs | 90 days (application) | Archive to data warehouse |
| Support Tickets | 2 years | Archive after 1 year |

---

## 7. Backup & Disaster Recovery

### Backup Strategy

- **Frequency:** Daily full backup + hourly incremental
- **Retention:** 30-day rolling backup window
- **Location:** Separate data center or cloud region
- **Testing:** Monthly restore test

### Recovery Time Objective (RTO)
- Target: 4 hours
- Critical systems (payments): 1 hour

### Recovery Point Objective (RPO)
- Target: 1 hour of data loss acceptable
- Critical systems: 15 minutes

---

## 8. Migration & Seed Data

### Database Migrations

Using Prisma Migrate:

```bash
npm run db:migrate    # Apply migrations
npm run db:seed       # Seed development data
npm run db:studio     # Visual database browser
```

### Seed Data Categories

**Development Seeds:**
- 5 test users (customer, shop owner, inspector, admin)
- 20 phone brands and 100+ models
- 2-3 test shops with profiles
- Sample listings
- Sample inspections at various stages

**Production Seeds:**
- Base brands and models (data-only)
- Platform settings defaults
- Initial admin user (created separately)

---

## 9. Database Diagram (ASCII ERD)

### Simplified Overview

```
┌─────────────┐
│   USERS     │◄──────┐
└─────────────┘       │
     │  │  │          │
     │  │  └─► SHOP_OWNER_PROFILES
     │  │
     │  └──► CUSTOMER_PROFILES
     │
     │  ┌─────────────► SHOPS
     │  │                   │
     │  │                   ├─► SHOP_SUBSCRIPTIONS
     │  │                   ├─► SHOP_SERVICES
     │  │                   ├─► SHOP_DOCUMENTS
     │  │                   │
     │  │  ┌──────────────► INSPECTORS
     │  │  │                   │
     │  └──┤──────► LISTINGS   │
     │     │            │      │
     │     │            │      │
     │     │  ┌─────────┘  ┌───┴──────────┐
     │     │  │            │              │
     │     └─►│  INSPECTION_BOOKINGS◄─────┘
     │        │      │
     │        └────┬─┴─────────────────┐
     │             │                   │
     │      ┌──────▼──────┐    ┌──────▼──────┐
     │      │ PAYMENTS    │    │ PAYOUT_LEDGER
     │      └─────────────┘    └──────────────┘
     │
     ├─► LISTINGS
     │      │
     │      └─► LISTING_PHOTOS
     │
     ├─► INSPECTION_RESULTS
     │
     ├─► INSPECTION_EVIDENCE
     │
     ├─► INSPECTION_REPORTS
     │
     ├─► REVIEWS
     │
     ├─► COMPLAINTS
     │
     └─► SHOP_BANS
```

---

## 10. Prisma Schema Overview

The Prisma schema will be comprehensive, with:

- 25+ models
- Proper relations (1:1, 1:many, many:many)
- Enums for status fields
- Timestamps (createdAt, updatedAt)
- Indexes for query performance
- Required constraints

---

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Entity Definitions | ✅ Complete | All 25+ entities designed |
| Relationships | ✅ Complete | All FKs and relations defined |
| Constraints | ✅ Complete | Unique, NOT NULL, checks |
| Indexing Strategy | ✅ Complete | High-priority indexes identified |
| Backup Strategy | ✅ Complete | RTO/RPO defined |
| Migration Plan | ✅ Complete | Prisma Migrate approach |
| **Prisma Schema** | ⏳ Next | Schema file to generate |
| **Database Creation** | ⏳ Next | PostgreSQL setup instructions |

---

## Next Steps

1. **Create Prisma schema file** (`packages/database/prisma/schema.prisma`)
2. **Generate TypeScript types** (Prisma generates types automatically)
3. **Create migration** (`npx prisma migrate dev --name init`)
4. **Create seed script** (`packages/database/prisma/seed.ts`)
5. **Document connection** (`.env` configuration)

---

## Document Maintenance

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 27, 2026 | Initial database design and ERD |

---

**Next Document:** API Specification (12_API.md)
