# Multi-Admin (Team) Plan

Status: **Planned** (advertised on pricing, not yet built)

Let organizers invite co-admins to help manage an event. Seats per plan:
**Free 1 / One-time 1 / Growth 3 / Scale unlimited** (from `lib/plans.ts`).

## Decisions (locked)

| Question | Decision |
| --- | --- |
| Membership model | **`conference_members` table.** `conferences.user_id` stays the immutable owner. RLS becomes "owner OR accepted member". |
| Co-admin permissions | **Single `admin` role.** Full event management; **billing + member management are owner-only.** |
| Invite flow | **Email invite + accept link.** Pending row keyed by email; activates on sign-in matching that email. |
| Seat enforcement | **Block at invite time; grandfather on downgrade** (existing admins kept, new invites blocked until under limit). |
| Live (PartyKit) admin rights | **Mint an admin-scoped room token for any accepted member**, not just the owner. |
| Free-tier detection | **Implicit** — no active paid entitlement = `organizer_free` (1 seat). |

## Current architecture (relevant facts)

- `conferences.user_id` is the sole owner. RLS across `conferences` and child
  tables (days, slots, talks, speakers) is `auth.uid() = user_id` (or joined back
  to the owner).
- Live admin powers in PartyKit come from a **Supabase-JWT-derived room token**;
  only the owner currently obtains one.
- Seat numbers already live in `lib/plans.ts` (`adminSeats`) and
  `ORGANIZER_FREE_LIMITS.adminSeats`.

## Design

### 1. Schema — `scripts/0XX_conference_members.sql`

```sql
create table conference_members (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references conferences(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,   -- null until accepted
  email text not null,                                        -- invite target
  role text not null default 'admin' check (role in ('admin')),
  status text not null default 'pending' check (status in ('pending','accepted','revoked')),
  invited_by uuid not null references auth.users(id),
  invite_token text unique,                                   -- for accept link
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (conference_id, email)
);
```

- Owner is **not** stored here (stays on `conferences.user_id`).
- `user_id` is filled when the invitee accepts (matched by email).

### 2. Membership helper (single source of truth for access)

`lib/conference-access.ts`:

```
canManageConference(userId, conferenceId): boolean
  -> userId === conference.owner OR accepted member
isConferenceOwner(userId, conferenceId): boolean
listConferenceAdmins(conferenceId), countAcceptedSeats(conferenceId)
```

A Postgres helper function mirrors this for RLS:

```sql
create function is_conference_member(conf uuid, uid uuid) returns boolean ...
  -- true if uid owns conf OR has an accepted conference_members row
```

### 3. RLS rewrite

- `conferences`: SELECT/UPDATE allowed when `is_conference_member(id, auth.uid())`.
  **DELETE + billing-related columns remain owner-only** (`user_id = auth.uid()`).
- Child tables (days, slots, talks, speakers): replace owner-only policies with
  `is_conference_member(conference_id, auth.uid())`.
- `conference_members`: SELECT for members of that conference; INSERT/UPDATE/DELETE
  **owner-only** (member management is owner-only).
- Keep policies parameterized; no client-trusted values.

### 4. Invite + accept flow

1. Owner enters an email in the dashboard → server action checks seat limit, then
   inserts a `pending` row with an `invite_token`, sends an email with an accept
   link (`/invite/accept?token=...`).
2. Recipient signs in/up. Accept route validates token, ensures the signed-in
   email matches, sets `user_id`, `status='accepted'`, `accepted_at`.
3. Re-invites/resends update the existing row (unique on conference_id+email).
4. Owner can revoke → `status='revoked'` (frees a seat).

### 5. Seat-limit enforcement

- On invite (and on accept), `countAcceptedSeats(conferenceId) + pending` must be
  `< adminSeats` for the owner's plan (`null` = unlimited).
- **Downgrade**: never auto-remove. If current accepted seats exceed the new plan's
  limit, block new invites until the count drops below the limit. Surface
  "X/Y seats used — over your plan limit" in the UI.

### 6. Live admin tokens (PartyKit)

- The room-token endpoint changes from "is owner?" to
  `canManageConference(userId, conferenceId)`. Any accepted member gets an
  **admin-scoped** token → full live moderation.
- No change needed inside the party server's role handling.

### 7. Dashboard UI

- "Team" / "Admins" section on the conference settings page (owner sees full
  controls; co-admins see read-only roster).
- List members + status, invite-by-email form, revoke button, and
  "seats used / plan limit" with an upgrade link to `/pricing?for=organizer`.

## Touch list

- `scripts/0XX_conference_members.sql` (new) — table + `is_conference_member()` +
  RLS updates for conferences/days/slots/talks/speakers/members.
- `lib/conference-access.ts` (new) — access helpers + seat counting.
- `lib/entitlements.ts` — reuse for `adminSeats` per plan (shared with cap plan).
- Conference server actions — invite / accept / revoke; seat checks.
- Room-token endpoint — owner check → `canManageConference`.
- `app/invite/accept/route.ts` (or page) — accept flow.
- Dashboard conference settings — Team management UI.
- Email template — admin invite.

## Edge cases / notes

- **Owner cannot be removed** and isn't a `conference_members` row.
- **Email change / mismatch** at accept time → reject and show guidance.
- **Pending invites count toward seats** to prevent over-inviting (decide: count
  pending or only accepted — recommend counting accepted + pending to be safe).
- **Deleting a conference** cascades members.
- **Revoked member** loses dashboard access (RLS) and should be denied a new room
  token immediately.

## Out of scope (V1)

- Multiple role tiers (moderator vs admin).
- Per-session moderator promotion.
- Transferring ownership.
