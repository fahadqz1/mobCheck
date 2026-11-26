# Product Requirements Document (PRD)

**MobCheck — Mobile Phone Marketplace & Professional Inspection Platform**

**Document Version:** 1.0  
**Last Updated:** November 27, 2026  
**Status:** In Development

---

## 1. Product Overview

### Vision
MobCheck is a trusted marketplace and professional inspection platform that empowers customers to buy used phones with confidence, enables mobile shops to access customers, and standardizes device verification across the Pakistani market.

### Tagline
"Check Before You Buy"

### Core Value Propositions

**For Customers:**
- Transparent, professional device verification
- Access to verified mobile shops
- Confidence to purchase used phones
- Clear pricing with no hidden fees
- Inspection reports they can trust

**For Shops:**
- Access to customers seeking professional verification
- Inspection booking system
- Reputation building through reviews
- Subscription-based business model
- Operational analytics

**For Inspectors:**
- Structured, professional workflow
- Clear checklist guidance
- Consistent compensation
- Portfolio building

---

## 2. Product Architecture

### Three Platforms

#### 2.1 Customer & Seller Portal
**URL:** www.mobcheck.pk (or similar)

Public pages:
- Home / Browse
- Phone Details
- Shop Profiles
- How It Works
- Pricing & FAQs
- Trust & Safety

Authenticated areas:
- Customer Dashboard
- Inspection Booking
- Report History
- Shop Ratings & Reviews

#### 2.2 Vendor Management Portal
**URL:** vendor.mobcheck.pk (or suffix)

Features:
- Shop registration and onboarding
- Shop profile management
- Service listings
- Subscription status and billing
- Inspection bookings
- Inspector management
- Analytics dashboard
- Customer communication
- Review management
- Subscription renewals

#### 2.3 Admin Dashboard
**URL:** admin.mobcheck.pk (or suffix)

Features:
- Vendor verification workflow
- Shop performance monitoring
- Financial overview (revenue, payouts, disputes)
- Compliance and audit logs
- Customer support escalations
- Configuration and settings
- Reporting tools

---

## 3. User Roles & Access Control

### 3.1 Role Definitions

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **Customer** | Individual phone buyers/sellers | Browse listings, create listings, book inspections, leave reviews |
| **Seller** | Individual listing owner | Manage own listings, track inquiries |
| **Shop Owner** | Registered mobile shop business | Manage shop profile, receive bookings, manage subscriptions, manage inspectors |
| **Inspector** | Assigned inspector for shop | View assigned bookings, complete checklists, upload evidence |
| **Shop Employee** | Staff member at shop | View bookings, assist with operations (limited permissions) |
| **Support Agent** | Customer support staff | View tickets, respond to customers, process refunds (with approval) |
| **Operations Admin** | Operations management | Approve shops, manage subscriptions, process disputes, oversee payouts |
| **Super Admin** | Full platform control | All permissions, sensitive system configuration |

### 3.2 Permission Matrix

```
Feature                    | Customer | Shop Owner | Inspector | Support | Ops Admin | Super Admin
Create Listing             | ✓        | -          | -         | -       | -         | -
Book Inspection            | ✓        | ✓          | -         | -       | -         | -
Complete Inspection        | -        | -          | ✓         | -       | -         | -
Verify Shop                | -        | -          | -         | -       | ✓         | ✓
Approve Payment            | -        | -          | -         | -       | ✓         | ✓
Process Refund             | -        | -          | -         | ✓       | ✓         | ✓
Suspend Shop               | -        | -          | -         | -       | ✓         | ✓
Configure Pricing          | -        | -          | -         | -       | -         | ✓
Manage Admins              | -        | -          | -         | -       | -         | ✓
```

---

## 4. Customer Journey

### 4.1 Browse & Discovery Flow

```
Homepage
  ├─ Search for phone brand
  ├─ View featured shops
  ├─ Browse by category (Apple/Android)
  └─ Read how inspection works

Category Page
  ├─ Filter by price, condition, PTA status
  ├─ Sort by newest, price, relevance
  └─ View listing cards

Listing Details
  ├─ Full specifications
  ├─ Condition assessment
  ├─ Price
  ├─ Seller information
  ├─ Contact options (WhatsApp, platform chat)
  ├─ Similar listings
  └─ Customer reviews (from verified inspections)
```

### 4.2 Inspection Booking Flow

