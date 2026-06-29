# Phase 1 — Billing Foundation

> Status: **In Progress**
> Blocking: Phase 2 (conference management needs gating), Phase 5 (speaker portal needs affiliation)

---

## Goal

Introduce the full billing system: Stripe integration, plan management, currency detection, access gating primitives, and the account + landing page surfaces that expose plans to users.

---

## Features in this phase

| Feature | Status |
|---|---|
| Account page — username management | Done |
| Account page — plan management (UI stub) | Done |
| Pro waitlist — email capture from landing page | Done |
| Stripe payment integration | Pending |

---

## Stripe Payment Integration — Subtasks

### 1.1 DB Migration
Files: `scripts/004_billing.sql`

- Add to `speakers` table:
  - `stripe_customer_id text unique`
  - `stripe_subscription_id text`
  - `speaker_plan text not null default 'free'`
- Create `organizer_subscriptions` table (see `BUSINESS_LOGIC.md` §7 for full schema)
- Create `event_speaker_affiliations` table (see `BUSINESS_LOGIC.md` §7 for full schema)

**Notes:**
- Run via the Supabase MCP or the existing `scripts/` pattern
- Add RLS policies: users can only read/write their own rows

---

### 1.2 Stripe Products
Files: `scripts/stripe-setup.mjs`

Create 4 products in Stripe:
| Product | Mode | EUR price | USD price |
|---|---|---|---|
| Organizer One-time | `payment` | €49 | $54 |
| Organizer Monthly | `subscription` | €29/mo | $32/mo |
| Organizer Annual | `subscription` | €89/mo (billed €948/yr) | $99/mo (billed $1188/yr) |
| Speaker Pro | `subscription` | TBD (stubbed, not surfaced in UI) | TBD |

Store the resulting price IDs in environment variables:
- `STRIPE_PRICE_ORGANIZER_ONETIME_EUR`
- `STRIPE_PRICE_ORGANIZER_ONETIME_USD`
- `STRIPE_PRICE_ORGANIZER_MONTHLY_EUR`
- `STRIPE_PRICE_ORGANIZER_MONTHLY_USD`
- `STRIPE_PRICE_ORGANIZER_ANNUAL_EUR`
- `STRIPE_PRICE_ORGANIZER_ANNUAL_USD`

---

### 1.3 `/api/locale`
File: `app/api/locale/route.ts`

- Read `x-vercel-ip-country` from request headers
- EU/EEA country codes → return `{ currency: "EUR" }`
- All others → return `{ currency: "USD" }`
- Also return the correct price set for all plans in the detected currency
- Used by the landing page pricing section and the checkout flow

---

### 1.4 `/api/stripe/checkout`
File: `app/api/stripe/checkout/route.ts`

- Auth-protected (reject unauthenticated requests)
- Accepts: `{ plan: string, mode: "payment" | "subscription" }`
- Creates a Stripe Checkout session with:
  - `customer_email`: user's email (pre-fills Stripe form)
  - `metadata: { user_id: user.id }` — used by webhook for lookup
  - Correct price ID based on plan + detected currency
  - `success_url` → `/dashboard/account?checkout=success`
  - `cancel_url` → `/dashboard/account?checkout=cancelled`

---

### 1.5 `/api/stripe/webhook`
File: `app/api/stripe/webhook/route.ts`

Requires `STRIPE_WEBHOOK_SECRET` in env vars.

| Event | Action |
|---|---|
| `checkout.session.completed` | Look up user by `metadata.user_id`. Store `stripe_customer_id`. Insert row into `organizer_subscriptions` with plan + status. For one-time: set `status = 'pending_activation'` (organizer still needs to set event dates). For subscriptions: set `status = 'active'`. |
| `customer.subscription.updated` | Look up by `stripe_customer_id`. Update plan status in `organizer_subscriptions`. |
| `customer.subscription.deleted` | Look up by `stripe_customer_id`. Set `status = 'cancelled'`. |
| `invoice.payment_failed` | Set `status = 'payment_failed'`. Notify user (grace period TBD). |

---

### 1.6 `usePaywall()` + `<PaywallModal>`
Files: `lib/paywall.tsx`, `components/PaywallModal.tsx`

**`usePaywall()` context:**
```ts
type PaywallContext = {
  checkGate: (role: "organizer" | "speaker_pro", callback: () => void) => void
  isOrganizer: boolean
  isSpeakerPro: boolean
}
```

- `checkGate` evaluates the user's current plan and event window status
- If access is valid → calls `callback()`
- If not → opens `<PaywallModal>` instead

**`<PaywallModal>`:**
- Single instance, mounted at root layout
- Shows the relevant plan options with currency-correct prices
- Links to `/api/stripe/checkout` for each plan
- Explains what the user gains by upgrading

---

### 1.7 Account Page — Plan Section
File: `app/dashboard/account/page.tsx`

Replace the current stub plan section with:

**Free users:**
- Show "Free Plan" with list of what they're missing
- CTA to upgrade → opens PaywallModal or links to pricing

**One-time buyers (`organizer_onetime`) — `status: 'pending_activation'`:**
- Show "Event Slot Purchased"
- Date range picker: set `event_start` + `event_end` (max 7-day span)
- On save: `PATCH /api/stripe/activate-event` → updates `organizer_subscriptions`

**One-time buyers — `status: 'active'` (event dates set, before event_start):**
- Show event start/end dates
- Show countdown to event start
- Explain what is available now vs. during the event

**One-time buyers — during event window:**
- Show "Event Live" badge
- Show event end date

**Subscription holders (monthly / annual):**
- Show plan name + next billing date
- "Manage subscription" → Stripe Customer Portal link (`/api/stripe/portal`)

---

### 1.8 Landing Page — Pricing Section
File: `app/page.tsx` (pricing section component)

- Fetch currency from `/api/locale` on load
- Render 4 organizer plan cards: Free / One-time / Monthly / Annual
- Prices displayed in detected currency
- Speaker section: keep existing Pro waitlist card (no Stripe link yet)
- Unauthenticated CTAs → redirect to `/login` then back to `/`
- Authenticated CTAs → call `/api/stripe/checkout` directly

---

## Environment Variables Required

```
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_ORGANIZER_ONETIME_EUR
STRIPE_PRICE_ORGANIZER_ONETIME_USD
STRIPE_PRICE_ORGANIZER_MONTHLY_EUR
STRIPE_PRICE_ORGANIZER_MONTHLY_USD
STRIPE_PRICE_ORGANIZER_ANNUAL_EUR
STRIPE_PRICE_ORGANIZER_ANNUAL_USD
```

---

## Dependencies

- `stripe` npm package (server-side)
- `@stripe/stripe-js` (client-side, for redirect)

---

## Definition of Done

- [ ] DB migration runs without error
- [ ] All 4 Stripe products exist with EUR + USD prices
- [ ] `/api/locale` returns correct currency for EU and non-EU IPs
- [ ] Checkout session creates correctly and redirects to Stripe
- [ ] Webhook handles all 4 events and updates DB correctly
- [ ] `usePaywall()` blocks gated actions for free users
- [ ] Account page shows correct state for each plan type
- [ ] Landing page pricing section shows currency-correct prices
- [ ] `features.json` feat-010 all subtasks marked complete
