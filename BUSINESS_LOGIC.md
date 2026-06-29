# Evoca — Business Logic & Product Decisions

> This document is the authoritative reference for product decisions, billing rules, access control,
> and data model rationale. Keep it updated whenever a decision changes.
> Last updated: 2026-06-29

## Phase Plan Documents

Detailed implementation plans live in `docs/`:

| Phase | Document |
|---|---|
| 0 — Dev Tooling | [docs/phase-0-dev-tooling.md](docs/phase-0-dev-tooling.md) |
| 1 — Billing Foundation | [docs/phase-1-billing-foundation.md](docs/phase-1-billing-foundation.md) |
| 2 — Conference Management | [docs/phase-2-conference-management.md](docs/phase-2-conference-management.md) |
| 3 — Q&A Moderation | [docs/phase-3-qa-moderation.md](docs/phase-3-qa-moderation.md) |
| 4 — Presentation Formats | [docs/phase-4-presentation-formats.md](docs/phase-4-presentation-formats.md) |
| 5 — Speaker Experience | [docs/phase-5-speaker-experience.md](docs/phase-5-speaker-experience.md) |
| 6 — Polish & Responsive | [docs/phase-6-polish.md](docs/phase-6-polish.md) |

---

---

## 1. User Identity & Roles

### Single user, multiple roles
A user account (row in `speakers`) can simultaneously be:
- A **Speaker** — submits talks, has a public profile
- An **Organizer** — creates and manages conferences, pays for plans

There is no separate organizer entity. Roles coexist on the same account.

### Billing is per identity concern
- Speaker billing (`speaker_plan`) lives on the `speakers` row.
- Organizer billing is per-event in a separate `organizer_subscriptions` table.
  One user may hold multiple paid events across different billing cycles.

---

## 2. Plans & Pricing

### Speaker Plans

| Plan | Price | Billing | `speaker_plan` value |
|---|---|---|---|
| Free | €0 | — | `free` |
| Speaker Pro Monthly | ~€7/mo | Monthly subscription | `speaker_pro_monthly` |
| Speaker Pro Annual | ~€5/mo (€60/yr) | Annual subscription | `speaker_pro_annual` |

> Speaker Pro is NOT yet live. It will be a separate Stripe product added in a future feature.
> Speakers affiliated to a paid organizer event get Pro features automatically for the duration of that event (see section 4).

### Organizer Plans

| Plan | Price | Billing | `plan` value | Duration |
|---|---|---|---|---|
| Free | €0 | — | `free` | — |
| One-time / Event | €49 | One-time payment | `organizer_onetime` | 7-day event window (see section 3) |
| Monthly | €29/mo | Monthly subscription | `organizer_monthly` | Rolling |
| Annual | €89/mo (billed yearly) | Annual subscription | `organizer_annual` | Rolling, no event cap |

### Currency
- Default currency: **EUR**.
- If `x-vercel-ip-country` header is outside EU/EEA → show **USD** equivalent.
- Fixed rounded USD rates (revisit quarterly):
  - €7 → $8 | €5 → $6 | €29 → $32 | €49 → $54 | €89 → $99
- Currency detection lives in `/api/locale` → returns `{ currency: "EUR" | "USD" }`.

---

## 3. One-time Organizer Plan — 7-Day Event Window

The one-time €49 plan is not a simple 7-days-from-purchase model.

### Flow
1. Organizer pays €49 → gets a "credit" (event slot).
2. Organizer sets their event start and end dates. The window must be ≤ 7 calendar days.
3. Live features unlock **only during the event date window** (from `event_start` to `event_end`).
4. After `event_end`, the event locks automatically.

### Pre-event state (paid but before event start)
- **Available:** all organization features — timetable, tracks, speaker management, branding, etc.
- **Locked:** live reactions, Q&A sessions, speaker joining/participation.
- Organizer cannot start a presentation or live Q&A session before the event starts.

### Post-event state (after event_end)
- All features lock.
- Content remains visible but key actions are blocked (show `<PaywallModal>`).

### Subscription plans (monthly / annual)
- No date window restriction. Live features are always available while subscription is active.
- Annual = unlimited events, no cap on concurrent conferences.

---

## 4. Speaker Affiliation & Feature Unlocking

### Inviting a speaker
- Organizers invite speakers by **email address**.
- If the email matches an existing account → the user is linked to the event.
- If not → an invitation is sent and the account is linked upon signup.