```
Customer Decision
  │
  ├─ "I want an inspection"
  │
  ├─ Select Device Type (iPhone/Android)
  │
  ├─ Choose Location
  │   └─ View available shops in area
  │
  ├─ Select Shop & Inspector Availability
  │   └─ See available dates/times
  │
  ├─ Confirm Device Details
  │   ├─ Brand, model, storage, color
  │   └─ Current condition (optional)
  │
  ├─ Review Fee
  │   └─ Rs. 1,000 (or current price)
  │
  └─ Payment
      ├─ Secure payment gateway
      ├─ Confirmation email
      └─ Booking reference
```

### 4.3 Post-Inspection Review Flow

```
Report Received
  │
  ├─ Email notification with link
  │
  ├─ View PDF Report
  │   ├─ Detailed findings
  │   ├─ Photo evidence
  │   ├─ Overall assessment
  │   └─ QR verification link
  │
  ├─ 3-Hour Review Window Begins ⏰
  │   ├─ Confirm satisfaction: "Device is as described"
  │   ├─ Raise dispute: "Issues with inspection/report"
  │   └─ No response: Default policy applies
  │
  └─ Next Steps
      ├─ If confirmed: Shop payout processed
      ├─ If dispute: Admin review begins
      └─ Timeline logged
```

### 4.4 Shop Discovery Flow

```
"Find a Shop" Page
  │
  ├─ Map view or list view
  │
  ├─ Filter by location, services, rating
  │
  ├─ Shop Card Shows:
  │   ├─ Shop name & verified badge
  │   ├─ Star rating & review count
  │   ├─ Services offered
  │   ├─ Opening hours
  │   ├─ Distance/location
  │   └─ "View Profile" / "Book Inspection"
  │
  └─ Shop Profile Page
      ├─ Full shop details
      ├─ Photo gallery
      ├─ Available services & pricing
      ├─ Customer reviews
      ├─ Opening hours
      ├─ Map location
      └─ "Book Inspection" button
```

---

## 5. Shop Subscription Model

### 5.1 Free Trial

**Duration:** 30 days from registration

**Features Included:**
- Shop profile listing
- Service posting
- Inspection bookings
- Full feature access

**Notifications:**
- Day 1: Welcome email
- Day 25: "Your trial expires in 5 days"
- Day 29: "2 days until paid subscription begins"
- Day 30: "Your trial ends today. Upgrade now."

### 5.2 Paid Subscription

**Price:** Rs. 1,200/month (configurable)

**Billing:**
- Auto-renewal on anniversary date
- 7 days before renewal: Payment notification
- Payment on file (auto-charge)
- Invoice emailed after payment

**Features:**
- All features from free tier continue
- Priority support
- Performance analytics (future enhancement)
- Featured listing option (future)

### 5.3 Subscription Lapse

**After Payment Failure:**

- Day 1: Payment failed, retry scheduled
- Day 3: Second retry attempt
- Day 7: Final notice, features will restrict
- Day 8+: Features restricted:
  - Profile still visible
  - New booking requests → "Shop temporarily unavailable"
  - No new inspection assignments
  - Can view past bookings (read-only)
  - Shop data preserved

**Reactivation:**
- Payment method updated and processed
- Full features restored immediately
- Booking requests resume

---

## 6. Inspection System

### 6.1 Booking States

```
State Diagram:

Awaiting Payment
    ↓
Payment Confirmed
    ↓
Awaiting Shop Confirmation
    ├─ [Accepted]
    │   ↓
    │   Booking Accepted
    │   ↓
    │   Inspector Assigned
    │   ↓
    │   Inspection in Progress
    │   ↓
    │   Inspection Submitted
    │   ↓
    │   Report Under Review
    │   ↓
    │   Report Delivered
    │   ↓
    │   Customer Review Window (3 hours) ⏰
    │   ├─ [Confirmed] → Completed (Payout Eligible)
    │   ├─ [Disputed] → Dispute Raised
    │   └─ [No Response] → Default Policy Applied
    │
    └─ [Rejected] → Cancelled (Refund Initiated)
```

### 6.2 Inspection Checklists

**iPhone Checklist:** Separate detailed checklist
**Android Checklist:** Separate detailed checklist

(See dedicated documents: 21_CHECKLIST_IPHONE.md, 22_CHECKLIST_ANDROID.md)

### 6.3 Photo Evidence Requirements

Inspector must capture and annotate:

**Required Photos:**
- Front of phone
- Back of phone
- Left side
- Right side
- Top
- Bottom
- Display (powered on)
- Camera area
- Charging port
- Buttons
- Any visible damage (with annotation)

