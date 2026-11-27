# Page Specifications: Phone Listing Detail & Shop Profile

## Phone listing detail — `/listings/[id]`

Server-rendered (`getServerSideProps`); public; `ACTIVE` and `SOLD` listings are visible to everyone, other statuses only to the seller and admins (others get 404).

| Area | Content | Source |
|---|---|---|
| Breadcrumb | Phones › Brand › Model | brand/model |
| Gallery | Cover first, then upload order; 4:3 stage, thumbnails, prev/next, counter, full-screen viewer (←/→/Esc); empty state "The seller hasn't uploaded photos yet" | `ListingPhoto` |
| Summary card | Brand, title, price (PKR), condition, PTA, storage badges, location, listed date, reference `MC-L-XXXXXXXX` | `PhoneListing` |
| Actions (buyer) | Contact seller (modal, creates `ListingInquiry`, notifies seller) · WhatsApp seller (only if the seller chose WhatsApp and has a phone; number only sent to signed-in visitors) · Book a MobCheck inspection (pre-fills the booking form) · Report listing (reason + details, one per user) | APIs under `/api/listings/[id]` |
| Actions (seller) | Manage listing · view count | |
| Specifications | Brand, model, storage, RAM, colour, condition, PTA, battery health (labelled "seller stated") | |
| Description | Seller description, repair history ("Not disclosed by the seller" when empty), accessories, battery note, and a disclaimer that details are seller-provided and not verified by MobCheck | |
| Seller card | First name + last initial, member since, active listings, seller rating or "No ratings yet", linked shop if verified | |
| Safety note | Never pay before seeing the phone | |
| Similar phones | Up to 4 active listings: same model first, then same brand | |

No verification badge is shown on listings, because listings are not inspected unless a booking is made.

## Shop profile — `/shops/[slug]`

Public for `VERIFIED` shops; the owner and admins can preview other statuses with a banner.

| Area | Content | Source |
|---|---|---|
| Header | Cover photo (or neutral surface), logo (or initials), name, "Verified by MobCheck" badge **only** when status is VERIFIED, area/city, live rating and count | `Shop`, `Review` |
| Primary actions | WhatsApp, Book inspection (only when verified and at least one active inspector) | |
| About | Shop description | |
| Services & pricing | Fixed MobCheck inspection price (platform setting), then the shop's active services with prices ("On inspection" for 0) | `ShopService`, `PlatformSetting` |
| Gallery | Shop photos when uploaded | `Shop.galleryUrls` |
| Reviews | Average, distribution by stars, latest 20 reviews with first name + initial, device inspected, recommend flag | published `Review` rows only |
| Visit or contact | Address, Google Maps link (coordinates if set, otherwise address search), hours, holidays, phone, email | |
| Booking availability | Active inspectors, inspection days (inspector availability minus shop holidays), completed inspections | `Inspector` |
| Verification note | Date verified and what was checked | |
| Report a problem | Complaint modal (category + details); signed-in users only | `Complaint` |