### Affiliation grants
- When a speaker is affiliated to an event run by a **paying organizer**:
  - The speaker gets `is_pro = true` **scoped to that event only**.
  - This is tracked per-event, not as a global account flag.
  - Access expires when the event ends (`event_end`).
- A speaker may be affiliated to multiple events simultaneously.

---

## 5. Access Gating & Paywall

### Gating primitive
All gated features use a `checkGate(role, callback)` pattern via `usePaywall()` context:
```tsx
const { checkGate } = usePaywall()
<button onClick={() => checkGate("organizer", () => startSession())}>Go Live</button>
```
If the user lacks access, `checkGate` opens `<PaywallModal>` instead of calling the callback.

### What is gated behind organizer plan

| Feature | Gated? | Notes |
|---|---|---|
| Live reactions | Yes | Requires active event window |
| Q&A sessions | Yes | Requires active event window |
| Speaker joining/participation | Yes | Requires active event window |
| Conference timetable & tracks | Yes | Org plan required |
| Speaker time slots | Yes | Org plan required |
| Attendee data & analytics | Yes | Org plan required |
| Custom branding | Yes | Org plan required |
| Creating/editing event structure | No | Available on free (prepare before paying) |

> Most of these features are not yet built. This table defines the intended access model for when they are.

### Post-cancellation / expiry behavior
- Content remains fully **visible**.
- Key actions are **blocked** — clicking them opens `<PaywallModal>`.
- No data is deleted on downgrade.

---

## 6. Stripe Integration

### Webhook lookup strategy
- All Checkout sessions must include `metadata: { user_id: user.id }`.
- On `checkout.session.completed`: look up user by `metadata.user_id`, store `stripe_customer_id`.
- On all subsequent subscription events (`customer.subscription.*`): look up by `stripe_customer_id`.

### Webhook events handled
| Event | Action |
|---|---|
| `checkout.session.completed` | Set plan, store `stripe_customer_id`, set `plan_expires_at` for one-time |
| `customer.subscription.updated` | Update plan status |
| `customer.subscription.deleted` | Reset to `free`, clear subscription fields |
| `invoice.payment_failed` | Flag account, notify user (grace period TBD) |

### Webhook secret
`STRIPE_WEBHOOK_SECRET` must be set in environment variables. Created when registering the webhook endpoint in Stripe Dashboard or via CLI.

---

## 7. Database Schema Additions (feat-010)

### `speakers` table — new columns
```sql
stripe_customer_id       text unique,
stripe_subscription_id   text,        -- null for one-time or free
speaker_plan             text not null default 'free',
-- 'free' | 'speaker_pro_monthly' | 'speaker_pro_annual'
```

### New table: `organizer_subscriptions`
```sql
id                   uuid primary key default gen_random_uuid(),
user_id              uuid not null references speakers(user_id) on delete cascade,
stripe_customer_id   text,
stripe_subscription_id text,          -- null for one-time payments
stripe_payment_intent_id text,        -- null for subscriptions
plan                 text not null,   -- 'organizer_onetime' | 'organizer_monthly' | 'organizer_annual'
status               text not null default 'active', -- 'active' | 'expired' | 'cancelled' | 'payment_failed'
event_start          timestamptz,     -- set by organizer after one-time purchase
event_end            timestamptz,     -- event_start + up to 7 days
activated_at         timestamptz,     -- when payment was confirmed
expires_at           timestamptz,     -- null for active subscriptions
created_at           timestamptz not null default now(),
updated_at           timestamptz not null default now()
```

### New table: `event_speaker_affiliations`
```sql
id           uuid primary key default gen_random_uuid(),
event_id     uuid not null references organizer_subscriptions(id) on delete cascade,
speaker_id   uuid not null references speakers(user_id) on delete cascade,
invited_by   uuid not null references speakers(user_id),
email        text not null,
status       text not null default 'pending', -- 'pending' | 'accepted' | 'declined'
created_at   timestamptz not null default now(),
unique(event_id, email)
```

---

## 8. Open / Future Decisions

| Topic | Status | Notes |
|---|---|---|
| Speaker Pro pricing | TBD | ~€7/mo monthly, ~€5/mo annual (€60/yr). Not yet live. |
| Invoice.payment_failed grace period | TBD | How long before access is revoked? |
| One-time: allow multiple activations per account | TBD | Currently: one active event per payment |
| Multi-event organizer on one-time plan | TBD | Currently: each event = new €49 payment |
| Referral / affiliate discounts | TBD | Not planned yet |
| Trial period | TBD | Not planned yet |
