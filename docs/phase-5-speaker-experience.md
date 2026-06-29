# Phase 5 — Speaker Experience

> Status: **5.1 shipped ✅ · 5.2 code complete, blocked on server deploy ⚠️**
> Phase 2 (affiliation system) dependency is satisfied.

---

## Goal

Improve the day-to-day experience for speakers: a single place to manage all talks (personal + conference), and a phone remote for controlling slides without needing a laptop clicker.

---

## Features in this phase

| Feature | Status |
|---|---|
| Speaker conference talk portal | **Shipped & browser-verified** |
| Speaker slide control via phone | **Code complete — blocked on PartyKit server deploy** |

---

## ⚠️ Architecture note (as built)

Slide control rides the **PartyKit realtime server** (`SalvadorSC/evoca-server`),
not Supabase Realtime as the 5.2 draft guessed. Crucially, the **currently
deployed** server drops any command not in its `COMMAND_ROLES` allow-list, and
`slide_next`/`slide_prev`/`slide_up`/`slide_down`/`highlight_question` were
**never in it** — so presenter→wall slide sync was already a latent no-op, and
the phone remote's taps are dropped until the server is redeployed.

The fix is folded into the **same staged patch as Phase 3** (`server-patches/`):
those commands are added to `COMMAND_ROLES` (min role `speaker`) and a
`PASSTHROUGH_COMMANDS` set rebroadcasts them without mutating state. **One deploy
unblocks both Phase 3 and Phase 5.2.** The phone remote authenticates with a
short-lived JWT signed with `SUPABASE_JWT_SECRET` carrying `role: "speaker"`,
which the patched server's `jose` verification accepts.

### As built (5.1 — shipped)
- `lib/affiliations.ts` → `getSpeakerConferenceTalks(userId)`: server-only, admin-client,
  strictly `userId`-scoped join across affiliations → conferences → days → slots → subscription.
- `lib/billing.ts` → `conferenceTalkStatus()` / `isConferenceTalkReadOnly()` (derived from event window).
- `components/dashboard/conference-talk-card.tsx` + a "Conference Talks" section in `app/dashboard/page.tsx`
  (with the "don't use your free slot allowance" banner). Verified with `test.affiliated@evoca.test`.

### As built (5.2 — code complete)
- `lib/remote-token.ts` (mint/verify), `app/api/remote/token` (owner-gated mint) + `app/api/remote/validate`.
- `app/remote/[token]/page.tsx` + `components/remote/remote-control.tsx` (swipe/tap, wake lock, slide counter).
- Presenter "Phone remote" button + QR modal in `app/present/[sessionId]/page.tsx`.
- `lib/party.ts` shared host/room constants.

---

## 5.1 Speaker Conference Talk Portal
Files: `app/dashboard/page.tsx` or `app/dashboard/talks/page.tsx`, `components/speaker/ConferenceTalkCard.tsx`

### Problem
Currently, speakers manage personal talks only. When affiliated with a conference, those talks exist in a different context with different rules (no free-tier limit, Pro features unlocked).

### Unified view
- One talks page, two sections:
  1. **Your talks** — personal presentations, counts toward free-tier limit
  2. **Conference talks** — talks affiliated through an organizer's event, do not count toward limit

### Conference talk card
Displays:
- Talk title
- Conference name + event dates
- Organizer name
- Slot time (if assigned)
- Status badge: Upcoming / Live / Past

### Access rules
- Conference talks inherit Pro features for the event window (see `BUSINESS_LOGIC.md` §4)
- After event ends, conference talks become read-only (no editing, no live session)
- Speaker cannot delete a conference talk — only the organizer can remove the assignment

### Free tier interaction
- Free speakers: max N personal talks (limit TBD)
- Conference talks never count toward that limit, even for free speakers
- Banner shown: "Conference talks don't use your free slot allowance"

---

## 5.2 Speaker Slide Remote (Phone Control)
Files: `app/remote/[sessionId]/page.tsx`, `components/remote/RemoteControl.tsx`

### Problem
Speakers need to advance slides without looking at their laptop. Currently no remote control exists.

### How it works
1. Speaker is presenting → sees a "Phone remote" button in presenter view
2. Clicking shows a QR code + short URL (e.g. `/remote/abc123`)
3. Speaker scans QR on their phone → opens remote page (no login required — URL is the auth token)
4. Remote page shows: **Prev / Next / Slide X of Y** — large tap targets
5. Tapping Prev/Next broadcasts the same slide-change event as the existing keyboard controls
6. Phone screen stays on (use `navigator.wakeLock.request('screen')`)

### Technical approach
- Remote URL contains a short-lived signed token (not the session ID directly)
- Token is scoped to: this session + this speaker + expires in 8 hours
- Token generation: `GET /api/remote/token?sessionId=...` → returns `{ token, url }`
- Remote page validates token on load via `GET /api/remote/validate?token=...`
- Slide control via existing realtime channel (Supabase Realtime or equivalent)

### UI on the phone
- Fullscreen, dark background, large buttons
- Current slide number prominently displayed
- Swipe left/right also works (touch event → prev/next)
- No navigation chrome — just the remote

---

## Definition of Done

**5.1 — shipped & browser-verified:**
- [x] Speaker dashboard shows personal talks and conference talks in separate sections
- [x] Conference talks do not count toward free-tier talk limit
- [x] Conference talk cards show conference name, dates, slot time, status badge
- [x] After event ends, conference talks are read-only (status "past", no live-session CTA)

**5.2 — code complete; realtime slide control pending server deploy:**
- [x] Presenter view shows "Phone remote" button with QR code
- [x] Phone remote page works without login (token-authenticated URL)
- [x] Token mint is owner-gated; expires after 8 hours; minted/validated end-to-end (verified)
- [x] Remote UI: swipe + Prev/Next tap targets, slide counter, wake lock
- [ ] **Prev/Next on phone actually advances slides** — blocked: deployed server drops `slide_*`
      until `server-patches/` is deployed (adds them to `COMMAND_ROLES` + passthrough)
- [x] `features.json` feat-009 → done, feat-015 → blocked (see entries)
