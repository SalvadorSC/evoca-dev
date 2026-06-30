# Attendee Cap Enforcement Plan

Status: **Planned** (advertised on pricing, not yet enforced)

Enforce the free organizer tier's **100 interactive attendees** limit. Today the
limit is only advertised on the pricing page; nothing in the app counts or gates
attendees.

## Decisions (locked)

| Question | Decision |
| --- | --- |
| What does "100 attendees" count? | **Per live session/room** — max concurrent attendees in a single PartyKit room. |
| How does the room learn the cap? | **App injects it on session start.** PartyKit stores and enforces a number; it has no plan logic. |
| What happens to the 101st attendee? | **Read-only / waiting room.** They still connect and watch, but cannot react / ask / vote. |
| Who counts against the cap? | **Only `attendee`-role connections.** Presenter + co-admins are excluded. |
| How is "free tier" detected? | **Implicit** — any organizer with no active paid/one-time entitlement resolves to `organizer_free` (see `lib/plans.ts` → `ORGANIZER_FREE_LIMITS`). |

## Current architecture (relevant facts)

- One PartyKit room per live session (talk/session). Attendees connect **without a
  token** → role `attendee`. Presenter/admins connect **with a Supabase-JWT-derived
  token** → role `admin`.
- The room already knows its live connections via `room.getConnections()` and
  broadcasts a count. It has **no knowledge of plans or the owning organizer**.
- `lib/plans.ts` is the single source of truth: `ORGANIZER_FREE_LIMITS.maxAttendees = 100`.
- There is **no attendee/viewer DB table** — presence is purely in-room/ephemeral.

## Design

### 1. Resolve the cap in the app (single source of truth)

Add a server-side resolver (e.g. `lib/entitlements.ts`):

```
getOrganizerEntitlements(userId) -> {
  plan: "organizer_free" | "organizer_onetime" | "organizer_monthly" | "organizer_annual"
  maxAttendees: number   // 100 for free, Infinity for any paid/one-time entitlement
  adminSeats: number | null
}
```

- Query active entitlements from billing (`organizer_subscriptions` / one-time access).
- No active entitlement → `organizer_free` (implicit; no DB row written).

### 2. Inject the cap into the room on session start

When the presenter starts/opens a session, the Next.js app POSTs the resolved cap
to the room through an **authenticated room endpoint** (`onRequest` on the party
server), e.g. `{ maxInteractiveAttendees: 100 | null }`.

- PartyKit stores it in room state. `null`/absent → unlimited.
- Re-sent on every session (re)start so plan changes take effect next session.
- Authenticate the call (shared secret / signed payload) so attendees can't spoof it.

### 3. Enforce in the party server (`onConnect`)

On a new `attendee`-role connection:

1. Count current **attendee-role** connections (exclude `admin`/presenter).
2. If `count < cap` → normal interactive attendee.
3. If `count >= cap` → tag the connection as **read-only** (store in connection
   state / attachment).

Broadcast two numbers: `interactiveCount` and `overflowCount`.

### 4. Read-only / waiting-room client UX

- Read-only attendees receive their state on connect (e.g. `mode: "readonly"`).
- Client hides/disables reaction, Q&A, and poll controls and shows a banner:
  "This event is at capacity — you're watching in read-only mode."
- If an interactive attendee leaves and a slot frees, optionally **promote** the
  oldest read-only connection to interactive (broadcast a `promote` message).
  (V1 can skip auto-promotion; document as a follow-up.)

### 5. Organizer upsell

- When a room hits the cap, broadcast a flag the presenter UI reads to show an
  "You hit your free limit — upgrade for unlimited attendees" nudge linking to
  `/pricing?for=organizer`.

## Touch list

- `lib/plans.ts` — already has `ORGANIZER_FREE_LIMITS`; no change.
- `lib/entitlements.ts` (new) — `getOrganizerEntitlements()`.
- `lib/party.ts` — types for room config message + connection mode.
- `server-patches/server.ts` — `onRequest` (receive cap) + `onConnect` (count
  attendee-role, assign read-only), broadcast counts.
- Session start path (presenter "go live") — POST cap to room.
- Live attendee UI — read-only mode banner + disabled controls.
- Presenter UI — capacity reached upsell.

## Edge cases / notes

- **Reconnects & duplicate tabs** still count as separate connections (we chose
  socket counting, not identity dedupe). Acceptable for V1; dedupe is a future
  enhancement.
- **Race at the boundary**: two attendees connecting simultaneously near 100 —
  enforce sequentially in `onConnect`; minor overshoot is tolerable.
- **Plan upgrade mid-session**: takes effect on next session start (cap is injected
  per session). Document this; live re-injection is a possible enhancement.
- **Trust boundary**: cap is enforced server-side in PartyKit, never trusting the
  client. The injecting call must be authenticated.

## Out of scope (V1)

- Auto-promotion of read-only → interactive when slots free (optional follow-up).
- Per-conference or per-account aggregate caps (we chose per-session).
- Identity-based dedupe of connections.