**Annotations:** Inspector can mark defects directly on photos:
- Screen crack
- Frame dent
- Camera damage
- Charging port issue
- Back glass crack
- Button issue
- Display line
- Other defect

---

## 7. Inspection Report

### 7.1 PDF Report Content

**Header:**
- MobCheck logo & branding
- Report ID (unique, scannable)
- Report generation date/time
- QR code for verification

**Device Section:**
- Brand, model, storage, color
- Condition rating
- Masked IMEI
- PTA status & verification source

**Inspection Details:**
- Shop name & location
- Inspector name & ID
- Inspection date/time
- Detailed checklist results
- Photo evidence with annotations

**Assessment:**
- Category (Excellent/Good/Fair/Needs Attention/Critical Issues)
- Key findings highlighted
- Not tested items clearly listed
- Limitations section

**QR Verification:**
- Scannable code
- Links to public verification page
- Prevents report forgery

### 7.2 Public QR Verification Page

**Accessible by:** Anyone with QR code or report ID

**Shows:**
- Report ID and date
- Device details (brand, model only - no IMEI)
- Overall assessment
- "Report Valid" / "Report Revoked" status
- Verification timestamp

**Does NOT show:**
- Full IMEI
- Customer name/email
- Shop owner personal info
- Complete inspection details
- Evidence photos (private)

---

## 8. Payment & Payout Workflow

### 8.1 Customer Payment Flow

```
Booking Created
  │
  ├─ Customer sees: Rs. 1,000 inspection fee
  │
  ├─ Payment Gateway Presented
  │   ├─ Card/Mobile wallet options
  │   ├─ Secure checkout
  │   └─ Payment processing
  │
  └─ Webhook Verification
      ├─ Signature verified
      ├─ Idempotency checked
      ├─ Status recorded
      └─ Booking transitioned to "Payment Confirmed"
```

### 8.2 Three-Hour Review Window

```
Report Delivered (Email + Portal)
  │
  ├─ 3-Hour Timer Starts ⏰
  │
  ├─ Customer Options:
  │   ├─ "Confirm Satisfaction"
  │   │   ├─ Payout becomes eligible immediately
  │   │   └─ Status: Completed
  │   │
  │   ├─ "Raise Dispute"
  │   │   ├─ Description, evidence, reason
  │   │   └─ Status: Dispute Raised (Admin review)
  │   │
  │   └─ No Response (after 3 hours)
  │       ├─ Default policy applied
  │       └─ Payout eligibility determined per policy
  │
  └─ Timeline Logged
      └─ Audit trail for all events
```

### 8.3 Payout Calculation

**Example:**
- Inspection Fee: Rs. 1,000
- Gateway Fee (2%): Rs. 20
- MobCheck Service Margin (20%): Rs. 196
- Shop Payout: Rs. 784

**Configurable via Admin:**
- Inspection fee base price
- MobCheck margin percentage
- Shop payout (derived)

---

## 9. Reviews & Ratings

### 9.1 Review Eligibility

**Can Review:**
- Customers with completed, verified bookings
- After report delivered and review window closed

**Cannot Review:**
- Customers without bookings from that shop
- Unverified bookings
- Bookings with active disputes

### 9.2 Review Content

**Star Rating (1-5):**
- Overall rating

**Category Ratings (1-5):**
- Inspection quality
- Professional behavior
- Timeliness
- Communication
- Report accuracy

**Written Feedback:**
- Text box for detailed comments
- Max 500 characters

**Metadata:**
- Review date
- Verified booking indicator
- Inspector name (for reference)

### 9.3 Shop Rating Display

**Shop Profile Shows:**
- Average star rating (1 decimal place)
- Total review count
- Rating breakdown (% of 5★, 4★, 3★, 2★, 1★)
- Recent reviews (newest first)
- Filter: "Verified Bookings Only"

---

## 10. Complaints & Dispute System

### 10.1 Customer Complaint Categories

Customers can report shops for:
- Fraudulent behavior
- Misleading information
- Poor inspection quality
- Incorrect report
- Payment misconduct
- Fake reviews
- Harassment
- Repeated cancellations
- Other

### 10.2 Admin Complaint Workflow

