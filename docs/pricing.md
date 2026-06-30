# EVOCA — Pricing Model

> Review doc. Source of truth for plan definitions is [`lib/plans.ts`](../lib/plans.ts).
> Last updated: 2026-06-30.

EVOCA serves **two distinct audiences** with separate pricing. The homepage currently
blurs them; the dedicated `/pricing` page separates them with an audience toggle.

---

## 1. Speakers

Individuals who run live talks (reactions, Q&A, slide control, phone remote).

### Free (live today)
- **Price:** €0 — no credit card required.
- **Limit:** 5 personal talks (`FREE_TALK_LIMIT` in `app/dashboard/page.tsx`).
- **Conference talks** assigned via an accepted affiliation do **not** count toward the 5.
- EVOCA watermark always shown on the live view (enforced in `start-session-button.tsx`).
- This is the **"5 talks free forever, no credit card"** claim — accurate for speakers.

### Speaker Pro (defined but NOT live — `live: false`)
| Billing | Price (EUR) | Price (USD) |
|---|---|---|
| Monthly | €7/mo | $8/mo |
| Annual | €5/mo (billed €60/yr) | $6/mo (billed $72/yr) |

Intended perks (teased on homepage): unlimited talks, hide watermark, analytics.

**What already works:** `speakers.is_pro` column, watermark gating (free = always on,
Pro = optional), account page Pro badge + upgrade prompt.

**What's missing to make it live:**
1. Flip `live: true` on `speaker_pro_monthly` / `speaker_pro_annual` in `lib/plans.ts`.
2. **Webhook branch** — `app/api/stripe/webhook/route.ts` currently rejects any plan where
   `audience !== "organizer"`. Add a speaker branch that sets `speakers.is_pro = true` on
   `checkout.session.completed` and clears it on `customer.subscription.deleted` /
   `invoice.payment_failed`.
3. **Lift the 5-talk limit for Pro** — the dashboard applies `FREE_TALK_LIMIT` regardless of
   `is_pro`; gate it so Pro speakers are unlimited.
4. **Checkout UI** — add a speaker pricing card + checkout button (the checkout route already
   handles generic subscriptions, so no new Stripe primitives are needed).
5. **Analytics** — teased but not built. Either build a basic per-session analytics view or
   drop the claim before launch.

---

## 2. Organizers

Teams running multi-speaker conferences (CFP, scheduling, multiple events). Paid plans live today.

| Plan | Billing | Price (EUR) | Price (USD) | Attendees | Admin seats | Notes |
|---|---|---|---|---|---|---|
| Free | — | €0 | $0 | up to 100 | 1 | Small events. No Stripe plan — implicit when no paid entitlement. |
| One-time Event | one-time | €49 | $54 | unlimited | 1 | Full organizer tools for a single **7-day** event window. |
| Growth | monthly | €29/mo | $32/mo | unlimited | 3 | Unlimited events, billed monthly. |
| Scale | annual | €89/mo (billed €1068/yr) | $99/mo (billed $1188/yr) | unlimited | unlimited | Unlimited everything, billed yearly. |

- EUR is the base currency; USD values are pre-rounded equivalents.
- One-time uses Stripe `payment` mode with a 7-day access window (`accessDays: 7`).
- Growth/Scale use Stripe `subscription` mode; status tracked in `organizer_subscriptions`.
- **Free tier is implicit**: any organizer with no active paid/one-time entitlement resolves
  to `organizer_free` (`ORGANIZER_FREE_LIMITS` in `lib/plans.ts`). No DB row is written.

### Attendee cap & admin seats — advertised, not yet enforced

The **100-attendee** cap and **admin seat** limits are shown on the pricing page and FAQs
but are **not enforced in code yet**. Implementation is planned:

- **Attendee cap** → see [`docs/attendee-cap-plan.md`](./attendee-cap-plan.md)
  (per-session cap, app-injected into PartyKit, read-only/waiting-room overflow).
- **Multi-admin seats** → see [`docs/multi-admin-plan.md`](./multi-admin-plan.md)
  (`conference_members` table, owner-only billing/member management, email invites,
  block-at-invite seat enforcement, grandfather on downgrade).

---

## 3. Open questions for review

1. **Speaker Pro launch** — ship it now (needs the 5 items above) or keep "Coming soon"?
2. **Analytics** — in-scope for Pro at launch, or defer and remove the teaser?
3. **Free tier framing** — keep "5 talks free forever" prominent, or reframe as "Free plan"
   to avoid implying it applies to organizer features?
4. **Annual display** — show Scale as "€89/mo billed annually" (current) or as the €1068 total?
5. **Cap/seat enforcement timing** — when do we build the two planned features
   ([attendee cap](./attendee-cap-plan.md), [multi-admin](./multi-admin-plan.md))? Until then
   the limits are advertised but unenforced.
6. **Pending-invite seat counting** — count pending invites against admin seats, or only
   accepted members? (Plan currently recommends counting accepted + pending.)
