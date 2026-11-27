# MobCheck Design System

All tokens live in `apps/web/tailwind.config.ts`; components live in `apps/web/src/components/ui`.

## Principles

Calm, trustworthy and information-dense: neutral slate surfaces, one brand colour used for primary actions and status, no decorative gradients, real data only (no stock photos in place of user photos, no invented statistics or badges).

## Tokens

| Token | Value | Use |
|---|---|---|
| `brand-700` `#047258` | Primary buttons, links, active nav (5.9:1 on white) |
| `brand-50/100/200` | Selected states, brand badges |
| `ink` `#0b1220` | Headings and body text |
| `slate-50` | Page background · `white` cards · `slate-200` borders |
| `slate-600` | Secondary text (minimum for text on `slate-100`, contrast ≥ 4.5:1) |
| Status | `emerald` success · `amber` warning · `red` danger · `sky` info |
| Font | Inter Variable (self-hosted via `@fontsource-variable/inter`), system fallback |
| Type scale | 12 / 14 (body, UI) / 16 / 18 / 20 / 24 / 28 / 36–48 (home hero) |
| Radius | 8px controls · 12px cards (`rounded-xl`) · 16–20px hero panels |
| Shadow | `card` (resting) · `raised` (hover, menus) · `overlay` (modals, toasts) |
| Spacing | Tailwind 4px scale; page gutter 16/24/32px; card padding 20px; section gap 24–32px |
| Breakpoints | `sm` 640 · `md` 768 (desktop header) · `lg` 1024 (sidebars) · `xl` 1280 · content max width 1200px |

## Components

| Component | File | Notes |
|---|---|---|
| Button / LinkButton | `Button.tsx` | Variants `primary` `secondary` `outline` `ghost` `danger` `whatsapp`; sizes `sm 32px` `md 40px` `lg 48px`; `loading` shows a spinner and sets `aria-busy` |
| Field, Input, Select, Textarea, Checkbox | `Form.tsx` | `Field` wires label, hint and error with `aria-describedby`/`aria-invalid`; errors use `role="alert"` |
| Card, CardHeader, CardBody, StatCard | `Card.tsx` | |
| Badge, Alert, Spinner, Skeleton, EmptyState | `Feedback.tsx` | Badge tones: neutral, brand, success, warning, danger, info |
| Modal | `Modal.tsx` | Portal, focus trap, Esc to close, focus restore, bottom sheet on phones |
| Dropdown | `Dropdown.tsx` | `aria-haspopup="menu"`, outside click and Esc close, first item focused |
| Table, Th, Td | `Table.tsx` | Horizontal scroll inside the card on small screens |
| Toast | `Toast.tsx` | Polite live region, auto-dismiss 4.5s |
| Pagination | `Pagination.tsx` | |
| Rating, Stars, StarInput | `Rating.tsx` | StarInput is a radio group |
| Avatar | `Avatar.tsx` | Initials only; no fake photos |
| Gallery | `media/Gallery.tsx` | 4:3 stage, thumbnails, prev/next, full-screen viewer with arrow keys, lazy-loaded `next/image` |

## Layout

- `SiteLayout`: skip link, sticky 64px header, main, footer.
- `Header`: one component for every page. Auth controls sit in a fixed-width slot that shows a skeleton while the session loads, so buttons never shift (regression test LAYOUT-01 compares their bounding boxes across pages and viewports).
- `DashboardLayout`: role-specific side navigation (horizontal scroller below 1024px), page header with actions.

## States

Every data view has: loading (skeletons or button spinners), empty (EmptyState with a next action), error (Alert or toast with the server message and per-field errors), success (toast, then refreshed server data).