```
Complaint Submitted
  │
  ├─ Logged with timestamp
  ├─ Auto-categorized
  │
  ├─ Admin Review
  │   ├─ Request evidence from customer
  │   ├─ Interview shop owner
  │   ├─ Review booking/payment records
  │   └─ Analyze history
  │
  ├─ Decision Points
  │   ├─ Unfounded → Dismissed (notify both parties)
  │   ├─ Minor → Warning issued
  │   ├─ Serious → Temporary suspension (7-30 days)
  │   └─ Critical → Permanent ban + refund
  │
  └─ Audit Log
      └─ All actions recorded with reasoning
```

### 10.3 Shop Suspension

**Automatic Triggers:**
- 3+ complaints in 30 days
- Payment processing failures
- Multiple refund requests

**Manual Actions:**
- Admin can suspend/unsuspend
- Admin can permanently ban
- All actions logged with reason
- Appeal process available

---

## 11. Admin Dashboard

### 11.1 Overview Section

**Key Metrics:**
- Total customers
- Active sellers
- Registered shops
- Verified shops
- Active inspectors
- Total listings
- Active listings
- Inspection bookings (this month)
- Completed inspections (this month)
- Cancelled inspections (this month)
- Monthly revenue (subscriptions + inspections)
- Pending payouts
- Active disputes

### 11.2 Shop Management

**Verification Workflow:**
- New registration queue
- Document review (ID, business license, photos)
- Approve / Reject with reason
- Batch operations

**Shop Directory:**
- Search shops by name, location, status
- View profiles, ratings, inspection count
- Suspend / unsuspend
- Review subscription status
- View payout history

### 11.3 Financial Management

**Revenue Dashboard:**
- Subscription revenue (recurring)
- Inspection revenue (one-time)
- Gateway fees (tracked)
- Margin analysis

**Payout Management:**
- Pending payouts list
- 3-hour review window tracker
- Dispatch payouts
- Payout history
- Failure notifications

**Transactions:**
- Payment records
- Gateway references
- Refund records
- Dispute financial impact

### 11.4 Configuration

**Pricing:**
- Inspection fee
- Shop subscription price
- Commission percentage

**System:**
- Platform name
- Inspection review window (hours)
- Free trial duration (days)
- Notification templates
- UI customization

---

## 12. Features Summary by Role

### Customer
- ✅ Register & login
- ✅ Create free phone listing
- ✅ Browse marketplace
- ✅ Search & filter
- ✅ View shop profiles
- ✅ Book inspection
- ✅ Receive PDF report
- ✅ 3-hour review window
- ✅ Leave reviews
- ✅ Report issues
- ✅ View inspection history

### Shop Owner
- ✅ Register shop
- ✅ Manage shop profile
- ✅ Publish services
- ✅ Manage inspectors
- ✅ Receive inspection bookings
- ✅ Accept/reject bookings
- ✅ Track subscription status
- ✅ View analytics
- ✅ Manage reviews
- ✅ View customer complaints

### Inspector
- ✅ View assigned inspections
- ✅ Complete checklist (iPhone/Android)
- ✅ Capture evidence photos
- ✅ Annotate photos
- ✅ Submit inspection
- ✅ Track completion status

### Admin
- ✅ Verify shops
- ✅ Manage users & roles
- ✅ Monitor compliance
- ✅ Handle disputes
- ✅ Process refunds
- ✅ Configure pricing
- ✅ View all analytics
- ✅ Audit logs
- ✅ System configuration

---

## 13. Acceptance Criteria for MVP

The MVP is production-ready when:

- [ ] User registration and email verification work
- [ ] Customer can create free phone listing
- [ ] Shop can register and email verification works
- [ ] Admin can verify shops
- [ ] Shop subscription system works (free trial → paid)
- [ ] Customer can book inspection
- [ ] Payment webhook integration working
- [ ] Inspector dashboard shows assigned inspections
- [ ] Inspector can complete iPhone and Android checklists
- [ ] Photo upload and annotation works
- [ ] PDF report generates correctly
- [ ] QR code links to verification page
- [ ] Email notification for report delivery works
- [ ] 3-hour review window timer works
- [ ] Customer can confirm or dispute
- [ ] Payout is recorded correctly
- [ ] Shop ratings and reviews system works
- [ ] Admin dashboard shows all key metrics
- [ ] Role-based access control enforced
- [ ] Security tests passed
- [ ] Automated tests executed with results
- [ ] No critical or high security vulnerabilities
- [ ] Documentation matches implementation

---

## Document Maintenance

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 27, 2026 | Initial creation |

---

**Next Steps:**
1. Detailed database design and ERD
2. API specification document
3. UI/UX design and wireframes
4. Architecture document
5. Inspection checklists detailed specifications
