# MobCheck Design System — "Liquid" theme

Tokens live in `apps/web/tailwind.config.ts` and `src/styles/globals.css`; components in `apps/web/src/components/ui`.

## Direction

Inspired by the confident, retail-friendly language of refurbished-electronics marketplaces (black pill buttons, one bright accent, pastel category tiles, heavy display type, carousels and trust strips), combined with a "liquid glass" layer: translucent, blurred panels with a light top edge and a sheen that follows the pointer. MobCheck keeps its own logo, name and green "verified" semantics. No third-party brand assets or code are used. Device artwork is original vector illustration; listing photos are only ever real seller uploads.

## Tokens

| Token | Value | Use |
|---|---|---|
| `ink` `#0b1220` | Primary buttons, headings, active chips, announcement bar |
| `lime-300` `#d4f064` | Signature accent: hero, promo panels, accent buttons, highlights on ink. Always paired with ink text (contrast 14:1) |
| `tile-mint/lilac/peach/sky/butter/rose` | Pastel category tiles, promo panels and shop covers without a photo |
| `brand-700` `#047258` | Verified/success semantics only |
| Page background | `#f6f7f4` (warm off-white) · cards white |
| Fonts | Display: Bricolage Grotesque Variable (h1, h2, prices, numbers) · Body: Inter Variable. Both self-hosted |
| Radius | Pills (`rounded-full`) for buttons, chips, inputs in search; 12–16px inputs; 20–28px cards (`rounded-2xl`/`3xl`); 32px hero and promo panels |
| Shadows | `card`, `raised` (hover lift), `overlay`, `glass` (inset highlight + soft drop) |
| Motion | 150ms press scale (0.97), 300ms hover lift, 500ms spring for the liquid tab indicator, 6s float for hero art; all disabled under `prefers-reduced-motion` |

## Glass utilities

| Class | Look | Use |
|---|---|---|
| `.glass` | white 60%, blur 18px, saturate 180%, inset highlight | Cards over colour fields, image badges |
| `.glass-strong` | white 80%, blur 24px | Sticky header, tab indicator |
| `.glass-dark` | ink 55%, blur 18px | Panels on dark sections |
| `.liquid-sheen` + `useSheen()` | radial highlight following the pointer | Promise cards, hero report card |

Under `prefers-reduced-transparency: reduce` glass becomes solid white or ink.

## Components

| Component | Notes |
|---|---|
| Button / LinkButton | Pill. Variants: `primary` (ink), `accent` (lime), `secondary`/`outline` (white with ink ring), `brand` (green), `ghost`, `danger`, `whatsapp`. Sizes 32/40/48px |
| LiquidTabs | Segmented control with a sliding glass indicator; `role="tablist"`, arrow-key navigation |
| Carousel | Snap-scrolling track with round arrows (white = back, ink = forward) that disable at the ends; swipe on touch |
| ListingCard | Inset photo tile, "Inspection available" glass badge, display-font price, hover lift and image zoom |
| ShopCard | Pastel cover (or photo), ink logo tile with lime initials |
| Header | Ink announcement strip; sticky glass header with pill search; category chip row (brands, PTA, shops, sell, verify); mobile sheet with search and chips |
| DeviceArt | Vector phone/fold/shop/report illustrations for category tiles and promos |
| Form, Card, Badge (pill), Alert, Modal, Dropdown, Table, Toast, Rating, Avatar, Gallery | As before, restyled with the tokens above |

## Accessibility guardrails

Text on lime and pastel surfaces is always ink; glass surfaces carry ink text only; focus rings are ink with offset; every interactive element keeps a visible label or accessible name; automated axe checks (WCAG 2.1 AA) run in the regression suite.

## Help, chat and trust patterns (28 Nov 2026)

- **Help button**: fixed bottom-right ink pill with lime ring (`HelpWidget`). Panel is `glass-strong`, max 380px wide on desktop, full width with 12px gutters on phones. Hidden on `/messages` so it never covers the composer. Toasts are centred to avoid it.
- **WhatsApp**: always `#157a3f` with white text (AA). Use `supportWhatsappLink()` so the message is pre-filled consistently.
- **Chat bubbles**: own messages ink, others white; a blocked message is a red-outlined bubble with "Not sent: …"; photos waiting for review show a clock and "Waiting for safety check".
- **Live warning**: red `role="alert"` strip above the composer as soon as a number, email or link is typed.
- **Condition chips** (listing cards, `GRADE` in `ListingCard.tsx`): Brand new — solid green; Like new — light green; Excellent — sky; Good — amber; Fair — orange; For parts — rose. The photo tile behind each card uses the matching pastel.
- **Contact rule**: never render a phone number or email of a user or shop in the UI; use `<ChatButton>` instead.
- **Header category row**: plain-text pill tabs only (active = ink pill). Brands, budget and condition live in the **Phones** menu (solid white panel, opens on hover or click, closes on Escape/outside click/route change). External links (PTA Status) carry an arrow icon and "(opens in a new tab)" for screen readers, and must be `relative` inside scrolling rows.
- **Footer**: trust strip → brand + WhatsApp → four link columns → legal bar + disclaimer. Do not add claims (payment partners, certifications, registration numbers) that are not true yet.
