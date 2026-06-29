# Phase 5 — Speaker Experience

> Status: **Pending**
> Blocker: Phase 2 (affiliation system needed for unified portal)

---

## Goal

Improve the day-to-day experience for speakers: a single place to manage all talks (personal + conference), and a phone remote for controlling slides without needing a laptop clicker.

---

## Features in this phase

| Feature | Status |
|---|---|
| Speaker conference talk portal | Pending |
| Speaker slide control via phone | Pending |

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

- [ ] Speaker dashboard shows personal talks and conference talks in separate sections
- [ ] Conference talks do not count toward free-tier talk limit
- [ ] Conference talk cards show conference name, dates, slot time, status
- [ ] After event ends, conference talks are read-only
- [ ] Presenter view shows "Phone remote" button with QR code
- [ ] Phone remote page works without login (token-authenticated URL)
- [ ] Prev/Next on phone controls slides in realtime
- [ ] Wake lock keeps phone screen on during session
- [ ] Token expires after 8 hours
- [ ] `features.json` feat-009, feat-015 marked complete
